/**
 * Shared corroboration logic. Used by:
 *   - POST /_admin/simulate-corroboration  (token-gated, ops/test)
 *   - POST /api/admin/fast-track            (session-gated, admin UI)
 *
 * Inserts synthetic pending_reports rows with distinct user_id +
 * device_fingerprint + ip_subnet until the 3-account corroboration
 * threshold is met. The DB trigger in migration 003 then promotes the
 * number into `numbers` with current_state='corroborated'.
 *
 * Idempotent: if the number is already corroborated or already at
 * threshold, returns without writing anything.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiErrorCode } from '@ringdocket/shared';

const THRESHOLD = 3;

function uuid(): string {
  return crypto.randomUUID();
}

function syntheticSubnet(): string {
  // 10.x.y.0/24 — RFC1918, definitely distinct from real traffic.
  const b = () => Math.floor(Math.random() * 254) + 1;
  return `10.${b()}.${b()}.0/24`;
}

export interface NumberRecord {
  phone: string;
  current_state: string;
  corroborated_at: string | null;
  first_flag_user_id: string | null;
}

export type CorroborationResult =
  | { ok: true; alreadyCorroborated: true; added: 0; number: NumberRecord }
  | { ok: true; alreadyMetThreshold: true; added: 0; currentDistinct: number }
  | {
      ok: true;
      added: number;
      syntheticUsers: Array<{ email: string; userId: string }>;
      number: NumberRecord | null;
    };

export class CorroborationError extends Error {
  constructor(public status: number, public code: ApiErrorCode, message: string) {
    super(message);
    this.name = 'CorroborationError';
  }
}

/**
 * Force-corroborate a number. Caller must have done their own auth.
 *
 * @param supabase Service-role client (needed for auth.admin.createUser
 *                 + bypassing RLS on pending_reports inserts).
 * @param number   E.164 phone number, e.g. "+18044989397".
 */
export async function forceCorroborate(
  supabase: SupabaseClient,
  number: string,
): Promise<CorroborationResult> {
  if (!/^\+[1-9]\d{1,14}$/.test(number)) {
    throw new CorroborationError(400, 'invalid_input', '`number` must be E.164 format (+15555551234)');
  }

  const { data: existingNumber } = await supabase
    .from('numbers')
    .select('phone, current_state, corroborated_at, first_flag_user_id')
    .eq('phone', number)
    .maybeSingle();

  if (existingNumber && (existingNumber as NumberRecord).current_state === 'corroborated') {
    return {
      ok: true,
      alreadyCorroborated: true,
      added: 0,
      number: existingNumber as NumberRecord,
    };
  }

  // Count distinct corroborators in the 14-day window.
  const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pendings, error: pendErr } = await supabase
    .from('pending_reports')
    .select('user_id, device_fingerprint, ip_subnet')
    .eq('number', number)
    .gte('submitted_at', windowStart);
  if (pendErr) {
    throw new CorroborationError(500, 'internal', pendErr.message);
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
    return {
      ok: true,
      alreadyMetThreshold: true,
      added: 0,
      currentDistinct,
    };
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
      throw new CorroborationError(
        500,
        'internal',
        `Could not create synthetic user: ${authErr?.message ?? 'unknown'}`,
      );
    }
    const userId = authData.user.id;

    const { error: insertErr } = await supabase.from('pending_reports').insert({
      user_id: userId,
      number,
      category: 'other',
      notes: null,
      device_fingerprint: uuid(),
      ip_subnet: syntheticSubnet(),
    });
    if (insertErr) {
      throw new CorroborationError(
        500,
        'internal',
        `Could not insert synthetic pending report: ${insertErr.message}`,
      );
    }
    added.push({ email, userId });
  }

  // Re-check: the trigger should have promoted after the last insert.
  const { data: afterNumber } = await supabase
    .from('numbers')
    .select('phone, current_state, corroborated_at, first_flag_user_id')
    .eq('phone', number)
    .maybeSingle();

  return {
    ok: true,
    added: needed,
    syntheticUsers: added,
    number: (afterNumber as NumberRecord | null) ?? null,
  };
}
