# Ringdocket — Claude Project Guide

Inherits from `/Users/jbm/.claude/CLAUDE.md` (global) and `/Users/jbm/new-project/CLAUDE.md` (monorepo hub). This file adds Ringdocket-specific rules.

## Session start

Always read these before doing any work:

1. [docs/PRD.md](docs/PRD.md) — especially §1 Vision, §4 Differentiation, §6 Stack, §14 Security posture
2. This file (CLAUDE.md)
3. `progress.txt` at repo root if it exists

## Non-negotiables

- **Forensic Ledger (Light) is locked.** See [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md). Do not deviate without a PRD update. No Inter/Roboto/Arial as primary fonts. Inter Tight is utility chrome only.
- **Accent color `#C2370A` is a stamp.** Permitted only in: the wordmark period, the corroboration seal icon, the first-flag indicator on ledger rows, the Takedown Report masthead, and a 2px hero hairline. Never on buttons, links, nav, or focus rings. If a screen has 3+ accent touches, the screen is broken.
- **3-account corroboration threshold is non-negotiable.** See PRD §14. Reports promote from `pending_reports` to the public block list only when 3 distinct verified accounts — no two sharing device fingerprint or IP /24 — report within a rolling 14-day window.
- **All Supabase tables have RLS enabled.** Default deny, grant selectively. See `supabase/migrations/002_rls_policies.sql`. Any new table ships with an `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the same migration.
- **Copy discipline:** "attributed takedown" only when a public enforcement source confirms; "likely retired" when activity decay infers it. Never conflate.
- **Notes PII hardening:** user-submitted notes (≤280 chars) pass through Worker-layer E.164 regex + profanity filter before hitting Postgres. Notes never render on public pages or analytics surfaces.

## Voice

Direct, stoic, no-BS. No litotes, no filler, no staccato. Narrative leads stats — home screens open with prose ("This week you flagged 4 numbers in the Medicare Card Renewal Ring."), never a stat grid.

## Cloudflare deployment

Before any deploy, run the preflight audit: `/Users/jbm/new-project/skills/development/cloudflare-preflight.md`. Blocking issues to verify every time:

1. Secret-type env vars are NOT available at build time — only runtime. Build-time reads of `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, etc. will fail silently on Pages.
2. Use **Pages** for the web app, **Workers** for cron + API. Never run the marketing site on Workers.
3. R2 bindings: remote only, never local.
4. `pdf-parse` and `mammoth` are incompatible with Workers runtime. For the Takedown Report PDF path, see PRD §22 (Puppeteer vs. DocRaptor decision still pending).
5. `nanoid` double underscores conflict with Cloudflare reserved paths — use a custom alphabet or `uuid`.

## Test-driven loop

For features with clear acceptance criteria, use the TDD autonomous loop: `/Users/jbm/new-project/skills/development/test-driven-loop.md`. Write tests first, iterate implementation until they pass. Never weaken a test to make it green.

## Multi-agent work

Before spawning parallel frontend + backend agents, define the shared data contract first — field names, casing, response shapes. Default to camelCase on all TypeScript/JavaScript boundaries.

## Finishing a session

Follow the global Plan → Work → Review → Compound loop. At the end of every session:

1. Run the appropriate quality reviews (design / code / security)
2. Update `progress.txt` with what was built, files changed, decisions, next steps, gotchas
3. Update `/Users/jbm/new-project/context/00-Dashboard.md` with a session log entry — even when working inside this sub-repo
4. Ask before committing. Ask again before pushing.
