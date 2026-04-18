# Ringdocket Supabase Migrations

This directory contains the initial V1 schema, RLS policies, triggers, and
seed data for the Ringdocket spam-blocker product. These migrations are
schema-only. No secrets, no app code.

## File order

Migrations run in filename order. Do not reorder. Do not skip.

1. **`001_initial_schema.sql`** — Extensions, enum types, tables, indexes,
   CHECK constraints, foreign keys.
2. **`002_rls_policies.sql`** — Enables RLS on every table and installs
   the policy pack from the Phase B security review.
3. **`003_triggers_and_functions.sql`** — Corroboration promotion,
   activity decay detection, account deletion cascade, Founding Flagger
   cap enforcement, pending-report expiry, and the auth -> public.users
   bootstrap trigger.
4. **`004_seed_data.sql`** — Badge catalog, Founding Flagger counter
   singleton, FTC system-user sentinel.

## How to apply

Once the Supabase project exists locally or remotely, apply from the
project root (`app-spamblocker/`):

```bash
# Apply any pending migrations (local dev or linked remote project)
supabase migration up

# Or: push local migrations to the linked remote project
supabase db push
```

For a clean rebuild of a local dev stack:

```bash
supabase db reset
```

`supabase db reset` drops the local DB and reapplies all migrations in
order, then runs `004_seed_data.sql` as the last migration. This is the
recommended local workflow during development.

## Idempotency

Every migration in this directory is idempotent:

| File | Idempotency mechanism |
|------|------------------------|
| 001  | `CREATE EXTENSION IF NOT EXISTS`, `CREATE TYPE ... EXCEPTION WHEN duplicate_object`, `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. |
| 002  | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is a no-op if already on. Each policy is wrapped with `DROP POLICY IF EXISTS` then `CREATE POLICY`. |
| 003  | `CREATE OR REPLACE FUNCTION` for all functions; `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER` for all triggers. |
| 004  | `INSERT ... ON CONFLICT (slug/id) DO UPDATE` or `DO NOTHING`. |

Rerunning the set against an already-migrated database is safe.

## What lives outside these migrations

- **`auth.*` schema** — Supabase-managed. `public.users` joins to
  `auth.users(id) ON DELETE CASCADE`, but we do not create tables, policies,
  or functions in the `auth` schema. The one exception is the
  `on_auth_user_created` trigger declared on `auth.users`, which is the
  standard Supabase-blessed pattern and is created via `SECURITY DEFINER`.
- **Cloudflare KV counters** — Free-tier report cap (`{user_id}:report_count:{YYYY-MM}`)
  lives in Cloudflare KV, not Postgres. It is checked in the Worker before
  hitting Supabase.
- **Cloudflare Rate Limiting rules** — `POST /api/reports` rate limits
  are configured in the Cloudflare dashboard, not in SQL.
- **Edge Functions** — Account deletion is triggered from a Supabase Edge
  Function that calls the `handle_user_deletion(uuid)` function here.
  The Edge Function itself is not in this directory.
- **Read-only Metabase role** — Created manually post-deploy per Finding 12
  of the security review. Not in migrations because it requires a
  password that should be set outside source control.

## Verify-after-apply checklist

After running migrations against a Supabase project, verify in the
Supabase dashboard (or via `psql`):

- [ ] **RLS is enabled on every `public.*` table.** Run:
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```
  Every row should show `rowsecurity = true`.
- [ ] **All 10 tables exist:** `users`, `numbers`, `pending_reports`,
  `reports`, `campaigns`, `badges`, `user_badges`, `devices`,
  `subscriptions`, `ftc_complaints`, `founding_flagger_counter`,
  `delist_appeals`.
- [ ] **All enum types exist:** `number_state`, `retired_reason`,
  `report_category`, `device_platform`, `subscription_status`,
  `subscription_tier`, `delist_appeal_status`, `takedown_source`.
- [ ] **All triggers are present:**
  ```sql
  SELECT tgname, tgrelid::regclass AS table
  FROM pg_trigger
  WHERE NOT tgisinternal
    AND tgname IN (
      'on_auth_user_created',
      'trg_promote_corroborated_reports',
      'trg_enforce_founding_flagger_cap'
    );
  ```
  All three should be present.
- [ ] **All functions are present:**
  ```sql
  SELECT proname FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
      'handle_new_auth_user',
      'promote_corroborated_reports',
      'detect_retired_campaigns',
      'handle_user_deletion',
      'enforce_founding_flagger_cap',
      'expire_stale_pending_reports'
    );
  ```
- [ ] **Seed data is present:**
  ```sql
  SELECT COUNT(*) FROM public.badges;          -- expect 8
  SELECT claimed, cap FROM public.founding_flagger_counter;  -- expect 0, 500
  ```
- [ ] **E.164 CHECK constraint rejects bad input:**
  ```sql
  INSERT INTO public.numbers (phone) VALUES ('not-a-phone');
  -- expect: ERROR: new row ... violates check constraint "numbers_phone_check"
  ```
- [ ] **Client key (anon) cannot read `ftc_complaints`, `pending_reports`,
  `founding_flagger_counter`, or `delist_appeals`.** These tables have
  RLS enabled with zero user-facing policies; default-deny returns zero
  rows through the anon key.

## Design notes

- **Founding Flagger cap** — Implemented as a single-row table with a
  `CHECK (id = 1)` constraint plus a `CHECK (claimed <= cap)` guard. A
  BEFORE INSERT/UPDATE trigger on `subscriptions` atomically increments
  the counter; the CHECK constraint rejects the 501st founding sub. The
  counter is decremented only on account deletion (inside
  `handle_user_deletion`), not on tier downgrade — slots are claimed by
  the account, not the current subscription state.
- **Account deletion** — Option B (anonymize). Reports persist with
  `user_id = NULL` and `notes = NULL`; all other per-user rows are
  hard-deleted. `numbers.first_flag_user_id` is nulled for any numbers
  the deleted user first-flagged.
- **Corroboration** — A trigger on `pending_reports` insert checks
  distinctness across `user_id`, `device_fingerprint`, and `ip_subnet`
  within a rolling 14-day window. Threshold is 3. When met, all
  qualifying pending rows are promoted into `reports` (immutable) and
  deleted from `pending_reports`.
- **FTC system user** — Sentinel UUID `00000000-0000-0000-0000-000000000001`
  exists so FTC-seeded numbers have a non-null attribution without
  conflating them with deleted-user NULLs.

## References

- PRD: `/Users/jbm/new-project/app-spamblocker/spam-blocker-prd.md` §9, §14
- Security review: `/Users/jbm/new-project/app-spamblocker/prd-build/phase-b-security-review.md`
- Phase A decisions: `/Users/jbm/new-project/app-spamblocker/prd-build/phase-a-prd-clarifications.md`
- Phase B decisions: `/Users/jbm/new-project/app-spamblocker/prd-build/phase-b-decisions.md`
