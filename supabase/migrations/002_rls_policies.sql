-- =============================================================================
-- Ringdocket (Spam Blocker) — 002_rls_policies.sql
-- =============================================================================
-- Reproduces the RLS Policy Starter Pack from phase-b-security-review.md
-- §"RLS Policy Starter Pack for Supabase" verbatim, with per-table comments
-- referencing the security-review finding number.
--
-- Every table gets RLS enabled, including internal tables with zero
-- user-facing policies (ftc_complaints, founding_flagger_counter,
-- pending_reports, delist_appeals). Enabling RLS with zero policies locks
-- the table to client JWTs — only the service-role key can access it.
--
-- Policy creation is guarded with DROP POLICY IF EXISTS so this migration
-- is idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- USERS TABLE (Finding 2 — default-deny RLS on every table)
-- -----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own record (display name, notification prefs)
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert handled by Supabase Auth trigger (service role), not client

-- -----------------------------------------------------------------------------
-- REPORTS TABLE (Finding 2 — report data is identity-linked; default-deny)
-- -----------------------------------------------------------------------------
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can read their own reports only
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert reports with their own user_id
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No user UPDATE or DELETE — reports are immutable records
-- Status updates come from service role (backend Worker) only

-- -----------------------------------------------------------------------------
-- NUMBERS TABLE (Finding 2 — block list is public)
-- -----------------------------------------------------------------------------
ALTER TABLE public.numbers ENABLE ROW LEVEL SECURITY;

-- Public read — the block list is not sensitive
DROP POLICY IF EXISTS "numbers_select_public" ON public.numbers;
CREATE POLICY "numbers_select_public" ON public.numbers
  FOR SELECT USING (true);

-- No client-side writes — service role only

-- -----------------------------------------------------------------------------
-- CAMPAIGNS TABLE (Finding 2 — campaign pages are public)
-- -----------------------------------------------------------------------------
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "campaigns_select_public" ON public.campaigns;
CREATE POLICY "campaigns_select_public" ON public.campaigns
  FOR SELECT USING (true);

-- No client-side writes

-- -----------------------------------------------------------------------------
-- BADGES TABLE (Finding 2 — badge definitions are public catalog)
-- -----------------------------------------------------------------------------
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badges_select_public" ON public.badges;
CREATE POLICY "badges_select_public" ON public.badges
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- USER_BADGES TABLE (Finding 2 — awarded badges are per-user)
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own badges
DROP POLICY IF EXISTS "user_badges_select_own" ON public.user_badges;
CREATE POLICY "user_badges_select_own" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- No client-side inserts — gamification engine (service role) awards badges

-- -----------------------------------------------------------------------------
-- FTC_COMPLAINTS TABLE (Finding 2 — raw government feed; service-role only)
-- -----------------------------------------------------------------------------
ALTER TABLE public.ftc_complaints ENABLE ROW LEVEL SECURITY;

-- No client-side access at all — service role only
-- Enable RLS with no user-facing policies = table is locked to client JWTs

-- -----------------------------------------------------------------------------
-- DEVICES TABLE (Finding 2 — device fingerprints are per-user)
-- -----------------------------------------------------------------------------
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Users can read and manage their own devices
DROP POLICY IF EXISTS "devices_select_own" ON public.devices;
CREATE POLICY "devices_select_own" ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_insert_own" ON public.devices;
CREATE POLICY "devices_insert_own" ON public.devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "devices_delete_own" ON public.devices;
CREATE POLICY "devices_delete_own" ON public.devices
  FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- SUBSCRIPTIONS TABLE (Finding 2 — own-row read; RevenueCat writes server-side)
-- -----------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription status
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- No client-side writes — RevenueCat webhook (service role) manages this

-- =============================================================================
-- EXTENDED TABLES — not in the security review's original starter pack but
-- required by the schema. Same default-deny principle: RLS enabled, no
-- client-facing policies unless strictly needed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PENDING_REPORTS (Finding 1 + Finding 2 — corroboration queue is internal)
-- -----------------------------------------------------------------------------
-- 1–2 reports of a number sit here until a 3rd corroborator arrives. Users
-- see their own pending contributions only through service-role-mediated
-- personal-stats endpoints. Direct client reads are denied.
ALTER TABLE public.pending_reports ENABLE ROW LEVEL SECURITY;
-- No user-facing policies. Service role only.

-- -----------------------------------------------------------------------------
-- FOUNDING_FLAGGER_COUNTER (Finding 2 — internal atomic counter)
-- -----------------------------------------------------------------------------
-- The pricing page reads `claimed` via a service-role Worker endpoint that
-- returns only the claimed/cap numbers. The table itself is locked to
-- clients.
ALTER TABLE public.founding_flagger_counter ENABLE ROW LEVEL SECURITY;
-- No user-facing policies. Service role only.

-- -----------------------------------------------------------------------------
-- DELIST_APPEALS (Finding 1 — inbound ticket queue; service-role only)
-- -----------------------------------------------------------------------------
-- Submissions are made via an unauthenticated Worker endpoint that writes
-- with the service role (after captcha/rate-limit checks). End users never
-- read this table directly — Brian-in-inbox reviews via the service role.
ALTER TABLE public.delist_appeals ENABLE ROW LEVEL SECURITY;
-- No user-facing policies. Service role only.
