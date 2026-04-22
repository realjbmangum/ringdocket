/**
 * Ringdocket API Worker
 *
 * Public routes:
 *   GET  /api/health             — liveness probe
 *   POST /api/report             — user-submitted scam report (PRD §7.3)
 *
 * Internal (admin-token-gated) routes:
 *   POST /_admin/trigger-ftc-ingestion
 *   POST /_admin/trigger-block-list
 *
 * Cron triggers (see wrangler.toml [triggers]):
 *   0 6 * * *   — FTC ingestion + block list hydration
 *   0 8 * * *   — Block list snapshot → R2
 *
 * Cloudflare rules this file must respect (per CLAUDE.md):
 *   - Read secrets from `env` INSIDE the handler, never at module top-level.
 *   - event.waitUntil() for non-blocking logging, not top-level await.
 *   - No `pdf-parse` / `mammoth` imports — incompatible with Workers runtime.
 */

import type { Env } from './types';
import { handleReport } from './routes/report';
import { handleDelistAppeal } from './routes/delist-appeal';
import { handleMyPendingReports } from './routes/my-pending-reports';
import { handleSimulateCorroboration } from './routes/simulate-corroboration';
import {
  handleTriggerFtcIngestion,
  handleTriggerBlockList,
} from './routes/admin';
import { jsonError, jsonOk, handlePreflight } from './lib/responses';
import { generateBlockList } from './crons/block-list-generator';
import { ingestFtcComplaints } from './crons/ftc-ingestion';

export type { Env };

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight for any /api/* route
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return handlePreflight(request);
    }

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
        console.error('handleReport unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error');
      }
    }

    // GET /api/my-pending-reports
    if (url.pathname === '/api/my-pending-reports') {
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET, OPTIONS' },
        });
      }
      try {
        return await handleMyPendingReports(request, env);
      } catch (err) {
        console.error('handleMyPendingReports unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error', undefined, request);
      }
    }

    // POST /api/delist-appeals
    if (url.pathname === '/api/delist-appeals') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST, OPTIONS' },
        });
      }
      try {
        return await handleDelistAppeal(request, env);
      } catch (err) {
        console.error('handleDelistAppeal unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error', undefined, request);
      }
    }

    // POST /_admin/simulate-corroboration
    if (url.pathname === '/_admin/simulate-corroboration') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        });
      }
      return await handleSimulateCorroboration(request, env);
    }

    // POST /_admin/trigger-ftc-ingestion
    if (url.pathname === '/_admin/trigger-ftc-ingestion') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        });
      }
      return await handleTriggerFtcIngestion(request, env);
    }

    // POST /_admin/trigger-block-list
    if (url.pathname === '/_admin/trigger-block-list') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        });
      }
      return await handleTriggerBlockList(request, env);
    }

    return new Response('Not found', { status: 404 });
  },

  /**
   * Scheduled handler — dispatched per cron entry in wrangler.toml.
   * Each branch matches an entry in [triggers].crons. Use waitUntil so the
   * cron task survives past the synchronous return without blocking the
   * dispatcher.
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    switch (event.cron) {
      case '0 6 * * *':
        ctx.waitUntil(
          ingestFtcComplaints(env).catch((err) => {
            console.error('[scheduled] FTC ingestion failed:', err);
          }),
        );
        return;
      case '0 8 * * *':
        ctx.waitUntil(
          generateBlockList(env).catch((err) => {
            console.error('[scheduled] Block list generation failed:', err);
          }),
        );
        return;
      default:
        console.warn(`[scheduled] no handler for cron "${event.cron}"`);
    }
  },
};
