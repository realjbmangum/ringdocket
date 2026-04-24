import Stripe from 'stripe';
import type { Env } from '../types';

/**
 * Stripe client configured for Cloudflare Workers runtime. Uses the
 * native fetch HTTP client (Node http is unavailable in Workers) and
 * skips telemetry (adds extra requests we don't need).
 *
 * Construct inside request handlers — STRIPE_SECRET_KEY is a secret-class
 * env var, not available at module top level.
 */
export function getStripe(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    httpClient: Stripe.createFetchHttpClient(),
    telemetry: false,
  });
}
