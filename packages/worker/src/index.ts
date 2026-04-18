/**
 * Ringdocket API Worker
 *
 * Minimal scaffold. Handles /api/health today. All real routes (/api/report,
 * /api/blocklist, webhooks, cron handlers) land in Phase 3.
 *
 * Cloudflare rules this file must respect:
 * - Read secrets from `env` INSIDE the handler, never at module top-level.
 *   Secret-type bindings are not defined at build time.
 * - event.waitUntil() for non-blocking logging, not top-level await.
 * - No `pdf-parse` / `mammoth` imports here — both are incompatible with
 *   the Workers runtime.
 */

export interface Env {
  // Build-time public
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // Runtime secrets
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  REVENUECAT_WEBHOOK_SECRET: string;
  SENDGRID_API_KEY: string;

  // Bindings
  BLOCKLIST: R2Bucket;
  REPORTS: R2Bucket;
  RATE_LIMIT: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        service: 'ringdocket-worker',
        version: '0.1.0',
        time: new Date().toISOString(),
      });
    }

    return new Response('Not found', { status: 404 });
  },

  // Cron handler stub — wire up in Phase 3 with the schedule declared
  // in wrangler.toml [triggers].
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // ctx.waitUntil(runScheduledJob(event.cron, env));
  },
};
