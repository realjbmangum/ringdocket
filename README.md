# Ringdocket

> **Note:** This repo was scaffolded at `/Users/jbm/new-project/app-spamblocker/ringdocket/` as a staging location (the session sandbox blocked creation at the requested `/Users/jbm/ringdocket/` and `/Users/jbm/new-project/ringdocket/` paths). Move to the final location before committing:
>
> ```bash
> mv /Users/jbm/new-project/app-spamblocker/ringdocket /Users/jbm/ringdocket
> cd /Users/jbm/ringdocket
> git init
> ```

A spam call blocker that shows users what scam a blocked call was part of, who else got hit by it, and what is being done about it. Users subscribe for peace of mind from unlimited blocking. They stay for the ledger — a civic record of named campaigns, corroborated reports, carrier attribution, and enforcement status that no competitor surfaces.

The internal strategic frame is a civic accountability product packaged as a consumer utility. The external frame, in all user-facing surfaces, is utility first. The word "disguised" never appears in copy. The civic identity is something the user grows into, not something we recruit them into.

## Stack

- **Web dashboard:** Astro + React islands on Cloudflare Pages
- **API / backend:** Cloudflare Workers
- **Database + auth:** Supabase (Postgres, RLS, materialized views)
- **File storage:** Cloudflare R2 (block list snapshots, Takedown Report PDFs)
- **iOS app:** Native Swift + SwiftUI (scaffolded in Phase 4)
- **Payments:** Stripe (web) + RevenueCat (iOS)
- **Email:** SendGrid
- **Observability:** Sentry + PostHog + Cloudflare Logpush

See [docs/PRD.md](docs/PRD.md) §6 for architectural rationale.

## Setup

```bash
# 1. Use Node 20
nvm use

# 2. Install workspace deps
npm install

# 3. Copy env template and fill in values
cp .env.example .env
# Then fill SUPABASE_URL, SUPABASE_ANON_KEY, etc.

# 4. Run the web app
npm run dev
# → http://localhost:4321
```

Before first deploy:

1. Download variable fonts into `apps/web/public/fonts/` — see [apps/web/public/fonts/README.md](apps/web/public/fonts/README.md)
2. Create Supabase project, apply migrations from `supabase/migrations/`
3. Create Cloudflare R2 bucket (`ringdocket-blocklist`) + KV namespace (rate limit), paste IDs into `packages/worker/wrangler.toml`
4. Set runtime secrets via `wrangler secret put` (see `packages/worker/wrangler.toml` comments)
5. Run the Cloudflare preflight audit: `/Users/jbm/new-project/skills/development/cloudflare-preflight.md`

## Docs

- [docs/PRD.md](docs/PRD.md) — product requirements (v2.0, locked)
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — Forensic Ledger (Light) tokens + rules
- [docs/legal/](docs/legal/) — privacy policy, terms, CAN-SPAM footer, delist playbook

## Contributing

See [CLAUDE.md](CLAUDE.md) for project-specific guidance. Follow the Plan → Work → Review → Compound loop. Run the design + code + security reviews appropriate to what changed before finishing any task.

## License

Proprietary — LIGHTHOUSE 27 LLC. All rights reserved.
