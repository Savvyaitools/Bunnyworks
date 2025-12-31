import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "agency" | "creator";
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useMessages(conversationId: string, senderType: "agency" | "creator" = "agency", senderId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages((data || []) as Message[]);

      // Count unread messages from the other party
      const unread = (data || []).filter((m) => !m.read && m.sender_type !== senderType).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, senderType]);

  const sendMessage = async (content: string, senderName: string) => {
    if (!content.trim() || !conversationId) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        sender_name: senderName,
        content: content.trim(),
        read: false,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const markAsRead = async () => {
    if (!conversationId) return;

    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_type", senderType);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Show notification for messages from the other party
          if (newMessage.sender_type !== senderType) {
            toast.info(`New message from ${newMessage.sender_name}`, {
              description: newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? "..." : ""),
            });
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, senderType, fetchMessages]);

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}

// Hook to get all unread message counts across conversations
export function useUnreadMessages(senderType: "agency" | "creator" = "agency") {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("conversation_id")
        .eq("read", false)
        .neq("sender_type", senderType);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((m) => {
        counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1;
      });

      setUnreadCounts(counts);
      setTotalUnread(Object.values(counts).reduce((a, b) => a + b, 0));
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  }, [senderType]);

  useEffect(() => {
    fetchUnreadCounts();

    // Subscribe to new messages
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCounts();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCounts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUnreadCounts]);

  return { unreadCounts, totalUnread, refetch: fetchUnreadCounts };
}
