-- =============================================================================
-- Ringdocket (Spam Blocker) — 003_triggers_and_functions.sql
-- =============================================================================
-- Stored procedures and triggers:
--   1. Corroboration promotion (trigger on pending_reports insert)
--   2. Activity decay detection (function, called nightly by Cloudflare cron)
--   3. Account deletion cascade — Option B anonymize (function)
--   4. Founding Flagger cap check (trigger on subscriptions insert/update)
--   5. Pending-report expiry (function, called nightly)
--   6. Auth user -> public.users row creation (trigger on auth.users)
--
-- All functions use CREATE OR REPLACE; triggers use DROP IF EXISTS then
-- CREATE for idempotency.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: bootstrap public.users on auth.users insert
-- -----------------------------------------------------------------------------
-- Supabase's recommended pattern. Runs as SECURITY DEFINER so the auth
-- schema trigger can write into public.users regardless of RLS.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- 1. Corroboration promotion
-- =============================================================================
-- When a new pending_report arrives, check whether the number now meets the
-- 3-account corroboration threshold:
--   - 3+ rows for the same number
--   - 3 distinct user_ids
--   - 3 distinct device_fingerprints
--   - 3 distinct ip_subnets
--   - All within a rolling 14-day window
--
-- If yes:
--   - Insert immutable copies into public.reports (ordered by submitted_at;
--     corroboration_sequence = 1, 2, 3...)
--   - Ensure a numbers row exists; set current_state='corroborated',
--     first_flag_user_id = oldest pending_report's user_id, timestamps.
--   - Delete the promoted pending_reports rows.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.promote_corroborated_reports()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '14 days';
  v_distinct_count INTEGER;
  v_first_flag_user_id UUID;
  v_first_flag_at TIMESTAMP WITH TIME ZONE;
  r RECORD;
  v_seq INTEGER := 1;
BEGIN
  -- Count distinctness across user_id, device_fingerprint, ip_subnet in window
  SELECT LEAST(
    COUNT(DISTINCT user_id),
    COUNT(DISTINCT device_fingerprint),
    COUNT(DISTINCT ip_subnet)
  )
  INTO v_distinct_count
  FROM public.pending_reports
  WHERE number = NEW.number
    AND submitted_at >= v_window_start;

  IF v_distinct_count < 3 THEN
    RETURN NEW;
  END IF;

  -- Identify oldest report (first flagger)
  SELECT user_id, submitted_at
    INTO v_first_flag_user_id, v_first_flag_at
  FROM public.pending_reports
  WHERE number = NEW.number
    AND submitted_at >= v_window_start
  ORDER BY submitted_at ASC
  LIMIT 1;

  -- Ensure numbers row exists, then mark corroborated
  INSERT INTO public.numbers (phone, current_state, first_flag_user_id, first_flag_at, corroborated_at)
  VALUES (NEW.number, 'corroborated', v_first_flag_user_id, v_first_flag_at, NOW())
  ON CONFLICT (phone) DO UPDATE
    SET current_state = 'corroborated',
        first_flag_user_id = COALESCE(public.numbers.first_flag_user_id, EXCLUDED.first_flag_user_id),
        first_flag_at = COALESCE(public.numbers.first_flag_at, EXCLUDED.first_flag_at),
        corroborated_at = COALESCE(public.numbers.corroborated_at, EXCLUDED.corroborated_at);

  -- Promote each pending_report into an immutable reports row
  FOR r IN
    SELECT id, user_id, number, category, notes, submitted_at
    FROM public.pending_reports
    WHERE number = NEW.number
      AND submitted_at >= v_window_start
    ORDER BY submitted_at ASC
  LOOP
    INSERT INTO public.reports (
      user_id, number, category, notes, corroboration_sequence, submitted_at
    ) VALUES (
      r.user_id, r.number, r.category, r.notes, v_seq, r.submitted_at
    );
    v_seq := v_seq + 1;
  END LOOP;

  -- Delete the promoted pending rows
  DELETE FROM public.pending_reports
  WHERE number = NEW.number
    AND submitted_at >= v_window_start;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promote_corroborated_reports ON public.pending_reports;
CREATE TRIGGER trg_promote_corroborated_reports
  AFTER INSERT ON public.pending_reports
  FOR EACH ROW EXECUTE FUNCTION public.promote_corroborated_reports();

-- =============================================================================
-- 2. Activity decay detection
-- =============================================================================
-- For each non-retired campaign, check if ALL its numbers have zero reports
-- in the last 30 days. If yes, retire the campaign with reason 'activity_decay'.
-- Called nightly by a Cloudflare Worker cron hitting a service-role RPC.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.detect_retired_campaigns()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_decay_threshold TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '30 days';
  v_retired_count INTEGER := 0;
  c RECORD;
