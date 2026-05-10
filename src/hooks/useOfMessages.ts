import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface OfMessageRow {
  id: string;
  chat_id: string;
  of_message_id: string | null;
  direction: "in" | "out" | string;
  body: string | null;
  price: number;
  is_ppv: boolean;
  is_unlocked: boolean;
  media: any;
  status: string;
  created_at: string;
  read_at: string | null;
}

export function useOfMessages(chatId: string | null) {
  const [messages, setMessages] = useState<OfMessageRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!chatId) { setMessages([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from("of_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(500);
    setMessages((data ?? []) as OfMessageRow[]);
    setLoading(false);
  }, [chatId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`of_messages:${chatId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "of_messages", filter: `chat_id=eq.${chatId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId, load]);

  const sync = useCallback(async (ofAccountId: string, ofChatId: string) => {
    await supabase.functions.invoke("of-list-messages", {
      body: { of_account_id: ofAccountId, of_chat_id: ofChatId },
    });
    await load();
  }, [load]);

  return { messages, loading, reload: load, sync };
}

export interface SendOfMessageArgs {
  ofAccountId: string;
  ofChatId: string;
  body: string;
  price?: number;
  mediaIds?: string[];
}

export async function sendOfMessage(args: SendOfMessageArgs) {
  const { error } = await supabase.functions.invoke("of-send-message", {
    body: {
      of_account_id: args.ofAccountId,
      of_chat_id: args.ofChatId,
      body: args.body,
      price: args.price ?? 0,
      media_ids: args.mediaIds ?? [],
    },
  });
  if (error) throw error;
}
