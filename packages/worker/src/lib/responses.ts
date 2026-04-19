import type { ApiErrorCode, ApiErrorResponse } from '@ringdocket/shared';

/** Build a JSON Response with the canonical ApiErrorResponse shape. */
export function jsonError(
  status: number,
  code: ApiErrorCode,
  error: string,
  details?: Record<string, unknown>,
): Response {
  const body: ApiErrorResponse = details ? { error, code, details } : { error, code };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Build a JSON Response with arbitrary body + status. */
export function jsonOk<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
