/**
 * Internal admin routes. Not user-facing — these are wrappers around cron
 * handlers so operators can trigger them on demand without waiting for
 * the next scheduled invocation.
 *
 * Auth: shared secret in the `X-Admin-Token` header, matched against
 * `env.ADMIN_TOKEN`. Token is set via `wrangler secret put ADMIN_TOKEN`
 * or the Cloudflare dashboard.
 *
 * Routes:
 *   POST /_admin/trigger-ftc-ingestion   — runs the FTC cron immediately
 *   POST /_admin/trigger-block-list      — runs the block list generator
 *
 * Timing: these endpoints return as soon as work is handed off via
 * waitUntil when possible, but for manual testing we await the result and
 * return the structured summary so the caller can see what happened.
 */

import type { Env } from '../types';
import { jsonError, jsonOk } from '../lib/responses';
import { ingestFtcComplaints } from '../crons/ftc-ingestion';
import { generateBlockList } from '../crons/block-list-generator';

function requireAdminToken(req: Request, env: Env): Response | null {
  if (!env.ADMIN_TOKEN) {
    return jsonError(
      503,
      'internal',
      'Admin routes disabled: ADMIN_TOKEN not configured',
    );
  }
  const provided =
    req.headers.get('X-Admin-Token') ?? req.headers.get('x-admin-token');
  if (!provided) {
    return jsonError(401, 'unauthorized', 'X-Admin-Token header required');
  }
  if (provided !== env.ADMIN_TOKEN) {
    return jsonError(403, 'forbidden', 'Invalid admin token');
  }
  return null;
}

export async function handleTriggerFtcIngestion(
  req: Request,
  env: Env,
): Promise<Response> {
  const authErr = requireAdminToken(req, env);
  if (authErr) return authErr;

  try {
    const result = await ingestFtcComplaints(env);
    return jsonOk({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin] FTC ingestion failed:', message);
    return jsonError(500, 'internal', `FTC ingestion failed: ${message}`);
  }
}

export async function handleTriggerBlockList(
  req: Request,
  env: Env,
): Promise<Response> {
  const authErr = requireAdminToken(req, env);
  if (authErr) return authErr;

  try {
    const result = await generateBlockList(env);
    return jsonOk({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[admin] block list generation failed:', message);
    return jsonError(500, 'internal', `Block list generation failed: ${message}`);
  }
}
