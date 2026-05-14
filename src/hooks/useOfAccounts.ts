import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OfAccount {
  id: string;                 // creator_social_accounts.id
  creator_id: string;
  creator_name: string | null;
  creator_avatar: string | null;
  username: string;
  of_account_id: string;      // OnlyFansAPI account id
  status: string | null;
  last_synced_at: string | null;
}

export function useOfAccounts() {
  const { profile } = useAuth();
  const agencyId = profile?.agency_id ?? null;
  const [accounts, setAccounts] = useState<OfAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!agencyId) { setAccounts([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("creator_social_accounts")
      .select("id, creator_id, username, of_account_id, of_connection_status, of_last_synced_at, creators!inner(id, name, alias, avatar_url, agency_id)")
      .ilike("platform", "onlyfans")
      .not("of_account_id", "is", null)
      .eq("creators.agency_id", agencyId)
      .limit(500);
    const mapped: OfAccount[] = (data ?? []).map((row: any) => ({
      id: row.id,
      creator_id: row.creator_id,
      creator_name: row.creators?.alias || row.creators?.name || row.username,
      creator_avatar: row.creators?.avatar_url ?? null,
      username: row.username,
      of_account_id: row.of_account_id,
      status: row.of_connection_status,
      last_synced_at: row.of_last_synced_at,
    }));
    setAccounts(mapped);
    setLoading(false);
  }, [agencyId]);

  useEffect(() => { load(); }, [load]);

  return { accounts, loading, reload: load };
}
