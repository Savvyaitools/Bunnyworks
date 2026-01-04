-- Drop existing policies on agencies table
DROP POLICY IF EXISTS "Deny anonymous access to agencies" ON public.agencies;
DROP POLICY IF EXISTS "Users can update own agency" ON public.agencies;
DROP POLICY IF EXISTS "Users can view own agency" ON public.agencies;

-- Create PERMISSIVE policy for authenticated users to view ONLY their own agency
CREATE POLICY "Users can view own agency"
ON public.agencies
FOR SELECT
TO authenticated
USING (id = get_user_agency_id());

-- Create PERMISSIVE policy for authenticated users to update ONLY their own agency
CREATE POLICY "Users can update own agency"
ON public.agencies
FOR UPDATE
TO authenticated
USING (id = get_user_agency_id())
WITH CHECK (id = get_user_agency_id());

-- Create RESTRICTIVE policy to explicitly deny anonymous access
CREATE POLICY "Deny anonymous access to agencies"
ON public.agencies
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);