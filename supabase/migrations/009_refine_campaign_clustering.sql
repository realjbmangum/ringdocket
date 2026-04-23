-- 009_refine_campaign_clustering.sql
--
-- Migration 008 seeded 12 campaigns and clustered with ILIKE %pattern%
-- matches against the FTC `reason` field. Most patterns missed because
-- the FTC uses fixed category labels we hadn't inspected, and one match
-- was wrong: `%credit card%` greedy-caught "Reducing your debt (credit
-- cards, mortgage, student loans)" and misattributed 3,190 debt-relief
-- numbers to the "Bank Account Fraud" campaign.
--
-- This migration:
--   1. Resets all campaign_id assignments
--   2. Deletes 7 campaigns that have no real FTC-vocabulary match
--   3. Updates 5 existing campaigns with accurate narratives
--   4. Inserts 8 new campaigns matching real FTC categories
--   5. Rewrites cluster_numbers_into_campaigns() to use EXACT-match on
--      FTC `reason` strings (preserving the awkward double-spaces the FTC
--      uses in its category labels — "Medical  & prescriptions", etc.)

-- Step 0: DROP the existing clustering function (return signature changed
-- from migration 008 — old was (slug, newly_linked, total_linked), new
-- drops the unused newly_linked column, so CREATE OR REPLACE rejects).
DROP FUNCTION IF EXISTS public.cluster_numbers_into_campaigns();

-- Step 1: Reset all current assignments so clustering starts from scratch.
UPDATE public.numbers SET campaign_id = NULL WHERE campaign_id IS NOT NULL;

-- Step 2: Drop the 7 campaigns with no FTC-vocabulary match.
-- Safe to DELETE (not just empty out) because they have no content today
-- and no external references. The dynamic getStaticPaths in
-- apps/web/src/pages/app/campaigns/[slug].astro will pick up whatever
-- survives.
DELETE FROM public.campaigns WHERE slug IN (
  'medicare-card-renewal-ring',
  'auto-warranty-extension',
  'irs-impersonation',
  'social-security-suspension',
  'utility-shutoff-scam',
  'bank-account-fraud',
  'political-robocall'
);

-- Step 3: Refresh the 5 campaigns that survive (narratives match FTC vocab now).
UPDATE public.campaigns SET
  narrative_summary = 'Debt-relief, credit-repair, and consolidation pitches — the single largest DNC complaint bucket. Most operators charge upfront fees then fail to deliver actual debt resolution. "Cut your credit-card balance to pennies on the dollar" is the signature script.'
WHERE slug = 'debt-relief-credit-repair';

UPDATE public.campaigns SET
  narrative_summary = 'Roofing, siding, window, and gutter-guard canvassing plus cleaning-service solicitations. High-ticket home services sold by robocall. Spoofs local area codes to increase pickup rates.'
WHERE slug = 'home-improvement-canvassing';

UPDATE public.campaigns SET
  name = 'Energy, Solar & Utilities',
  narrative_summary = 'Energy-savings, solar-panel, and utility-company robocalls. "Government-backed solar program" pitches resell consumer data to third-party sales organizations. Also covers bogus "your utility is being shut off" impersonation calls.'
WHERE slug = 'solar-energy-savings';

UPDATE public.campaigns SET
  narrative_summary = 'Fake Microsoft, Apple, and Norton calls claiming the consumer''s device is infected. Requests remote access, then charges for "fixing" nonexistent problems or installs actual malware.'
WHERE slug = 'tech-support-scam';

UPDATE public.campaigns SET
  name = 'Warranty & Protection Plans',
  narrative_summary = 'Auto, appliance, home-systems, and electronics warranty-extension pitches. All use the same robodialer infrastructure as other high-volume scam operations. "Your warranty is about to expire" — whether or not you ever had one.'
WHERE slug = 'extended-warranty';

