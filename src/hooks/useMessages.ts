import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useMemo, useCallback } from "react";
import { useAgency } from "./useAgency";
import { useAuth } from "./useAuth";

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "agency" | "creator";
  sender_name: string;
  content: string;
  read: boolean;
  created_at: string;
  agency_id?: string;
}

export function useMessages(conversationId: string, senderType: "agency" | "creator" = "agency") {
  const queryClient = useQueryClient();
  const { agencyId } = useAgency();
  const { user } = useAuth();

  // For creators, we need to fetch their agency_id from the creators table
  const { data: creatorAgencyId } = useQuery({
    queryKey: ["creator-agency-id", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data, error } = await supabase
        .from("creators")
        .select("agency_id")
        .ilike("email", user.email)
        .maybeSingle();
      if (error) throw error;
      return data?.agency_id;
    },
    enabled: senderType === "creator" && !!user?.email,
  });

  // Use the appropriate agency_id based on sender type
  const effectiveAgencyId = senderType === "agency" ? agencyId : creatorAgencyId;

  const { data: messages = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["messages", conversationId, effectiveAgencyId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
  });

  const unreadCount = useMemo(() => 
    messages.filter((m) => !m.read && m.sender_type !== senderType).length,
    [messages, senderType]
  );

  const sendMessage = useCallback(async (content: string, senderName: string) => {
    if (!content.trim() || !conversationId) return;

    // Require agency_id for all messages to ensure proper RLS filtering
    if (!effectiveAgencyId) {
      toast.error("Unable to send message - agency not found");
      return;
    }

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_type: senderType,
        sender_name: senderName,
        content: content.trim(),
        read: false,
        agency_id: effectiveAgencyId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  }, [conversationId, senderType, effectiveAgencyId]);

  const markAsRead = useCallback(async () => {
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
  }, [conversationId, senderType]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Refetch messages directly for immediate update
          refetch();

          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;
            if (newMessage.sender_type !== senderType) {
              toast.info(`New message from ${newMessage.sender_name}`, {
                description: newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? "..." : ""),
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, senderType, refetch]);

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch,
  };
}

// Hook to get all unread message counts across conversations
export function useUnreadMessages(senderType: "agency" | "creator" = "agency") {
  const { data, refetch } = useQuery({
    queryKey: ["unread-messages", senderType],
    queryFn: async () => {
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

      return counts;
    },
  });

  const unreadCounts = data || {};
  const totalUnread = useMemo(() => 
    Object.values(unreadCounts).reduce((a, b) => a + b, 0),
    [unreadCounts]
  );

  // Subscribe to new messages
  useEffect(() => {
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
          refetch();
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
          refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { unreadCounts, totalUnread, refetch };
}
