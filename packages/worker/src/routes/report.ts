/**
 * POST /api/report — accept a user-submitted scam report.
 *
 * Pipeline (PRD §7.3 + §14):
 *   1. Verify Supabase JWT from `Authorization: Bearer <token>`.
 *   2. Validate JSON body against `ReportInputSchema` (E.164, category, ≤280 char notes).
 *   3. Require + validate `X-Device-Id` (UUID v4 from iOS Keychain).
 *   4. Derive `ip_subnet` from `CF-Connecting-IP`, truncated to /24.
 *   5. Enforce free-tier 5/month quota via KV.
 *   6. Harden notes (strip phone patterns + profanity) before insert.
 *   7. Insert into `pending_reports` via service-role Supabase.
 *   8. Bump KV counter and return ReportAcceptedResponse.
 *
 * Non-goals for V1:
 *   - Subscription tier lookup for paid-tier velocity limits (§14 Finding 9
 *     bullet 3) lands in V2.
 *   - Promotion to `reports` is handled by the DB trigger in
 *     `003_triggers_and_functions.sql`. Don't replicate that logic here.
 */

import {
  ReportInputSchema,
  DeviceFingerprintSchema,
  FREE_TIER_MONTHLY_REPORT_QUOTA,
  type ReportAcceptedResponse,
} from '@ringdocket/shared';
import type { Env } from '../types';
import { getAnonSupabase, getServiceRoleSupabase } from '../lib/supabase';
import {
  extractBearerToken,
  verifyJwtAndGetUserId,
  UnauthorizedError,
} from '../lib/auth';
import { truncateToSlash24 } from '../lib/ip';
import { hardenNotes } from '../lib/notes-filter';
import { getMonthlyCount, incrementMonthlyCount } from '../lib/rate-limit';
import { jsonError, jsonOk } from '../lib/responses';

export async function handleReport(req: Request, env: Env): Promise<Response> {
  // ---- 1. Auth -----------------------------------------------------------
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

  // ---- 2. Body validation ------------------------------------------------
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, 'invalid_input', 'Body is not valid JSON', undefined, req);
  }
  const parsed = ReportInputSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(
      400,
      'invalid_input',
      'Invalid report payload',
      { issues: parsed.error.issues },
      req,
    );
  }
  const input = parsed.data;

  // ---- 3. Device fingerprint --------------------------------------------
  const deviceHeader = req.headers.get('X-Device-Id') ?? req.headers.get('x-device-id');
  if (!deviceHeader) {
    return jsonError(400, 'invalid_input', 'X-Device-Id header is required', undefined, req);
  }
  const deviceParsed = DeviceFingerprintSchema.safeParse(deviceHeader);
  if (!deviceParsed.success) {
    return jsonError(400, 'invalid_input', 'X-Device-Id must be a UUID', undefined, req);
  }
  const deviceFingerprint = deviceParsed.data;

  // ---- 4. IP /24 ---------------------------------------------------------
  const ip =
    req.headers.get('CF-Connecting-IP') ??
    req.headers.get('cf-connecting-ip') ??
    '';
  let ipSubnet: string;
  try {
    ipSubnet = truncateToSlash24(ip);
  } catch {
    // Without a usable IP we can't enforce the corroboration distinctness
    // check downstream. Reject rather than silently weaken security.
    return jsonError(400, 'invalid_input', 'Could not derive IP subnet', undefined, req);
  }

  // ---- 5. Quota check ----------------------------------------------------
  const used = await getMonthlyCount(env.RATE_LIMIT, userId);
  if (used >= FREE_TIER_MONTHLY_REPORT_QUOTA) {
    return jsonError(
      429,
      'quota_exceeded',
      `Free-tier monthly cap of ${FREE_TIER_MONTHLY_REPORT_QUOTA} reports reached`,
      { used, cap: FREE_TIER_MONTHLY_REPORT_QUOTA },
      req,
    );
  }

  // ---- 6. Notes hardening ------------------------------------------------
  const safeNotes = hardenNotes(input.notes);

  // ---- 7. Insert into pending_reports -----------------------------------
  const supabase = getServiceRoleSupabase(env);
  const row = {
    user_id: userId,
    number: input.number,
    category: input.category,
    notes: safeNotes,
    device_fingerprint: deviceFingerprint,
    ip_subnet: ipSubnet,
  };

  const { data, error } = await supabase
    .from('pending_reports')
    .insert(row)
    .select()
    .single();

  if (error || !data) {
    return jsonError(500, 'internal', 'Failed to record report', undefined, req);
  }

  // ---- 8. Bump counter (best-effort) ------------------------------------
  // If this fails the report is still durable in Postgres — we just under-
  // count. Acceptable. Don't fail the request.
  try {
    await incrementMonthlyCount(env.RATE_LIMIT, userId);
  } catch {
    // swallow — see above
  }

  const response: ReportAcceptedResponse & { quotaRemaining: number } = {
    id: (data as { id: string }).id,
    status: 'pending',
    receivedAt:
      (data as { submitted_at?: string }).submitted_at ?? new Date().toISOString(),
    quotaRemaining: Math.max(0, FREE_TIER_MONTHLY_REPORT_QUOTA - used - 1),
  };

  return jsonOk(response, 200, req);
}
