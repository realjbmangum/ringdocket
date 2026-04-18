-- =============================================================================
-- Ringdocket (Spam Blocker) — 001_initial_schema.sql
-- =============================================================================
-- Creates all V1 tables, enums, constraints, and indexes.
-- Idempotent: uses CREATE TYPE IF NOT EXISTS (via DO block), CREATE TABLE IF
-- NOT EXISTS, and CREATE INDEX IF NOT EXISTS.
--
-- Auth: the public.users table joins to auth.users (Supabase-managed).
-- Do not touch auth.* here. A trigger on auth.users creates the public.users
-- row (see 003_triggers_and_functions.sql).
-- =============================================================================

-- pgcrypto provides gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE number_state AS ENUM ('pending', 'corroborated', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE retired_reason AS ENUM (
    'activity_decay',
    'attributed_takedown',
    'delisted_on_appeal',
    'manual_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_category AS ENUM (
    'auto_warranty',
    'irs_impersonation',
    'medicare_card_renewal',
    'utility_shutoff',
    'social_security',
    'bank_fraud',
    'tech_support',
    'political',
    'unknown',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'expired',
    'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'full', 'founding_flagger');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delist_appeal_status AS ENUM ('open', 'reviewing', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE takedown_source AS ENUM (
    'fcc_enforcement',
    'ftc_case',
    'itg_traceback',
    'activity_decay',
    'manual_admin',
    'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
-- Joins 1:1 with auth.users. Row is created by a trigger on auth.users insert
-- (see 003_triggers_and_functions.sql). PII lives here. On account deletion
-- this row is hard-deleted (see handle_user_deletion function).
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  first_flag_credit_count INTEGER NOT NULL DEFAULT 0,
  impact_score INTEGER NOT NULL DEFAULT 0,
  email_prefs JSONB NOT NULL DEFAULT jsonb_build_object(
    'weekly_digest', false,
    'monthly_impact', true,
    'quarterly_takedown', true,
    'transactional', true
  ),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- campaigns
-- -----------------------------------------------------------------------------
-- Clustered scam campaigns. Public-read. Numbers FK back to a campaign.
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  narrative_summary TEXT,
  carriers_implicated TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  active_since TIMESTAMP WITH TIME ZONE,
  retired_at TIMESTAMP WITH TIME ZONE,
  retired_reason retired_reason,
  takedown_source takedown_source NOT NULL DEFAULT 'none',
  takedown_case_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns (slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_retired_at ON public.campaigns (retired_at);

-- -----------------------------------------------------------------------------
-- numbers
-- -----------------------------------------------------------------------------
-- Canonical phone number record with reputation state. E.164 format enforced.
-- Public-read. Only service role writes.
CREATE TABLE IF NOT EXISTS public.numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^\+[1-9]\d{1,14}$'),
  current_state number_state NOT NULL DEFAULT 'pending',
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  reputation_score NUMERIC(10, 2) NOT NULL DEFAULT 0,
  first_flag_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  first_flag_at TIMESTAMP WITH TIME ZONE,
  corroborated_at TIMESTAMP WITH TIME ZONE,
  retired_at TIMESTAMP WITH TIME ZONE,
  retired_reason retired_reason,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_numbers_current_state ON public.numbers (current_state);
CREATE INDEX IF NOT EXISTS idx_numbers_campaign_id ON public.numbers (campaign_id);
CREATE INDEX IF NOT EXISTS idx_numbers_phone ON public.numbers (phone);

-- -----------------------------------------------------------------------------
-- pending_reports
-- -----------------------------------------------------------------------------
-- Reports awaiting 3-account corroboration. Service-role only (no client
-- policies in 002). Promoted to reports when threshold met; expired after
-- 14 days. Captures device_fingerprint (iOS install UUID) + ip_subnet (/24)
-- for the corroboration distinctness check.
CREATE TABLE IF NOT EXISTS public.pending_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL CHECK (number ~ '^\+[1-9]\d{1,14}$'),
  category report_category NOT NULL DEFAULT 'unknown',
  notes VARCHAR(280),
  device_fingerprint TEXT NOT NULL,
  ip_subnet TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_reports_user_submitted
  ON public.pending_reports (user_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_pending_reports_number
  ON public.pending_reports (number);
CREATE INDEX IF NOT EXISTS idx_pending_reports_submitted_at
  ON public.pending_reports (submitted_at);

-- -----------------------------------------------------------------------------
-- reports
-- -----------------------------------------------------------------------------
-- Immutable report events promoted from pending_reports. user_id is nullable
-- to support account-deletion anonymization (Option B). notes is nulled on
-- account deletion. corroboration_sequence: 1 for first-flagger, 2/3 for
-- subsequent corroborators, 4+ for reports after the number already went
-- corroborated.
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  number TEXT NOT NULL CHECK (number ~ '^\+[1-9]\d{1,14}$'),
  category report_category NOT NULL DEFAULT 'unknown',
  notes VARCHAR(280),
  notes_redacted BOOLEAN NOT NULL DEFAULT false,
  corroboration_sequence INTEGER NOT NULL DEFAULT 1,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_number ON public.reports (number);
CREATE INDEX IF NOT EXISTS idx_reports_submitted_at ON public.reports (submitted_at);

-- -----------------------------------------------------------------------------
-- badges
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  criteria_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- user_badges
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);

-- -----------------------------------------------------------------------------
-- devices
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  install_uuid TEXT NOT NULL,
  platform device_platform NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, install_uuid)
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices (user_id);

-- -----------------------------------------------------------------------------
-- subscriptions
-- -----------------------------------------------------------------------------
-- One active row per user. RevenueCat webhook (service role) is the writer.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  revenuecat_subscriber_id TEXT,
  status subscription_status NOT NULL DEFAULT 'active',
  tier subscription_tier NOT NULL DEFAULT 'free',
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON public.subscriptions (tier);

-- -----------------------------------------------------------------------------
-- ftc_complaints
-- -----------------------------------------------------------------------------
-- Raw ingested FTC Do Not Call complaint feed. Service-role-only.
CREATE TABLE IF NOT EXISTS public.ftc_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL CHECK (number ~ '^\+[1-9]\d{1,14}$'),
  reason TEXT,
  state TEXT,
  filed_at TIMESTAMP WITH TIME ZONE,
  source_url TEXT,
  ingested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ftc_complaints_number ON public.ftc_complaints (number);
CREATE INDEX IF NOT EXISTS idx_ftc_complaints_filed_at ON public.ftc_complaints (filed_at);

-- -----------------------------------------------------------------------------
-- founding_flagger_counter
-- -----------------------------------------------------------------------------
-- Single-row counter for Founding Flagger cap enforcement. A CHECK
-- constraint forces id = 1, so only one row can ever exist.
--
-- Design call: we chose a row-limited-to-1 table over a Postgres sequence
-- because a single row with a visible `claimed` value is easier to read,
-- audit, and expose on the marketing pricing page ("312 of 500 claimed")
-- than querying sequence state. The insert trigger in 003 does an atomic
-- UPDATE ... RETURNING on this row inside the subscription trigger.
CREATE TABLE IF NOT EXISTS public.founding_flagger_counter (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  claimed INTEGER NOT NULL DEFAULT 0 CHECK (claimed >= 0),
  cap INTEGER NOT NULL DEFAULT 500 CHECK (cap > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (claimed <= cap)
);

-- -----------------------------------------------------------------------------
-- delist_appeals
-- -----------------------------------------------------------------------------
-- Public form submissions from /report-an-error. No auth required to submit.
-- Service-role-only read (for Brian-in-inbox review). No RLS policies for
-- end users.
CREATE TABLE IF NOT EXISTS public.delist_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenged_number TEXT NOT NULL CHECK (challenged_number ~ '^\+[1-9]\d{1,14}$'),
  submitter_email TEXT NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  status delist_appeal_status NOT NULL DEFAULT 'open',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delist_appeals_status ON public.delist_appeals (status);
CREATE INDEX IF NOT EXISTS idx_delist_appeals_challenged_number
  ON public.delist_appeals (challenged_number);
