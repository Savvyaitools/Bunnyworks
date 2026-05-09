import { useEffect, useState, useCallback } from "react";
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

  const load = useCallback(async () => {
    if (!ofAccountId) { setChats([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("of_chats")
      .select("*")
      .eq("of_account_id", ofAccountId)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(500);
    setChats((data ?? []) as OfChatRow[]);
    setLoading(false);
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
    await supabase.functions.invoke("of-list-chats", { body: { of_account_id: ofAccountId } });
    await load();
  }, [ofAccountId, load]);

  return { chats, loading, reload: load, sync };
}
