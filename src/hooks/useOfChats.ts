import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OfChatRow {
  id: string;
  agency_id: string;
  creator_id: string | null;
  of_account_id: string;
  of_chat_id: string;
  of_fan_id: string | null;
  fan_name: string | null;
  fan_username: string | null;
  fan_avatar: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  last_message_is_from_me: boolean | null;
  unread_count: number | null;
  is_pinned: boolean | null;
  lifetime_spend: number | null;
  is_subscribed: boolean | null;
  subscribed_until: string | null;
  tags: string[] | null;
}

export function useOfChats(ofAccountId: string | null) {
  const [chats, setChats] = useState<OfChatRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const autoSyncedAccountRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!ofAccountId) { setChats([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("of_chats")
        .select("*")
        .eq("of_account_id", ofAccountId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(500);
      if (error) throw error;
      const rows = (data ?? []) as OfChatRow[];
      setChats(rows);
      return rows;
    } catch (error: any) {
      setSyncError(error?.message ?? "Unable to load chats");
      return [];
    } finally {
      setLoading(false);
    }
  }, [ofAccountId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!ofAccountId) return;
    const channel = supabase
      .channel(`of_chats:${ofAccountId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "of_chats", filter: `of_account_id=eq.${ofAccountId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ofAccountId, load]);

  const sync = useCallback(async () => {
    if (!ofAccountId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await supabase.functions.invoke("of-list-chats", { body: { of_account_id: ofAccountId } });
      if (error) throw error;
      await load();
    } catch (error: any) {
      const message = error?.message ?? "Unable to sync chats";
      setSyncError(message);
      console.error("BunnyChat sync failed", error);
    } finally {
      setSyncing(false);
    }
  }, [ofAccountId, load]);

  useEffect(() => {
    if (!ofAccountId || loading || syncing || chats.length > 0 || autoSyncedAccountRef.current === ofAccountId) return;
    autoSyncedAccountRef.current = ofAccountId;
    sync().catch(() => undefined);
  }, [ofAccountId, loading, syncing, chats.length, sync]);

  return { chats, loading: loading || syncing, syncing, syncError, reload: load, sync };
}
