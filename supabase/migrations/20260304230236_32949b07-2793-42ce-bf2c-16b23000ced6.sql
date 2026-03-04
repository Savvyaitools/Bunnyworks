
CREATE TABLE public.fan_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  of_account_id text NOT NULL,
  of_fan_id text NOT NULL,
  transaction_type text NOT NULL,
  amount numeric DEFAULT 0,
  description text,
  transacted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  synced_at timestamptz DEFAULT now()
);

ALTER TABLE public.fan_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their agency fan transactions"
ON public.fan_transactions FOR SELECT TO authenticated
USING (agency_id = public.get_user_agency_id());

CREATE POLICY "Users can insert their agency fan transactions"
ON public.fan_transactions FOR INSERT TO authenticated
WITH CHECK (agency_id = public.get_user_agency_id());

CREATE INDEX idx_fan_transactions_agency ON public.fan_transactions(agency_id);
CREATE INDEX idx_fan_transactions_fan ON public.fan_transactions(of_fan_id);
