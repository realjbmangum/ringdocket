-- =============================================================================
-- Ringdocket (Spam Blocker) — 006_fix_hydration_rpc.sql
-- =============================================================================
-- Replaces the `hydrate_block_list_from_ftc` function defined in migration 005.
-- The original version had two column-name collisions that caused Postgres to
-- raise "column reference 'phone' is ambiguous":
--
--   1. CTE output column `phone` shadowed `public.numbers.phone` (referenced
--      in INSERT INTO ... (phone, ...)).
--   2. The function's RETURNS TABLE column `phone` collided with the same
--      `public.numbers.phone` identifier in the plpgsql scope.
--
-- Fix: prefix both CTE columns AND the RETURNS TABLE columns with distinct
-- namespaces (`candidate_*`, `upserted_*`, `out_*`) so no identifier is
-- shadowed at any scope level.
--
-- Verified with 173 real numbers from a 3-day FTC backfill window on
-- 2026-04-21. Consumers of the RPC (see blocklist-hydration.ts) must read
-- the `out_*`-prefixed columns.
--
-- Drops + recreates. Idempotent.
-- =============================================================================

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
      ftc.number        AS candidate_number,
      COUNT(*)          AS candidate_count,
      MAX(ftc.filed_at) AS candidate_latest
    FROM public.ftc_complaints ftc
    WHERE ftc.filed_at IS NOT NULL
      AND ftc.filed_at > NOW() - (window_days || ' days')::INTERVAL
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
  'Promotes numbers with >= threshold FTC complaints in the last window_days into public.numbers as corroborated. Returns out_phone, out_complaint_count, out_was_insert (prefixed to avoid PL/pgSQL variable / column name collisions).';

GRANT EXECUTE ON FUNCTION public.hydrate_block_list_from_ftc(INT, INT) TO service_role;
