/**
 * Worker bindings exposed by `wrangler.toml`. Mirror this shape exactly when
 * adding a new binding — the Worker entry handler is typed against it.
 *
 * Secret-class vars (per PRD §14 Finding 5):
 *   - SUPABASE_SERVICE_ROLE_KEY  — full DB bypass, runtime-only
 *   - FTC_API_KEY                — api.data.gov key, 1000/hr rate limit
 *   - ADMIN_TOKEN                — shared secret for POST /_admin/* routes
 *
 * Build-time-public vars (safe in the bundle):
 *   - SUPABASE_URL
 *   - SUPABASE_ANON_KEY  — RLS-protected
 *   - BLOCKLIST_PUBLIC_URL
 */
export interface Env {
  // Build-time public vars
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // Runtime secrets
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_FULL_MONTHLY_PRICE_ID?: string;
  STRIPE_FULL_YEARLY_PRICE_ID?: string;
  STRIPE_FOUNDING_PRICE_ID?: string;
  REVENUECAT_WEBHOOK_SECRET?: string;
  SENDGRID_API_KEY?: string;
  FTC_API_KEY?: string;
  ADMIN_TOKEN?: string;
  /**
   * Comma-separated allowlist of Supabase user emails permitted to call
   * /api/admin/* routes. Auth still requires a valid Supabase JWT — this
   * allowlist is the second factor on top of the session check. Empty
   * string or unset disables the routes.
   */
  ADMIN_USER_EMAILS?: string;

  // Bindings
  RATE_LIMIT: KVNamespace;
  BLOCKLIST: R2Bucket;
  REPORTS: R2Bucket;

  // Public-facing URL of the BLOCKLIST R2 bucket (custom domain or
  // *.r2.dev). Used by the block list generator to embed `fileUrl` in
  // the manifest. See wrangler.toml [vars] block.
  BLOCKLIST_PUBLIC_URL?: string;
}