-- Step 4: Add 8 new campaigns matching real FTC categories.
INSERT INTO public.campaigns (slug, name, narrative_summary, takedown_source)
VALUES
  ('impersonation-scams',
   'Impersonation Scams',
   'Calls pretending to be government (IRS, SSA, Medicare, police), businesses (your bank, Amazon fraud desk, utility company), or family and friends. Uses fear and urgency — threats of arrest, account suspension, or a loved one in trouble — to pressure fast money transfers.',
   'none'),
  ('silent-robocalls',
   'Silent Robocalls',
   'Calls that hang up when answered, leave no voicemail, or go silent. Often automated dialers testing which numbers are live before feeding them to a follow-up live-caller campaign. Sometimes used for account-validation checks by fraud rings.',
   'none'),
  ('medical-prescription-scams',
   'Medical & Prescription Scams',
   'Medicare-card renewal calls, discount-prescription pitches, brace and knee-device offers, and similar medical-product scams. Disproportionately targets elderly consumers and Part D enrollees.',
   'none'),
  ('vacation-timeshare',
   'Vacation & Timeshare',
   'Unsolicited resort stays, cruise "giveaways," and timeshare-resale operations. "You''ve been selected for a free Caribbean cruise — just pay port fees." The port fees are the scam.',
   'none'),
  ('lottery-sweepstakes',
   'Lottery & Sweepstakes',
   '"You''ve won!" calls that require an upfront fee, tax payment, or personal information to release a prize that doesn''t exist. Publishers Clearing House impersonators are a perennial favorite.',
   'none'),
  ('home-security-alarms',
   'Home Security & Alarms',
   'Home-alarm system pitches, often leveraging "we''re in your neighborhood this week" as social proof. Frequently high-pressure, claiming a neighbor was recently burglarized.',
   'none'),
  ('work-from-home',
   'Work From Home Schemes',
   'MLM recruitment calls, "earn $X per day from home" pitches, envelope-stuffing and assembly-work cons. Most require an upfront training or starter-kit fee.',
   'none'),
  ('charity-solicitation',
   'Charity Solicitation',
   'Police, veteran, and firefighter charity solicitations. Even legitimate charities violate DNC rules by robocalling registered numbers — the charity exemption covers live-dialed calls, not recordings.',
   'none')
ON CONFLICT (slug) DO NOTHING;

-- Step 5: Rewrite cluster_numbers_into_campaigns() with exact-match.
-- FTC category strings use inconsistent whitespace ("Medical  & prescriptions"
-- has two spaces before the ampersand). Preserve them character-for-character.
CREATE FUNCTION public.cluster_numbers_into_campaigns()
RETURNS TABLE (campaign_slug TEXT, total_linked BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CREATE TEMP TABLE tmp_pattern_map (slug TEXT, reason_exact TEXT) ON COMMIT DROP;
  INSERT INTO tmp_pattern_map (slug, reason_exact) VALUES
    ('debt-relief-credit-repair',   'Reducing your debt (credit cards, mortgage, student loans)'),
    ('impersonation-scams',         'Calls pretending to be government, businesses, or family and friends'),
    ('silent-robocalls',            'Dropped call or no message'),
    ('medical-prescription-scams',  'Medical  & prescriptions'),
    ('home-improvement-canvassing', 'Home improvement  & cleaning'),
    ('extended-warranty',           'Warranties  & protection plans'),
    ('vacation-timeshare',          'Vacation  & timeshares'),
    ('solar-energy-savings',        'Energy, solar,  & utilities'),
    ('tech-support-scam',           'Computer  & technical support'),
    ('lottery-sweepstakes',         'Lotteries, prizes  & sweepstakes'),
    ('home-security-alarms',        'Home security  & alarms'),
    ('work-from-home',              'Work from home  & other ways to make money'),
    ('charity-solicitation',        'Charities');

  UPDATE public.numbers n
    SET campaign_id = c.id
    FROM (
      SELECT DISTINCT ON (f.number) f.number AS phone, p.slug
      FROM tmp_pattern_map p
      JOIN public.ftc_complaints f ON f.reason = p.reason_exact
      ORDER BY f.number, p.slug
    ) match
    JOIN public.campaigns c ON c.slug = match.slug
    WHERE n.phone = match.phone
      AND n.campaign_id IS NULL;

  UPDATE public.campaigns c
    SET active_since = sub.earliest
    FROM (
      SELECT n.campaign_id AS cid, MIN(f.complaint_filed_at) AS earliest
      FROM public.numbers n
      JOIN public.ftc_complaints f ON f.number = n.phone
      WHERE n.campaign_id IS NOT NULL
      GROUP BY n.campaign_id
    ) sub
    WHERE c.id = sub.cid
      AND (c.active_since IS NULL OR c.active_since > sub.earliest);

  RETURN QUERY
    SELECT
      c.slug::TEXT                                            AS campaign_slug,
      COUNT(n.id) FILTER (WHERE n.campaign_id = c.id)::BIGINT AS total_linked
    FROM public.campaigns c
    LEFT JOIN public.numbers n ON n.campaign_id = c.id
    GROUP BY c.slug, c.id
    ORDER BY total_linked DESC;
END;
$$;

COMMENT ON FUNCTION public.cluster_numbers_into_campaigns() IS
  'Links public.numbers.campaign_id using EXACT match on ftc_complaints.reason against a pattern table. FTC category strings have odd double-spaces ("Medical  & prescriptions") — the pattern table preserves them as-is.';

GRANT EXECUTE ON FUNCTION public.cluster_numbers_into_campaigns() TO service_role;

-- Step 6: Run the clustering. Returns per-campaign counts.
SELECT * FROM public.cluster_numbers_into_campaigns();
