-- 008_seed_campaigns_and_cluster.sql
--
-- Phase 3 chunk 3. Seeds 12 named campaigns and provides a PL/pgSQL function
-- that scans FTC complaint subjects, matches each against a pattern table,
-- and links public.numbers.campaign_id. Idempotent — safe to re-run as new
-- FTC complaints arrive.
--
-- Matching rule: a number is linked to the first campaign whose ILIKE
-- pattern any of its complaints' `reason` field matches. Numbers with no
-- match remain uncategorized (campaign_id NULL), which is valid.
--
-- Campaign narratives are intentionally direct, stoic, no-BS per
-- ringdocket/CLAUDE.md voice rules. They describe the scam, not the hype.

INSERT INTO public.campaigns (slug, name, narrative_summary, takedown_source)
VALUES
  ('medicare-card-renewal-ring',
   'Medicare Card Renewal Ring',
   'Impersonates CMS, claims the member''s Medicare card needs renewal or replacement, and harvests Social Security and date of birth. Volume surges when reporting windows open.',
   'none'),
  ('auto-warranty-extension',
   'Auto Warranty Extension',
   'Opens with "your car''s warranty has expired" — targets consumers with publicly visible vehicle registrations. Long-running. The FCC has issued multiple enforcement orders against operators using this script over the past five years.',
   'none'),
  ('irs-impersonation',
   'IRS Impersonation',
   'Threatens arrest, deportation, or lawsuit over alleged back taxes unless immediate payment is wired or loaded onto gift cards. Peaks around the April 15 and October 15 tax deadlines.',
   'none'),
  ('social-security-suspension',
   'Social Security Suspension',
   'Caller claims the consumer''s SSN has been "suspended" over suspicious activity tied to drug trafficking or money laundering. The Social Security Administration does not suspend SSNs — ever.',
   'none'),
  ('utility-shutoff-scam',
   'Utility Shutoff Scam',
   'Threatens immediate electricity or gas disconnection within the hour unless payment is sent by prepaid card or wire. Exploits fear and urgency, often during heat waves or cold snaps.',
   'none'),
  ('tech-support-scam',
   'Tech Support Scam',
   'Fake Microsoft, Apple, or Norton calls claiming the consumer''s device is infected. Requests remote access, then charges for "fixing" nonexistent problems or installs actual malware.',
   'none'),
  ('extended-warranty',
   'Extended Warranty Pitch',
   'Non-auto extended warranties on appliances, electronics, or home systems. Uses the same robodialer infrastructure as the auto warranty ring — different product, same operators.',
   'none'),
  ('solar-energy-savings',
   'Solar Energy Savings Pitch',
   'Promises "government-backed" solar program savings. Most are lead-generation operations, not actual installers. Consumer data is resold to third-party sales organizations.',
   'none'),
  ('debt-relief-credit-repair',
   'Debt Relief & Credit Repair',
   'Offers to "settle debts for pennies on the dollar" or rapidly boost credit scores. Requires a nonrefundable upfront fee. No actual debt resolution follows.',
   'none'),
  ('home-improvement-canvassing',
   'Home Improvement Canvassing',
   'Roofing, siding, window, and gutter-guard canvassing. High-ticket home services sold by robocall. Spoofs local area codes to increase pickup rates.',
   'none'),
  ('bank-account-fraud',
   'Bank Account Fraud Alert',
   'Poses as the consumer''s bank reporting suspicious activity. Prompts the consumer to "confirm" account numbers or log-in credentials via keypad — a credential-harvesting operation.',
   'none'),
  ('political-robocall',
   'Political Robocall',
   'Campaign and issue-advocacy robocalls. Legally exempt from the DNC registry, which is why they consistently rank in the top five DNC complaint categories by volume.',
   'none')
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.cluster_numbers_into_campaigns()
RETURNS TABLE (campaign_slug TEXT, newly_linked BIGINT, total_linked BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INT;
BEGIN
  CREATE TEMP TABLE tmp_patterns (slug TEXT, pat TEXT) ON COMMIT DROP;
  INSERT INTO tmp_patterns (slug, pat) VALUES
    ('medicare-card-renewal-ring', '%medicare%'),
    ('auto-warranty-extension',    '%auto%warranty%'),
    ('auto-warranty-extension',    '%vehicle%warranty%'),
    ('auto-warranty-extension',    '%car%warranty%'),
    ('irs-impersonation',          '%IRS%'),
    ('irs-impersonation',          '%internal revenue%'),
    ('irs-impersonation',          '%tax matter%'),
    ('social-security-suspension', '%social security%'),
    ('utility-shutoff-scam',       '%utilit%'),
    ('utility-shutoff-scam',       '%shutoff%'),
    ('tech-support-scam',          '%tech support%'),
    ('tech-support-scam',          '%computer%'),
    ('tech-support-scam',          '%microsoft%'),
    ('tech-support-scam',          '%apple support%'),
    ('extended-warranty',          '%extended warranty%'),
    ('solar-energy-savings',       '%solar%'),
    ('solar-energy-savings',       '%energy%saving%'),
    ('debt-relief-credit-repair',  '%debt relief%'),
    ('debt-relief-credit-repair',  '%credit repair%'),
    ('debt-relief-credit-repair',  '%debt consolidat%'),
    ('home-improvement-canvassing','%home improvement%'),
    ('home-improvement-canvassing','%roofing%'),
    ('home-improvement-canvassing','%siding%'),
    ('home-improvement-canvassing','%windows%'),
    ('bank-account-fraud',         '%bank%'),
    ('bank-account-fraud',         '%credit card%'),
    ('bank-account-fraud',         '%account%suspend%'),
    ('political-robocall',         '%political%'),
    ('political-robocall',         '%election%'),
    ('political-robocall',         '%campaign%');

  UPDATE public.numbers n
    SET campaign_id = c.id
    FROM (
      SELECT DISTINCT ON (f.number) f.number AS phone, p.slug
      FROM tmp_patterns p
      JOIN public.ftc_complaints f ON f.reason ILIKE p.pat
      ORDER BY f.number, p.slug
    ) match
    JOIN public.campaigns c ON c.slug = match.slug
    WHERE n.phone = match.phone
      AND n.campaign_id IS NULL;

  GET DIAGNOSTICS affected = ROW_COUNT;

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
      c.slug::TEXT                             AS campaign_slug,
      affected::BIGINT                         AS newly_linked,
      COUNT(n.id) FILTER (WHERE n.campaign_id = c.id)::BIGINT AS total_linked
    FROM public.campaigns c
    LEFT JOIN public.numbers n ON n.campaign_id = c.id
    GROUP BY c.slug, c.id
    ORDER BY total_linked DESC;
END;
$$;

COMMENT ON FUNCTION public.cluster_numbers_into_campaigns() IS
  'Scans ftc_complaints.reason against a seeded pattern table, links public.numbers.campaign_id. Idempotent — only touches numbers with NULL campaign_id. Returns per-campaign counts.';

GRANT EXECUTE ON FUNCTION public.cluster_numbers_into_campaigns() TO service_role;
