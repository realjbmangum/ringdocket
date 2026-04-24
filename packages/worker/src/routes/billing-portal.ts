/**
 * POST /api/billing-portal — returns a Stripe Customer Portal URL so
 * the user can manage their subscription (cancel, change plan, update
 * card) without us rebuilding that UI.
 *
 * Looks up the user's Stripe customer id from the subscriptions row,
 * then creates a portal session and returns its URL.
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

export async function handleBillingPortal(
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

  const service = getServiceRoleSupabase(env);
  const { data } = await service
    .from('subscriptions')
    .select('revenuecat_subscriber_id')
    .eq('user_id', userId)
    .maybeSingle();
  const customerId = (data as { revenuecat_subscriber_id: string | null } | null)
    ?.revenuecat_subscriber_id;
  if (!customerId) {
    return jsonError(
      404,
      'not_found',
      'No active subscription — nothing to manage.',
      undefined,
      req,
    );
  }

  const origin = req.headers.get('Origin') ?? 'https://app.ringdocket.com';
  const stripe = getStripe(env);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/app/settings`,
  });

  return jsonOk({ url: session.url }, 200, req);
}
