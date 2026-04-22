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
 */

import type { Env } from '../types';
import { getServiceRoleSupabase } from '../lib/supabase';
import { jsonError, jsonOk } from '../lib/responses';

const THRESHOLD = 3;

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

function uuid(): string {
  // Workers runtime has crypto.randomUUID.
  return crypto.randomUUID();
}

function syntheticSubnet(): string {
  // 10.x.y.0/24 — RFC1918, definitely distinct from real traffic.
  const b = () => Math.floor(Math.random() * 254) + 1;
  return `10.${b()}.${b()}.0/24`;
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
  if (!number || !/^\+[1-9]\d{1,14}$/.test(number)) {
    return jsonError(
      400,
      'invalid_input',
      '`number` must be E.164 format (+15555551234)',
      undefined,
      req,
    );
  }

  const supabase = getServiceRoleSupabase(env);

  // Check current state.
  const { data: existingNumber } = await supabase
    .from('numbers')
    .select('phone, current_state, corroborated_at, first_flag_user_id')
    .eq('phone', number)
    .maybeSingle();

  if (existingNumber && (existingNumber as { current_state: string }).current_state === 'corroborated') {
    return jsonOk(
      {
        ok: true,
        alreadyCorroborated: true,
        number: existingNumber,
        added: 0,
      },
      200,
      req,
    );
  }

  // Count distinct corroborators currently in the 14-day window.
  const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pendings, error: pendErr } = await supabase
    .from('pending_reports')
    .select('user_id, device_fingerprint, ip_subnet')
    .eq('number', number)
    .gte('submitted_at', windowStart);
  if (pendErr) {
    return jsonError(500, 'internal', pendErr.message, undefined, req);
  }

  const users = new Set<string>();
  const devices = new Set<string>();
  const subnets = new Set<string>();
  for (const row of (pendings ?? []) as Array<{
    user_id: string;
    device_fingerprint: string;
    ip_subnet: string;
  }>) {
    users.add(row.user_id);
    devices.add(row.device_fingerprint);
    subnets.add(row.ip_subnet);
  }
  const currentDistinct = Math.min(users.size, devices.size, subnets.size);
  const needed = Math.max(THRESHOLD - currentDistinct, 0);

  if (needed === 0) {
    return jsonOk(
      {
        ok: true,
        alreadyMetThreshold: true,
        added: 0,
        currentDistinct,
      },
      200,
      req,
    );
  }

  const added: Array<{ email: string; userId: string }> = [];
  for (let i = 0; i < needed; i++) {
    const suffix = uuid().slice(0, 8);
    const email = `sim-${suffix}@ringdocket-test.invalid`;
    const password = `sim-${uuid()}`;

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr || !authData?.user) {
      return jsonError(
        500,
        'internal',
        `Could not create synthetic user: ${authErr?.message ?? 'unknown'}`,
        undefined,
        req,
      );
    }
    const userId = authData.user.id;

    // The handle_new_auth_user trigger in migration 003 inserts into
    // public.users automatically. Give it a tick to settle.
    const { error: insertErr } = await supabase.from('pending_reports').insert({
      user_id: userId,
      number,
      category: 'other',
      notes: null,
      device_fingerprint: uuid(),
      ip_subnet: syntheticSubnet(),
    });
    if (insertErr) {
      return jsonError(
        500,
        'internal',
        `Could not insert synthetic pending report: ${insertErr.message}`,
        undefined,
        req,
      );
    }
    added.push({ email, userId });
  }

  // Re-check: after the last INSERT the trigger should have promoted.
  const { data: afterNumber } = await supabase
    .from('numbers')
    .select('phone, current_state, corroborated_at, first_flag_user_id')
    .eq('phone', number)
    .maybeSingle();

  return jsonOk(
    {
      ok: true,
      added: needed,
      syntheticUsers: added,
      number: afterNumber,
    },
    200,
    req,
  );
}