BEGIN
  FOR c IN
    SELECT id
    FROM public.campaigns
    WHERE retired_at IS NULL
  LOOP
    -- If the campaign has at least one number AND every one of those numbers
    -- has zero reports in the last 30 days, retire the campaign.
    IF EXISTS (
      SELECT 1 FROM public.numbers WHERE campaign_id = c.id
    ) AND NOT EXISTS (
      SELECT 1
      FROM public.numbers n
      JOIN public.reports r ON r.number = n.phone
      WHERE n.campaign_id = c.id
        AND r.submitted_at >= v_decay_threshold
    ) THEN
      UPDATE public.campaigns
      SET retired_at = NOW(),
          retired_reason = 'activity_decay'
      WHERE id = c.id;
      v_retired_count := v_retired_count + 1;
    END IF;
  END LOOP;

  RETURN v_retired_count;
END;
$$;

-- =============================================================================
-- 3. Account deletion cascade — Option B (anonymize reports)
-- =============================================================================
-- Called by a confirmed-deletion Supabase Edge Function. Wrapped in a single
-- transaction. On completion:
--   - reports.user_id NULLed and reports.notes hard-deleted for this user
--   - user_badges rows deleted
--   - devices rows deleted
--   - subscriptions rows deleted (if tier was founding_flagger, decrement
--     the counter to free the seat — design decision: founding slots do NOT
--     transfer on deletion in V1; alternative is to leave claimed count
--     unchanged. We decrement so the cap reflects live founders.)
--   - users row deleted
--   - auth.users row deletion is handled separately by the Edge Function
--     via supabase.auth.admin.deleteUser()
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_user_deletion(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was_founding BOOLEAN := false;
BEGIN
  -- Detect founding tier before deletion
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id AND tier = 'founding_flagger'
  ) INTO v_was_founding;

  -- Anonymize reports: user_id to NULL, notes hard-deleted
  UPDATE public.reports
  SET user_id = NULL,
      notes = NULL,
      notes_redacted = true
  WHERE user_id = p_user_id;

  -- Hard-delete per-user tables
  DELETE FROM public.user_badges WHERE user_id = p_user_id;
  DELETE FROM public.devices WHERE user_id = p_user_id;
  DELETE FROM public.subscriptions WHERE user_id = p_user_id;

  -- Null first_flag attribution on numbers this user owned
  UPDATE public.numbers
  SET first_flag_user_id = NULL
  WHERE first_flag_user_id = p_user_id;

  -- Decrement Founding Flagger counter if applicable
  IF v_was_founding THEN
    UPDATE public.founding_flagger_counter
    SET claimed = GREATEST(claimed - 1, 0),
        updated_at = NOW()
    WHERE id = 1;
  END IF;

  -- Finally delete the users row
  DELETE FROM public.users WHERE id = p_user_id;
END;
$$;

-- =============================================================================
-- 4. Founding Flagger cap check
-- =============================================================================
-- Trigger on subscriptions INSERT or UPDATE. When a row transitions INTO
-- tier='founding_flagger', attempt an atomic increment of the counter. If
-- the increment would exceed cap, raise an exception (transaction aborts).
-- When a row transitions OUT of founding_flagger (e.g., tier downgrade), we
-- intentionally do NOT decrement — the slot is spent. Decrement only happens
-- on account deletion via handle_user_deletion. Document: founding slots are
-- "claimed" by the account, not the current subscription state.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_founding_flagger_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_new_founding BOOLEAN := false;
  v_updated_row public.founding_flagger_counter%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_is_new_founding := (NEW.tier = 'founding_flagger');
  ELSIF TG_OP = 'UPDATE' THEN
    v_is_new_founding := (NEW.tier = 'founding_flagger' AND OLD.tier IS DISTINCT FROM 'founding_flagger');
  END IF;

  IF NOT v_is_new_founding THEN
    RETURN NEW;
  END IF;

  -- Atomic increment guarded by CHECK(claimed <= cap). If the CHECK
  -- fails, the transaction aborts. Otherwise we have the new count.
  UPDATE public.founding_flagger_counter
  SET claimed = claimed + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING * INTO v_updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'founding_flagger_counter row missing; run 004_seed_data.sql';
  END IF;

  -- Secondary guard in case the CHECK was removed or table was reset
  IF v_updated_row.claimed > v_updated_row.cap THEN
    RAISE EXCEPTION 'Founding Flagger cap reached (% of %)',
      v_updated_row.claimed, v_updated_row.cap;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_founding_flagger_cap ON public.subscriptions;
CREATE TRIGGER trg_enforce_founding_flagger_cap
  BEFORE INSERT OR UPDATE OF tier ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_founding_flagger_cap();

-- =============================================================================
-- 5. Pending-report expiry
-- =============================================================================
-- Deletes pending_reports older than 14 days. Called nightly by a Cloudflare
-- Worker cron hitting a service-role RPC. Returns the count of rows deleted
-- for observability.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.expire_stale_pending_reports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.pending_reports
    WHERE submitted_at < NOW() - INTERVAL '14 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;
  RETURN v_deleted_count;
END;
$$;
