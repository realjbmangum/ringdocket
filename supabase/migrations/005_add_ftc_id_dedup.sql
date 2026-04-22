-- =============================================================================
-- Ringdocket (Spam Blocker) — 005_add_ftc_id_dedup.sql
-- =============================================================================
-- Adds a natural-key column to ftc_complaints so the ingestion cron can
-- upsert idempotently on the FTC's own record ID (a stable hash string).
--
-- Without this column, re-running the ingestion for the same date range
-- would insert duplicates. Discovered while wiring the ingestion cron.
--
-- Idempotent via CREATE INDEX IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS.
-- =============================================================================

-- Add the column as nullable first (so the ADD COLUMN doesn't fail on any
-- existing rows), then backfill if needed, then enforce NOT NULL + UNIQUE.
ALTER TABLE public.ftc_complaints
  ADD COLUMN IF NOT EXISTS ftc_id TEXT;

-- Also add category and robocall flag — we're getting them from the API and
-- they're useful for campaign clustering downstream. Better to capture at
-- ingestion time than to re-query the FTC API later.
ALTER TABLE public.ftc_complaints
  ADD COLUMN IF NOT EXISTS consumer_city TEXT;

ALTER TABLE public.ftc_complaints
  ADD COLUMN IF NOT EXISTS consumer_area_code TEXT;

ALTER TABLE public.ftc_complaints
  ADD COLUMN IF NOT EXISTS is_robocall BOOLEAN;

-- Backfill: no existing rows in a brand-new project, but this is safe to
-- run even if rows exist — it just sets ftc_id to a synthetic value for
-- any legacy row. Not expected to match reality; real data will come from
-- the next ingestion run.
UPDATE public.ftc_complaints
  SET ftc_id = 'legacy-' || id::TEXT
  WHERE ftc_id IS NULL;

-- Now enforce the constraints.
ALTER TABLE public.ftc_complaints
  ALTER COLUMN ftc_id SET NOT NULL;

-- Unique constraint for upsert-by-ftc-id idempotency.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ftc_complaints_ftc_id_key'
  ) THEN
    ALTER TABLE public.ftc_complaints
      ADD CONSTRAINT ftc_complaints_ftc_id_key UNIQUE (ftc_id);
  END IF;
END $$;

-- Index for fast "has this FTC id been ingested?" lookups by the cron.
CREATE INDEX IF NOT EXISTS idx_ftc_complaints_ftc_id
  ON public.ftc_complaints (ftc_id);

-- Index for the hydration query (count complaints per number in a window).
CREATE INDEX IF NOT EXISTS idx_ftc_complaints_number_filed_at
  ON public.ftc_complaints (number, filed_at DESC);

-- -----------------------------------------------------------------------------
-- hydrate_block_list_from_ftc
-- -----------------------------------------------------------------------------
-- FTC complaints are pre-verified public records. Option A from the PRD
-- (see Phase B marketing-psychology discussion + Phase 2 ingestion planning):
-- any number with >= 3 distinct FTC complaints in the last 90 days gets
-- promoted directly into the block list (public.numbers with
-- current_state='corroborated'), bypassing the user-report pending queue.
--
-- This runs at the end of every FTC ingestion cron. Idempotent.
--
-- SECURITY DEFINER so the service role can invoke via Supabase RPC without
-- granting schema-level write permissions to RLS roles.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hydrate_block_list_from_ftc(
  threshold INT DEFAULT 3,
  window_days INT DEFAULT 90
)
RETURNS TABLE (phone TEXT, complaint_count BIGINT, was_insert BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      ftc.number AS phone,
      COUNT(*) AS complaint_count,
      MAX(ftc.filed_at) AS latest_filed_at
    FROM public.ftc_complaints ftc
    WHERE ftc.filed_at IS NOT NULL
      AND ftc.filed_at > NOW() - (window_days || ' days')::INTERVAL
    GROUP BY ftc.number
    HAVING COUNT(*) >= threshold
  ),
  upserts AS (
    INSERT INTO public.numbers (phone, current_state, reputation_score, corroborated_at)
    SELECT
      c.phone,
      'corroborated'::number_state,
      c.complaint_count::NUMERIC,
      c.latest_filed_at
    FROM candidates c
    ON CONFLICT (phone) DO UPDATE SET
      -- Never re-animate a retired number from FTC hydration.
      current_state = CASE
        WHEN public.numbers.current_state = 'retired'
          THEN public.numbers.current_state
        ELSE 'corroborated'::number_state
      END,
      reputation_score = GREATEST(
        public.numbers.reputation_score,
        EXCLUDED.reputation_score
      ),
      corroborated_at = COALESCE(
        public.numbers.corroborated_at,
        EXCLUDED.corroborated_at
      )
    RETURNING
      public.numbers.phone,
      (xmax = 0) AS was_insert
  )
  SELECT
    c.phone,
    c.complaint_count,
    u.was_insert
  FROM candidates c
  JOIN upserts u ON u.phone = c.phone
  ORDER BY c.complaint_count DESC;
END;
$$;

COMMENT ON FUNCTION public.hydrate_block_list_from_ftc(INT, INT) IS
  'Promotes numbers with >= threshold FTC complaints in the last window_days into public.numbers as corroborated. Called by the FTC ingestion cron.';

-- Permission grant so the service-role Supabase client can call this via RPC.
-- (Anon role should NOT be able to call this — hydration is a privileged op.)
GRANT EXECUTE ON FUNCTION public.hydrate_block_list_from_ftc(INT, INT) TO service_role;
