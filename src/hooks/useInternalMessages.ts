import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InternalMessage {
  id: string;
  sender_id: string;
  sender_type: "chatter" | "agency";
  recipient_id: string;
  recipient_type: "chatter" | "agency";
  content: string;
  read: boolean;
  created_at: string;
}

export function useInternalMessages() {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("internal_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data as InternalMessage[]);
    } catch (error) {
      console.error("Error fetching internal messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = async (input: Omit<InternalMessage, "id" | "created_at" | "read">) => {
    try {
      const { data, error } = await supabase
        .from("internal_messages")
        .insert({ ...input, read: false })
        .select()
        .single();

      if (error) throw error;
      setMessages((prev) => [data as InternalMessage, ...prev]);
      toast.success("Message sent");
      return data as InternalMessage;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      return null;
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      const { error } = await supabase
        .from("internal_messages")
        .update({ read: true })
        .in("id", messageIds);

      if (error) throw error;
      setMessages((prev) =>
        prev.map((m) => (messageIds.includes(m.id) ? { ...m, read: true } : m))
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const unreadCount = messages.filter((m) => !m.read).length;

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}
