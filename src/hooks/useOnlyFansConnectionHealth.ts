import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ConnectionStatus = "healthy" | "expired" | "error" | "unknown";

export interface ConnectionHealth {
  of_connection_status: ConnectionStatus;
  of_last_error: string | null;
  of_last_error_at: string | null;
  of_last_synced_at: string | null;
  of_sync_retry_count: number;
  of_next_retry_at: string | null;
}

export interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  error_code: string | null;
  error_message: string | null;
  items_synced: number;
  duration_ms: number | null;
  created_at: string;
}

export function useOnlyFansConnectionHealth(accountId: string | null) {
  return useQuery({
    queryKey: ["of-connection-health", accountId],
    queryFn: async (): Promise<ConnectionHealth | null> => {
      if (!accountId) return null;
      
      const { data, error } = await supabase
        .from("creator_social_accounts")
        .select("of_connection_status, of_last_error, of_last_error_at, of_last_synced_at, of_sync_retry_count, of_next_retry_at")
        .eq("of_account_id", accountId)
        .single();
      
      if (error) {
        console.error("Error fetching connection health:", error);
        return null;
      }
      
      return data as ConnectionHealth;
    },
    enabled: !!accountId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useOnlyFansSyncLogs(socialAccountId: string | null, limit: number = 10) {
  return useQuery({
    queryKey: ["of-sync-logs", socialAccountId, limit],
    queryFn: async (): Promise<SyncLog[]> => {
      if (!socialAccountId) return [];
      
      const { data, error } = await supabase
        .from("of_sync_logs")
        .select("*")
        .eq("social_account_id", socialAccountId)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error("Error fetching sync logs:", error);
        return [];
      }
      
      return data as SyncLog[];
    },
    enabled: !!socialAccountId,
  });
}

export function useRetrySync() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accountId: string) => {
      // Reset retry count and trigger sync
      const { error: updateError } = await supabase
        .from("creator_social_accounts")
        .update({
          of_sync_retry_count: 0,
          of_connection_status: "unknown",
          of_last_error: null,
          of_next_retry_at: null,
        })
        .eq("of_account_id", accountId);
      
      if (updateError) throw updateError;
      
      // Trigger the sync function
      const { error: syncError } = await supabase.functions.invoke("sync-onlyfans-data");
      
      if (syncError) throw syncError;
      
      return true;
    },
    onSuccess: (_, accountId) => {
      toast.success("Sync initiated");
      queryClient.invalidateQueries({ queryKey: ["of-connection-health", accountId] });
      queryClient.invalidateQueries({ queryKey: ["of-chats", accountId] });
      queryClient.invalidateQueries({ queryKey: ["of-fans", accountId] });
    },
    onError: (error) => {
      console.error("Retry sync failed:", error);
      toast.error("Failed to initiate sync");
    },
  });
}

export function useAllAccountsHealth() {
  return useQuery({
    queryKey: ["of-all-accounts-health"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_social_accounts")
        .select(`
          id,
          creator_id,
          username,
          platform,
          of_account_id,
          of_connection_status,
          of_last_error,
          of_last_error_at,
          of_last_synced_at,
          of_sync_retry_count,
          of_next_retry_at,
          creator:creators(id, name, alias, avatar_url)
        `)
        .ilike("platform", "onlyfans")
        .not("of_account_id", "is", null)
        .order("of_connection_status", { ascending: true });
      
      if (error) {
        console.error("Error fetching all accounts health:", error);
        return [];
      }
      
      return data;
    },
  });
}
