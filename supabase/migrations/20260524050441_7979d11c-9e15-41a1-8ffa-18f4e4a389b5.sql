
-- 1. Remove plaintext login_password columns from creators and employees
ALTER TABLE public.creators DROP COLUMN IF EXISTS login_password;
ALTER TABLE public.employees DROP COLUMN IF EXISTS login_password;

-- 2. Tighten employees access: only agency owners can manage/read full records.
--    Staff retain access to their own record via existing "Employees can view own employee record".
DROP POLICY IF EXISTS "Agency can manage own employees" ON public.employees;

CREATE POLICY "Agency owners can manage own employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
  )
)
WITH CHECK (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.user_type = 'agency'
  )
);

-- 3. Add explicit agency-scoped SELECT policy for scrape_jobs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='scrape_jobs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Agency members can view own scrape jobs" ON public.scrape_jobs';
    EXECUTE $p$
      CREATE POLICY "Agency members can view own scrape jobs"
      ON public.scrape_jobs
      FOR SELECT
      TO authenticated
      USING (
        creator_id IN (
          SELECT id FROM public.creators WHERE agency_id = public.get_user_agency_id()
        )
      )
    $p$;
  END IF;
END $$;
