import type { SupabaseClient } from '@supabase/supabase-js';

/** Thrown when JWT verification fails or no Authorization header is present. */
export class UnauthorizedError extends Error {
  constructor(message = 'unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Pull a Bearer token out of the standard Authorization header.
 * Throws `UnauthorizedError` if the header is absent or malformed.
 */
export function extractBearerToken(req: Request): string {
  const header = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!header) {
    throw new UnauthorizedError('missing Authorization header');
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match || !match[1]) {
    throw new UnauthorizedError('malformed Authorization header');
  }
  return match[1];
}

/**
 * Verify a Supabase JWT via the anon client and return the user's UUID.
 * The anon client is used deliberately so the service-role key never has
 * to flow through auth verification code.
 */
export async function verifyJwtAndGetUserId(
  anonClient: SupabaseClient,
  token: string,
): Promise<string> {
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user?.id) {
    throw new UnauthorizedError('invalid token');
  }
  return data.user.id;
}

/**
 * Verify a Supabase JWT and return both id + email. Used by admin-gated
 * routes that need the email to check against an allowlist.
 */
export async function verifyJwtAndGetUser(
  anonClient: SupabaseClient,
  token: string,
): Promise<{ id: string; email: string }> {
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data?.user?.id || !data.user.email) {
    throw new UnauthorizedError('invalid token');
  }
  return { id: data.user.id, email: data.user.email };
}
