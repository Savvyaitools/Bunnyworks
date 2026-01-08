-- Employee OnlyFans permissions table
CREATE TABLE public.employee_of_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  -- Permission flags
  can_view_chats BOOLEAN DEFAULT false,
  can_send_messages BOOLEAN DEFAULT false,
  can_send_mass_messages BOOLEAN DEFAULT false,
  can_view_fans BOOLEAN DEFAULT false,
  can_view_posts BOOLEAN DEFAULT false,
  can_create_posts BOOLEAN DEFAULT false,
  can_view_vault BOOLEAN DEFAULT false,
  can_view_earnings BOOLEAN DEFAULT false,
  can_view_notifications BOOLEAN DEFAULT false,
  -- Metadata
  granted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, creator_id)
);

-- Enable RLS
ALTER TABLE public.employee_of_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_of_permissions
CREATE POLICY "Agency users can view their permissions"
ON public.employee_of_permissions FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency users can manage permissions"
ON public.employee_of_permissions FOR ALL
USING (agency_id = public.get_user_agency_id());

-- Employees can view their own permissions
CREATE POLICY "Employees can view own permissions"
ON public.employee_of_permissions FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE auth_user_id = auth.uid()
  )
);

-- Employee OnlyFans activity logs table
CREATE TABLE public.employee_of_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id),
  creator_id UUID REFERENCES public.creators(id),
  of_account_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.employee_of_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity logs
CREATE POLICY "Agency users can view activity logs"
ON public.employee_of_activity_logs FOR SELECT
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Agency users can insert activity logs"
ON public.employee_of_activity_logs FOR INSERT
WITH CHECK (agency_id = public.get_user_agency_id());

-- Employees can view their own activity
CREATE POLICY "Employees can view own activity"
ON public.employee_of_activity_logs FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees WHERE auth_user_id = auth.uid()
  )
);

-- Trigger for updated_at on permissions
CREATE TRIGGER update_employee_of_permissions_updated_at
BEFORE UPDATE ON public.employee_of_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_employee_of_permissions_employee ON public.employee_of_permissions(employee_id);
CREATE INDEX idx_employee_of_permissions_creator ON public.employee_of_permissions(creator_id);
CREATE INDEX idx_employee_of_activity_logs_employee ON public.employee_of_activity_logs(employee_id);
CREATE INDEX idx_employee_of_activity_logs_created ON public.employee_of_activity_logs(created_at DESC);