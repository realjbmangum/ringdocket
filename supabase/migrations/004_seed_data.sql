-- =============================================================================
-- Ringdocket (Spam Blocker) — 004_seed_data.sql
-- =============================================================================
-- Idempotent seed data:
--   - Badge catalog (id generated deterministically via slug uniqueness)
--   - Founding Flagger counter initial row (1 of 1, claimed=0, cap=500)
--   - System user for attributing FTC-ingested numbers that have no user
--     report. This avoids special-casing NULL user_ids in the reports flow
--     for FTC-seeded numbers.
--
-- Note: the enum type `report_category` was created in 001. This file does
-- not re-declare it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Founding Flagger counter singleton
-- -----------------------------------------------------------------------------
-- Table has CHECK (id = 1), so only this one row can ever exist.
INSERT INTO public.founding_flagger_counter (id, claimed, cap)
VALUES (1, 0, 500)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- System user for FTC-seeded attribution
-- -----------------------------------------------------------------------------
-- Design call: some numbers enter the system from the FTC feed before any
-- user has reported them. Rather than nulling user_id on those rows (which
-- mixes "FTC-seeded" with "deleted user" semantically), we attribute them
-- to a fixed system user. The UUID below is well-known and used as a
-- sentinel across the stack. We bypass the normal handle_new_auth_user
-- path by inserting directly; auth.users must have a matching row created
-- by a Supabase Edge Function or a service-role call at bootstrap.
--
-- Because this row must exist BEFORE auth.users has the sentinel (chicken-
-- and-egg), and because public.users.id FKs auth.users.id ON DELETE
-- CASCADE, we guard this insert with an EXISTS check on auth.users. If
-- the sentinel auth row is not yet present, this statement is a no-op and
-- a follow-up seed script (run after creating the auth user) can finish
-- the bootstrap. This keeps the migration applicable in CI where the
-- auth schema may not be populated.
DO $$
DECLARE
  v_system_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_system_id) THEN
    INSERT INTO public.users (id, email, display_name, created_at)
    VALUES (v_system_id, 'system@ringdocket.internal', 'FTC Ingest', NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Badge catalog
-- -----------------------------------------------------------------------------
-- Deterministic via slug UNIQUE. Re-running this migration updates the
-- display strings but preserves badge IDs already referenced by user_badges.
INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('first_report', 'First Report',
   'Submitted your first spam report.',
   'badge_first_report',
   jsonb_build_object('type', 'report_count', 'threshold', 1))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;

INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('ten_reports', '10 Reports',
   'Submitted 10 spam reports.',
   'badge_ten_reports',
   jsonb_build_object('type', 'report_count', 'threshold', 10))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;

INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('fifty_reports', '50 Reports',
   'Submitted 50 spam reports.',
   'badge_fifty_reports',
   jsonb_build_object('type', 'report_count', 'threshold', 50))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;

INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('first_flag', 'First Flag',
   'Your first flag on a number that later crossed the corroboration threshold.',
   'badge_first_flag',
   jsonb_build_object('type', 'first_flag_corroborated', 'threshold', 1))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;

INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('campaign_contributor', 'Campaign Contributor',
   'Reported 5+ numbers attributed to a single campaign.',
   'badge_campaign_contributor',
   jsonb_build_object('type', 'campaign_numbers_reported', 'threshold', 5))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;

INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('category_diversity', 'Category Diversity',
   'Reported numbers across 3 or more scam categories.',
   'badge_category_diversity',
   jsonb_build_object('type', 'distinct_categories', 'threshold', 3))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;

INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('early_adopter', 'Early Adopter',
   'Joined Ringdocket before January 1, 2027.',
   'badge_early_adopter',
   jsonb_build_object('type', 'joined_before', 'date', '2027-01-01'))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;

INSERT INTO public.badges (slug, display_name, description, icon_key, criteria_json) VALUES
  ('founding_flagger', 'Founding Flagger',
   'One of the first 500 annual subscribers at launch. Permanent status.',
   'badge_founding_flagger',
   jsonb_build_object('type', 'subscription_tier', 'tier', 'founding_flagger'))
ON CONFLICT (slug) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description = EXCLUDED.description,
      icon_key = EXCLUDED.icon_key,
      criteria_json = EXCLUDED.criteria_json;
