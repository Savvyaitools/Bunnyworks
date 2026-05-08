
-- Grant admin role to founder
INSERT INTO public.user_roles (user_id, role)
VALUES ('cf35092d-b08f-4363-a5de-3aaf091214b1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Track approval requests / provisioned agencies
CREATE TABLE IF NOT EXISTS public.agency_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  agency_name text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending', -- pending | provisioned | rejected
  requested_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_user_id uuid,
  created_agency_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage approvals"
ON public.agency_approvals
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_agency_approvals_updated
BEFORE UPDATE ON public.agency_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
