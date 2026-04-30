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
import { handleMyStats } from './routes/my-stats';
import { handleNetworkStats } from './routes/network-stats';
import { handleSimulateCorroboration } from './routes/simulate-corroboration';
import { handleAdminFastTrack } from './routes/admin-fast-track';
import { handleCreateCheckoutSession } from './routes/create-checkout-session';
import { handleStripeWebhook } from './routes/stripe-webhook';
import { handleBillingPortal } from './routes/billing-portal';
import { handleHealthSnapshot } from './routes/health-snapshot';
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

    // GET /api/my-stats
    if (url.pathname === '/api/my-stats') {
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET, OPTIONS' },
        });
      }
      try {
        return await handleMyStats(request, env);
      } catch (err) {
        console.error('handleMyStats unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error', undefined, request);
      }
    }

    // GET /api/network-stats — public, no auth
    if (url.pathname === '/api/network-stats') {
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET, OPTIONS' },
        });
      }
      try {
        return await handleNetworkStats(request, env);
      } catch (err) {
        console.error('handleNetworkStats unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error', undefined, request);
      }
    }

    // POST /api/create-checkout-session
    if (url.pathname === '/api/create-checkout-session') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST, OPTIONS' },
        });
      }
      try {
        return await handleCreateCheckoutSession(request, env);
      } catch (err) {
        console.error('handleCreateCheckoutSession unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error', undefined, request);
      }
    }

    // POST /api/billing-portal
    if (url.pathname === '/api/billing-portal') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST, OPTIONS' },
        });
      }
      try {
        return await handleBillingPortal(request, env);
      } catch (err) {
        console.error('handleBillingPortal unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error', undefined, request);
      }
    }

    // POST /api/stripe-webhook — no CORS (Stripe server-to-server)
    if (url.pathname === '/api/stripe-webhook') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        });
      }
      try {
        return await handleStripeWebhook(request, env);
      } catch (err) {
        console.error('handleStripeWebhook unhandled error', err);
        return new Response('Internal error', { status: 500 });
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

    // POST /api/admin/fast-track — session-gated admin corroborate
    if (url.pathname === '/api/admin/fast-track') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST, OPTIONS' },
        });
      }
      try {
        return await handleAdminFastTrack(request, env);
      } catch (err) {
        console.error('handleAdminFastTrack unhandled error', err);
        return jsonError(500, 'internal', 'Unexpected server error', undefined, request);
      }
    }

    // GET /_admin/health-snapshot
    if (url.pathname === '/_admin/health-snapshot') {
      if (request.method !== 'GET') {
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET' },
        });
      }
      return await handleHealthSnapshot(request, env);
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
