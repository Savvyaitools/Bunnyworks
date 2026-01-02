import { useSupabaseRead } from "./useSupabaseCRUD";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const markAsRead = async (messageIds: string[]) => {
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
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return {
    messages,
    loading,
    unreadCount,
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead,
    refetch,
  };
}
