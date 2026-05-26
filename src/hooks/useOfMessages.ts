import { useEffect, useRef, useState, useCallback } from "react";
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
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastAutoSyncRef = useRef<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!chatId) { setMessages([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("of_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })
        .limit(5000);
      if (error) throw error;
      setMessages((data ?? []) as OfMessageRow[]);
    } finally {
      setLoading(false);
    }
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

  const sync = useCallback(async (opts?: { force?: boolean; months?: number }) => {
    if (!chatId) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const { error } = await supabase.functions.invoke("of-list-messages", {
        body: { chat_id: chatId, months: opts?.months ?? 6, force: opts?.force ?? false },
      });
      if (error) throw error;
      await load();
    } catch (error: any) {
      const message = error?.message ?? "Unable to sync messages";
      setSyncError(message);
      console.error("BunnyChat message sync failed", error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [chatId, load]);

  useEffect(() => {
    if (!chatId) return;
    // Throttle auto-sync per chat: at most once every 2 minutes per session.
    const last = lastAutoSyncRef.current[chatId] ?? 0;
    if (Date.now() - last < 2 * 60 * 1000) return;
    lastAutoSyncRef.current[chatId] = Date.now();
    sync().catch(() => undefined);
  }, [chatId, sync]);

  return { messages, loading: loading || syncing, syncing, syncError, reload: load, sync };
}

export interface SendOfMessageArgs {
  chatId: string;
  body: string;
  price?: number;
  mediaIds?: string[];
}

export async function sendOfMessage(args: SendOfMessageArgs) {
  const { error } = await supabase.functions.invoke("of-send-message", {
    body: {
      chat_id: args.chatId,
      text: args.body,
      price: args.price ?? 0,
      media_ids: args.mediaIds ?? [],
    },
  });
  if (error) throw error;
}
