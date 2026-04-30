/**
 * POST /_admin/simulate-corroboration — test shortcut that adds synthetic
 * corroborators so a pending number reaches the 3-account threshold and
 * gets promoted by the real DB trigger (migration 003).
 *
 * Body: { "number": "+18044989397" }
 *
 * Production safety:
 *   - X-Admin-Token gated (same as other /_admin/* routes).
 *   - Synthetic users get emails like `sim-<uuid>@ringdocket-test.invalid`
 *     so they're identifiable and the domain is RFC-safe-to-own-never.
 *   - Only adds enough corroborators to hit the threshold — no more.
 *   - Idempotent: if the number already has >= 3 distinct corroborators,
 *     does nothing and reports current state.
 *
 * Core logic lives in lib/corroboration.ts and is shared with the
 * session-gated /api/admin/fast-track route.
 */

import type { Env } from '../types';
import { getServiceRoleSupabase } from '../lib/supabase';
import { jsonError, jsonOk } from '../lib/responses';
import { CorroborationError, forceCorroborate } from '../lib/corroboration';

function requireAdminToken(req: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN) {
    return jsonError(503, 'internal', 'Admin routes disabled', undefined, req);
  }
  const provided =
    req.headers.get('X-Admin-Token') ?? req.headers.get('x-admin-token');
  if (provided !== env.ADMIN_TOKEN) {
    return jsonError(403, 'forbidden', 'Invalid admin token', undefined, req);
  }
  return null;
}

export async function handleSimulateCorroboration(
  req: Request,
  env: Env,
): Promise<Response> {
  const authErr = requireAdminToken(req, env);
  if (authErr) return authErr;

  let body: { number?: string };
  try {
    body = (await req.json()) as { number?: string };
  } catch {
    return jsonError(400, 'invalid_input', 'Body is not valid JSON', undefined, req);
  }
  const number = body.number?.trim();
  if (!number) {
    return jsonError(400, 'invalid_input', '`number` is required', undefined, req);
  }

  try {
    const result = await forceCorroborate(getServiceRoleSupabase(env), number);
    return jsonOk(result, 200, req);
  } catch (err) {
    if (err instanceof CorroborationError) {
      return jsonError(err.status, err.code, err.message, undefined, req);
    }
    throw err;
  }
}
