/**
 * POST /api/create-checkout-session — starts a Stripe Checkout flow.
 *
 * Request:
 *   Authorization: Bearer <supabase-jwt>
 *   { priceId: 'price_xxx' }
 *
 * Response:
 *   { url: 'https://checkout.stripe.com/...' }
 *
 * We identify the customer by Supabase auth user (email + user_id in
 * metadata). Stripe will look up or create its own Customer record keyed
 * on the email, and the webhook populates public.subscriptions by
 * matching the user_id from metadata.
 *
 * For the Founding Flagger tier we soft-check the counter BEFORE
 * creating the session — if the cap is filled, bail with 409. The
 * authoritative decrement happens in the webhook via the Postgres
 * trigger in migration 003; this pre-check just avoids sending users
 * to Stripe for a sub that'll roll back.
 */

import type { Env } from '../types';
import { getAnonSupabase, getServiceRoleSupabase } from '../lib/supabase';
import {
  extractBearerToken,
  verifyJwtAndGetUserId,
  UnauthorizedError,
} from '../lib/auth';
import { getStripe } from '../lib/stripe';
import { jsonError, jsonOk } from '../lib/responses';

const FOUNDING_FLAGGER_PRICE_ENV = 'STRIPE_FOUNDING_PRICE_ID';

export async function handleCreateCheckoutSession(
  req: Request,
  env: Env,
): Promise<Response> {
  let userId: string;
  try {
    const token = extractBearerToken(req);
    const anon = getAnonSupabase(env);
    userId = await verifyJwtAndGetUserId(anon, token);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonError(401, 'unauthorized', err.message, undefined, req);
    }
    throw err;
  }

  let body: { priceId?: string };
  try {
    body = (await req.json()) as { priceId?: string };
  } catch {
    return jsonError(400, 'invalid_input', 'Body is not valid JSON', undefined, req);
  }
  const priceId = body.priceId?.trim();
  if (!priceId || !priceId.startsWith('price_')) {
    return jsonError(
      400,
      'invalid_input',
      '`priceId` must be a Stripe price ID',
      undefined,
      req,
    );
  }

  // Pull user email for Stripe Checkout prefill.
  const service = getServiceRoleSupabase(env);
  const { data: userRow } = await service
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle();
  const email = (userRow as { email: string | null } | null)?.email ?? undefined;

  // Founding Flagger pre-check.
  const foundingPriceId = (
    env as unknown as Record<string, string | undefined>
  )[FOUNDING_FLAGGER_PRICE_ENV];
  if (foundingPriceId && priceId === foundingPriceId) {
    const { data: counter } = await service
      .from('founding_flagger_counter')
      .select('claimed, cap')
      .eq('id', 1)
      .maybeSingle();
    const c = counter as { claimed: number; cap: number } | null;
    if (c && c.claimed >= c.cap) {
      return jsonError(
        409,
        'conflict',
        'Founding Flagger has reached its cap of 500 — this tier is closed.',
        { claimed: c.claimed, cap: c.cap },
        req,
      );
    }
  }

  const origin = req.headers.get('Origin') ?? 'https://app.ringdocket.com';
  const returnPath = '/app/settings';

  const stripe = getStripe(env);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    client_reference_id: userId,
    metadata: { user_id: userId },
    subscription_data: {
      metadata: { user_id: userId },
    },
    success_url: `${origin}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${returnPath}?checkout=cancelled`,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return jsonError(500, 'internal', 'Stripe did not return a checkout URL', undefined, req);
  }

  return jsonOk({ url: session.url }, 200, req);
}
