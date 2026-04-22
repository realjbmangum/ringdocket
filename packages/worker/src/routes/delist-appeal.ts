/**
 * POST /api/delist-appeals — public, unauthenticated delist/appeal form
 * submission. Per PRD §14 Finding 1: users who believe their number was
 * wrongly added must have a visible path to challenge the listing.
 *
 * The endpoint validates input against DelistAppealInputSchema, applies a
 * per-IP-/24 daily quota to prevent abuse, and inserts into
 * public.delist_appeals via the service role (the table is RLS-locked to
 * service role per migration 002).
 *
 * No captcha in V1. The rate limit + the fact that all submissions feed a
 * human-reviewed queue are the first line of defense.
 */

import { DelistAppealInputSchema } from '@ringdocket/shared';
import type { Env } from '../types';
import { getServiceRoleSupabase } from '../lib/supabase';
import { truncateToSlash24 } from '../lib/ip';
import { jsonError, jsonOk } from '../lib/responses';

const DAILY_QUOTA_PER_SUBNET = 5;

export async function handleDelistAppeal(
  req: Request,
  env: Env,
): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, 'invalid_input', 'Body is not valid JSON', undefined, req);
  }
  const parsed = DelistAppealInputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(
      400,
      'invalid_input',
      'Invalid appeal payload',
      { issues: parsed.error.issues },
      req,
    );
  }
  const { challengedNumber, submitterEmail, reason } = parsed.data;

  const ip = req.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  const subnet = truncateToSlash24(ip);
  const quotaKey = `delist-appeal:${subnet}:${new Date().toISOString().slice(0, 10)}`;
  const currentRaw = await env.RATE_LIMIT.get(quotaKey);
  const current = currentRaw ? parseInt(currentRaw, 10) : 0;
  if (current >= DAILY_QUOTA_PER_SUBNET) {
    return jsonError(
      429,
      'rate_limited',
      'Daily submission limit reached for this network. Try again tomorrow.',
      undefined,
      req,
    );
  }

  const supabase = getServiceRoleSupabase(env);
  const { error } = await supabase.from('delist_appeals').insert({
    challenged_number: challengedNumber,
    submitter_email: submitterEmail,
    reason,
  });
  if (error) {
    console.error('[delist-appeal] insert failed:', error.message);
    return jsonError(500, 'internal', 'Could not save your appeal', undefined, req);
  }

  await env.RATE_LIMIT.put(quotaKey, String(current + 1), { expirationTtl: 60 * 60 * 26 });

  return jsonOk({ ok: true, accepted: true }, 200, req);
}
