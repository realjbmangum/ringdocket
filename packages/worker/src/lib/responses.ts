import type { ApiErrorCode, ApiErrorResponse } from '@ringdocket/shared';

const ALLOWED_ORIGINS = new Set([
  'https://ringdocket.com',
  'https://www.ringdocket.com',
  'https://app.ringdocket.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
]);

/**
 * Pick the Access-Control-Allow-Origin value for the given request. Returns
 * an empty object when the Origin isn't on the allowlist — caller then emits
 * no CORS headers, which fails the browser's preflight by design.
 */
export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Id',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

/** OPTIONS preflight response with CORS headers (or 204 without if origin denied). */
export function handlePreflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(req) });
}

/** Build a JSON Response with the canonical ApiErrorResponse shape. */
export function jsonError(
  status: number,
  code: ApiErrorCode,
  error: string,
  details?: Record<string, unknown>,
  req?: Request,
): Response {
  const body: ApiErrorResponse = details ? { error, code, details } : { error, code };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(req ? corsHeadersFor(req) : {}),
    },
  });
}

/** Build a JSON Response with arbitrary body + status.
 *
 * Sends `Cache-Control: no-store` by default. Every API endpoint we ship
 * is either user-specific (must not be cached cross-user by an edge or
 * client) or live state we want fresh on every read (network stats,
 * pending reports). Without this header iOS URLSession applied
 * heuristic caching to user-state responses, which surfaced as "the web
 * shows the new state but my phone still shows the old one." Routes
 * that genuinely benefit from edge caching can opt in via the override.
 */
export function jsonOk<T>(
  body: T,
  status = 200,
  req?: Request,
  cacheControl: string = 'no-store',
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
      ...(req ? corsHeadersFor(req) : {}),
    },
  });
}
