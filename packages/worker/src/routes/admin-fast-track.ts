/**
 * POST /api/admin/fast-track — session-gated admin shortcut to corroborate
 * a number from the web UI.
 *
 * Body: { "number": "+18044989397" }
 *
 * Auth model:
 *   1. Standard Supabase JWT (Authorization: Bearer <access_token>).
 *   2. Email on the verified session must appear in the comma-separated
 *      ADMIN_USER_EMAILS env var. Empty/unset disables the route.
 *
 * Calls the same forceCorroborate logic as /_admin/simulate-corroboration —
 * synthesizes 3 distinct corroborators if none exist, or tops up to threshold
 * if some pendings are already on file. The DB trigger then promotes.
 */

import type { Env } from '../types';
import { getAnonSupabase, getServiceRoleSupabase } from '../lib/supabase';
import { jsonError, jsonOk } from '../lib/responses';
import { extractBearerToken, UnauthorizedError, verifyJwtAndGetUser } from '../lib/auth';
import { CorroborationError, forceCorroborate } from '../lib/corroboration';

function isAdminEmail(email: string, env: Env): boolean {
  if (!env.ADMIN_USER_EMAILS) return false;
  const allow = env.ADMIN_USER_EMAILS
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}

export async function handleAdminFastTrack(
  req: Request,
  env: Env,
): Promise<Response> {
  let userEmail: string;
  try {
    const token = extractBearerToken(req);
    const user = await verifyJwtAndGetUser(getAnonSupabase(env), token);
    userEmail = user.email;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return jsonError(401, 'unauthorized', err.message, undefined, req);
    }
    throw err;
  }

  if (!isAdminEmail(userEmail, env)) {
    return jsonError(403, 'forbidden', 'Not an admin user', undefined, req);
  }

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
