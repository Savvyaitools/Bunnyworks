import { useSupabaseRead } from "./useSupabaseCRUD";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMemo, useCallback, useEffect } from "react";

export interface InternalMessage {
  id: string;
  sender_id: string;
  sender_type: "chatter" | "agency" | "employee";
  recipient_id: string;
  recipient_type: "chatter" | "agency" | "employee";
  content: string;
  read: boolean;
  created_at: string;
}

export function useInternalMessages() {
  const queryClient = useQueryClient();

  const { items: messages, loading, refetch } = useSupabaseRead<InternalMessage>({
    table: "internal_messages",
    queryKey: "internal-messages",
    orderBy: { column: "created_at", ascending: false },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (input: Omit<InternalMessage, "id" | "created_at" | "read">) => {
      const { data, error } = await supabase
        .from("internal_messages")
        .insert({ ...input, read: false })
        .select()
        .single();

      if (error) throw error;
      return data as InternalMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
      toast.success("Message sent");
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from("internal_messages")
        .update({ read: true })
        .in("id", messageIds);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [queryClient]);

  // Memoize unread count to prevent recalculation on every render
  const unreadCount = useMemo(() => 
    messages.filter((m) => !m.read).length, 
    [messages]
  );

  // Subscribe to real-time updates for internal messages
  useEffect(() => {
    const channel = supabase
      .channel("internal-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
        },
        (payload) => {
          const newMessage = payload.new as InternalMessage;
          queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
          
          // Show toast for new messages (except ones we sent)
          toast.info("New internal message received", {
            description: newMessage.content.slice(0, 50) + (newMessage.content.length > 50 ? "..." : ""),
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "internal_messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["internal-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    messages,
    loading,
    unreadCount,
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead,
    refetch,
  };
}
