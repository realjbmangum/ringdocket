/**
 * Ringdocket API Worker
 *
 * Routes handled here:
 *   GET  /api/health   — liveness probe
 *   POST /api/report   — user-submitted scam report (PRD §7.3)
 *
 * Cloudflare rules this file must respect (per CLAUDE.md):
 *   - Read secrets from `env` INSIDE the handler, never at module top-level.
 *     Secret-type bindings are not defined at build time.
 *   - event.waitUntil() for non-blocking logging, not top-level await.
 *   - No `pdf-parse` / `mammoth` imports here — both are incompatible with
 *     the Workers runtime.
 *
 * Cron handler stub remains for Phase 3 (corroboration promotion + block
 * list snapshots).
 */

import type { Env } from './types';
import { handleReport } from './routes/report';
import { jsonError, jsonOk } from './lib/responses';
import { generateBlockList } from './crons/block-list-generator';

export type { Env };

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // GET /api/health
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return jsonOk({
        status: 'ok',
        service: 'ringdocket-worker',
        version: '0.1.0',
        time: new Date().toISOString(),
      });
    }

    // POST /api/report
    if (url.pathname === '/api/report') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        });
      }
      try {
        return await handleReport(request, env);
      } catch (err) {
        // Last-resort safety net — never leak stack traces to clients.
        console.error('handleReport unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error');
      }
    }

    return new Response('Not found', { status: 404 });
  },

  /**
   * Scheduled handler — dispatched per cron entry in wrangler.toml.
   * Each branch matches an entry in [triggers].crons. Use waitUntil so
   * the cron task survives past the synchronous return without blocking
   * the dispatcher.
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    switch (event.cron) {
      case '0 8 * * *':
        ctx.waitUntil(generateBlockList(env));
        return;
      default:
        console.warn(`[scheduled] no handler for cron "${event.cron}"`);
    }
  },
};
