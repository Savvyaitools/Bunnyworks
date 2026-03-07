
-- ============================================
-- 1. SCRAPE JOBS QUEUE TABLE
-- ============================================
CREATE TABLE public.scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  session_link_id uuid REFERENCES public.creator_session_links(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  locked_at timestamptz,
  locked_by text,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  result jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  scheduled_for timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queue polling
CREATE INDEX idx_scrape_jobs_pending ON public.scrape_jobs (scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_scrape_jobs_running ON public.scrape_jobs (locked_at) WHERE status = 'running';
CREATE INDEX idx_scrape_jobs_creator ON public.scrape_jobs (creator_id, created_at DESC);

-- RLS: service role only (edge functions)
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. FUNCTION: Enqueue scrape jobs for all authenticated creators
-- ============================================
CREATE OR REPLACE FUNCTION public.enqueue_scrape_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  enqueued_count integer := 0;
BEGIN
  INSERT INTO scrape_jobs (creator_id, session_link_id)
  SELECT csl.creator_id, csl.id
  FROM creator_session_links csl
  WHERE csl.session_status = 'authenticated'
    AND csl.platform = 'onlyfans'
    AND csl.browserbase_context_id IS NOT NULL
    AND csl.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM scrape_jobs sj
      WHERE sj.creator_id = csl.creator_id
        AND sj.status IN ('pending', 'running')
    );
  
  GET DIAGNOSTICS enqueued_count = ROW_COUNT;
  RETURN enqueued_count;
END;
$$;

-- ============================================
-- 3. FUNCTION: Claim next N jobs (FOR UPDATE SKIP LOCKED)
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_scrape_jobs(worker_id text, batch_size int DEFAULT 3)
RETURNS SETOF scrape_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  UPDATE scrape_jobs
  SET status = 'running',
      locked_at = now(),
      locked_by = worker_id,
      started_at = now(),
      attempts = attempts + 1
  WHERE id IN (
    SELECT id FROM scrape_jobs
    WHERE status = 'pending'
      AND scheduled_for <= now()
      AND attempts < max_attempts
    ORDER BY scheduled_for
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING *;
END;
$$;

-- ============================================
-- 4. FUNCTION: Complete a job
-- ============================================
CREATE OR REPLACE FUNCTION public.complete_scrape_job(job_id uuid, job_result jsonb DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE scrape_jobs
  SET status = 'done',
      completed_at = now(),
      result = job_result
  WHERE id = job_id;
END;
$$;

-- ============================================
-- 5. FUNCTION: Fail a job (with retry backoff)
-- ============================================
CREATE OR REPLACE FUNCTION public.fail_scrape_job(job_id uuid, err_msg text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  job_record scrape_jobs%ROWTYPE;
BEGIN
  SELECT * INTO job_record FROM scrape_jobs WHERE id = job_id;
  
  IF job_record.attempts >= job_record.max_attempts THEN
    UPDATE scrape_jobs
    SET status = 'failed',
        completed_at = now(),
        error_message = err_msg
    WHERE id = job_id;
  ELSE
    -- Retry with exponential backoff (2^attempts minutes)
    UPDATE scrape_jobs
    SET status = 'pending',
        locked_at = NULL,
        locked_by = NULL,
        error_message = err_msg,
        scheduled_for = now() + (power(2, job_record.attempts) || ' minutes')::interval
    WHERE id = job_id;
  END IF;
END;
$$;

-- ============================================
-- 6. FUNCTION: Recover stale running jobs (stuck > 5 min)
-- ============================================
CREATE OR REPLACE FUNCTION public.recover_stale_scrape_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recovered integer;
BEGIN
  UPDATE scrape_jobs
  SET status = 'pending',
      locked_at = NULL,
      locked_by = NULL,
      error_message = 'Recovered from stale lock'
  WHERE status = 'running'
    AND locked_at < now() - interval '5 minutes';
  
  GET DIAGNOSTICS recovered = ROW_COUNT;
  RETURN recovered;
END;
$$;

-- ============================================
-- 7. DATA RETENTION: Delete old activity logs
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM employee_of_activity_logs
  WHERE created_at < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Also clean old completed scrape jobs (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_scrape_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM scrape_jobs
  WHERE status IN ('done', 'failed')
    AND completed_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
