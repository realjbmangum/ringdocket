-- 007_complaint_filed_at.sql
--
-- FTC's `violation-date` is user-entered and often years stale (we saw oldest
-- at 2009). `created-date` is the reliable recency signal — when the
-- complaint was actually filed with the FTC. Migration 001's `filed_at`
-- column is populated from violation-date for auditability; this adds a
-- second column populated from created-date, and points the hydration RPC
-- at the new column.
--
-- Backfill strategy for existing rows: use `ingested_at`. All 9,386 current
-- rows were pulled via the API's `created_date_from` query with a recent
-- window, so ingested_at is a safe proxy for created-date — guaranteed to
-- sit inside the 90-day hydration window. Going forward, ingestion writes
-- the real created-date.

ALTER TABLE public.ftc_complaints
  ADD COLUMN IF NOT EXISTS complaint_filed_at TIMESTAMP WITH TIME ZONE;

UPDATE public.ftc_complaints
  SET complaint_filed_at = ingested_at
  WHERE complaint_filed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ftc_complaints_complaint_filed_at
  ON public.ftc_complaints (complaint_filed_at);

CREATE INDEX IF NOT EXISTS idx_ftc_complaints_number_complaint_filed_at
  ON public.ftc_complaints (number, complaint_filed_at DESC);

DROP FUNCTION IF EXISTS public.hydrate_block_list_from_ftc(INT, INT);

CREATE FUNCTION public.hydrate_block_list_from_ftc(
  threshold INT DEFAULT 3,
  window_days INT DEFAULT 90
)
RETURNS TABLE (out_phone TEXT, out_complaint_count BIGINT, out_was_insert BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      ftc.number                     AS candidate_number,
      COUNT(*)                       AS candidate_count,
      MAX(ftc.complaint_filed_at)    AS candidate_latest
    FROM public.ftc_complaints ftc
    WHERE ftc.complaint_filed_at IS NOT NULL
      AND ftc.complaint_filed_at > NOW() - (window_days || ' days')::INTERVAL
    GROUP BY ftc.number
    HAVING COUNT(*) >= threshold
  ),
  upserts AS (
    INSERT INTO public.numbers (phone, current_state, reputation_score, corroborated_at)
    SELECT
      c.candidate_number,
      'corroborated'::number_state,
      c.candidate_count::NUMERIC,
      c.candidate_latest
    FROM candidates c
    ON CONFLICT (phone) DO UPDATE SET
      current_state = CASE
        WHEN public.numbers.current_state = 'retired'
          THEN public.numbers.current_state
        ELSE 'corroborated'::number_state
      END,
      reputation_score = GREATEST(public.numbers.reputation_score, EXCLUDED.reputation_score),
      corroborated_at  = COALESCE(public.numbers.corroborated_at, EXCLUDED.corroborated_at)
    RETURNING
      public.numbers.phone AS upserted_number,
      (xmax = 0)           AS upserted_was_insert
  )
  SELECT
    c.candidate_number::TEXT,
    c.candidate_count::BIGINT,
    u.upserted_was_insert::BOOLEAN
  FROM candidates c
  JOIN upserts u ON u.upserted_number = c.candidate_number
  ORDER BY c.candidate_count DESC;
END;
$$;

COMMENT ON FUNCTION public.hydrate_block_list_from_ftc(INT, INT) IS
  'Promotes numbers with >= threshold FTC complaints in the last window_days into public.numbers as corroborated. Filters on complaint_filed_at (FTC created-date) — the reliable recency signal, not the user-entered violation-date stored in filed_at.';

GRANT EXECUTE ON FUNCTION public.hydrate_block_list_from_ftc(INT, INT) TO service_role;
