/**
 * POST /api/stripe-webhook — Stripe subscription lifecycle listener.
 *
 * Events we care about:
 *   - checkout.session.completed     → first subscription, create row
 *   - customer.subscription.updated  → renewal, plan change, status shift
 *   - customer.subscription.deleted  → canceled → mark canceled/expired
 *   - invoice.payment_failed         → mark past_due
 *
 * Signature is verified via STRIPE_WEBHOOK_SECRET. We fetch the raw body
 * as text (not JSON) so the HMAC matches the bytes Stripe signed.
 *
 * The tier → plan mapping pulls from env vars set when products were
 * created:
 *   STRIPE_FULL_MONTHLY_PRICE_ID       → full
 *   STRIPE_FULL_YEARLY_PRICE_ID        → full
 *   STRIPE_FOUNDING_PRICE_ID           → founding_flagger
 *
 * Anything else defaults to 'full' (safe fallback — we'd never know, but
 * the user paid so they get the paid tier).
 */

import type Stripe from 'stripe';
import type { Env } from '../types';
import { getServiceRoleSupabase } from '../lib/supabase';
import { getStripe } from '../lib/stripe';

type Tier = 'free' | 'full' | 'founding_flagger';

function tierForPrice(env: Env, priceId: string | null | undefined): Tier {
  if (!priceId) return 'full';
  const e = env as unknown as Record<string, string | undefined>;
  if (priceId === e.STRIPE_FOUNDING_PRICE_ID) return 'founding_flagger';
  if (
    priceId === e.STRIPE_FULL_MONTHLY_PRICE_ID ||
    priceId === e.STRIPE_FULL_YEARLY_PRICE_ID
  ) {
    return 'full';
  }
  return 'full';
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired' | 'paused' {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'canceled':
    case 'paused':
      return status;
    case 'incomplete':
    case 'incomplete_expired':
      return 'past_due';
    case 'unpaid':
      return 'past_due';
    default:
      return 'expired';
  }
}

async function upsertSubscriptionFromStripe(
  env: Env,
  stripeSub: Stripe.Subscription,
  userIdOverride?: string,
) {
  const service = getServiceRoleSupabase(env);

  const userId =
    userIdOverride ?? (stripeSub.metadata as Record<string, string>)?.user_id;
  if (!userId) {
    console.warn('[stripe-webhook] subscription has no user_id metadata:', stripeSub.id);
    return;
  }

  const priceId = stripeSub.items.data[0]?.price.id ?? null;
  const tier = tierForPrice(env, priceId);
  const status = mapStripeStatus(stripeSub.status);
  const currentPeriodEnd = stripeSub.current_period_end
    ? new Date(stripeSub.current_period_end * 1000).toISOString()
    : null;
  const cancelAt = stripeSub.cancel_at
    ? new Date(stripeSub.cancel_at * 1000).toISOString()
    : null;
  const customerId = typeof stripeSub.customer === 'string'
    ? stripeSub.customer
    : stripeSub.customer?.id ?? null;

  const row = {
    user_id: userId,
    revenuecat_subscriber_id: customerId, // repurposing this column for Stripe customer id
    status,
    tier,
    current_period_end: currentPeriodEnd,
    cancel_at: cancelAt,
  };

  const { error } = await service
    .from('subscriptions')
    .upsert(row, { onConflict: 'user_id' });
  if (error) {
    console.error('[stripe-webhook] subscriptions upsert failed:', error.message);
  }
}

export async function handleStripeWebhook(
  req: Request,
  env: Env,
): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response('STRIPE_WEBHOOK_SECRET not configured', { status: 503 });
  }
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }
  const rawBody = await req.text();

  const stripe = getStripe(env);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.warn('[stripe-webhook] signature verification failed:', msg);
    return new Response(`Webhook signature failed: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.client_reference_id ??
          (session.metadata as Record<string, string>)?.user_id;
        if (session.subscription) {
          const subId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(env, sub, userId ?? undefined);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripe(env, sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const service = getServiceRoleSupabase(env);
        const userId = (sub.metadata as Record<string, string>)?.user_id;
        if (userId) {
          await service
            .from('subscriptions')
            .update({ status: 'canceled', tier: 'free' })
            .eq('user_id', userId);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subId = typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          const service = getServiceRoleSupabase(env);
          const userId = (sub.metadata as Record<string, string>)?.user_id;
          if (userId) {
            await service
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('user_id', userId);
          }
        }
        break;
      }
      default:
        // Acknowledged but unhandled. Stripe retries on non-2xx, so we 200.
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err);
    // Return 500 so Stripe retries — transient errors shouldn't drop the event.
    return new Response('Handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
}
