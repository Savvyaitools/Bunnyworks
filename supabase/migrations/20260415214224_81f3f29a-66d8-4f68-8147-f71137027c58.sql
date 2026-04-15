
-- 1. Creator Credential Submissions — agency owners only
DROP POLICY IF EXISTS "Agency can manage own credential submissions" ON public.creator_credential_submissions;

CREATE POLICY "Agency owners can manage credential submissions"
ON public.creator_credential_submissions FOR ALL
TO authenticated
USING (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
)
WITH CHECK (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
);

-- 2. Employee Payroll — agency owners only (joins via employee)
DROP POLICY IF EXISTS "Agency can manage own employee payroll" ON public.employee_payroll;

CREATE POLICY "Agency owners can manage payroll"
ON public.employee_payroll FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_payroll.employee_id
      AND e.agency_id = public.get_user_agency_id()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_payroll.employee_id
      AND e.agency_id = public.get_user_agency_id()
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
);

-- 3. Agency API Credentials — agency owners only
DROP POLICY IF EXISTS "Agency can manage own API credentials" ON public.agency_api_credentials;

CREATE POLICY "Agency owners can manage API credentials"
ON public.agency_api_credentials FOR ALL
TO authenticated
USING (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
)
WITH CHECK (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
);

-- 4. Creator Proxy Configs — agency owners only
DROP POLICY IF EXISTS "Agency can manage proxy configs" ON public.creator_proxy_configs;

CREATE POLICY "Agency owners can manage proxy configs"
ON public.creator_proxy_configs FOR ALL
TO authenticated
USING (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
)
WITH CHECK (
  agency_id = public.get_user_agency_id()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'agency'
  )
);

-- 5. Storage: Remove overly broad policies
DROP POLICY IF EXISTS "Authenticated users can upload to content-vault" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own content-vault files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload employee docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view employee docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete employee docs" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can view own data-imports" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can upload to data-imports" ON storage.objects;
DROP POLICY IF EXISTS "Agency users can delete own data-imports" ON storage.objects;
