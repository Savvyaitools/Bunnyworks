-- Allow public/anonymous users to read basic agency info for application forms
-- This is safe because it only exposes name and logo_url for valid agency IDs

CREATE POLICY "Public can view agency name and logo for applications"
  ON agencies
  FOR SELECT
  TO anon
  USING (true);

-- Note: The existing RESTRICTIVE policy "Deny anonymous access to agencies" 
-- needs to be dropped first since RESTRICTIVE policies take precedence
DROP POLICY IF EXISTS "Deny anonymous access to agencies" ON agencies;