import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { MessageBubble, ChatInput, MessagingEmptyState } from "@/components/messaging";
import { Users } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: string;
  recipient_id: string;
  recipient_type: string;
  read: boolean;
  created_at: string;
}

interface StaffData {
  id: string;
  name: string;
  type: "employee" | "chatter";
}

export default function EmployeeTeamChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchStaffData = useCallback(async () => {
    if (!user?.email) return null;

    // Check employees first
    const { data: empData } = await supabase
      .from("employees")
      .select("id, name, is_chatter")
      .ilike("email", user.email)
      .maybeSingle();

    if (empData) {
      // If they're a chatter, get their chatter ID instead
      if (empData.is_chatter) {
        const { data: chatterData } = await supabase
          .from("chatters")
          .select("id, name")
          .ilike("email", user.email)
          .maybeSingle();

        if (chatterData) {
          setStaffData({ id: chatterData.id, name: chatterData.name, type: "chatter" });
          return { id: chatterData.id, name: chatterData.name, type: "chatter" as const };
        }
      }
      
      setStaffData({ id: empData.id, name: empData.name, type: "employee" });
      return { id: empData.id, name: empData.name, type: "employee" as const };
    }

    // Fallback: check chatters table directly
    const { data: chatterData } = await supabase
      .from("chatters")
      .select("id, name")
      .ilike("email", user.email)
      .maybeSingle();

    if (chatterData) {
      setStaffData({ id: chatterData.id, name: chatterData.name, type: "chatter" });
      return { id: chatterData.id, name: chatterData.name, type: "chatter" as const };
    }

    return null;
  }, [user?.email]);

  const fetchMessages = useCallback(async (staff: StaffData) => {
    const { data, error } = await supabase
      .from("internal_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${staff.id},sender_type.eq.${staff.type}),and(recipient_id.eq.${staff.id},recipient_type.eq.${staff.type})`
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (staff: StaffData) => {
    await supabase
      .from("internal_messages")
      .update({ read: true })
      .eq("recipient_id", staff.id)
      .eq("recipient_type", staff.type)
      .eq("read", false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const staff = await fetchStaffData();
      if (staff) {
        await fetchMessages(staff);
        markAsRead(staff);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [fetchStaffData, fetchMessages, markAsRead]);

  // Real-time subscription
  useEffect(() => {
    if (!staffData) return;

    const channel = supabase
      .channel("staff-team-chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === staffData.id && newMsg.sender_type === staffData.type) ||
            (newMsg.recipient_id === staffData.id && newMsg.recipient_type === staffData.type)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.recipient_id === staffData.id) {
              markAsRead(staffData);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [staffData, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !staffData) return;

    setSending(true);
    const { error } = await supabase.from("internal_messages").insert({
      content: newMessage.trim(),
      sender_id: staffData.id,
      sender_type: staffData.type,
      recipient_id: "00000000-0000-0000-0000-000000000000", // Placeholder for agency
      recipient_type: "agency",
      read: false,
    });

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-4 p-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </EmployeeLayout>
    );
  }

  if (!staffData) {
    return (
      <EmployeeLayout>
        <MessagingEmptyState
          type="not-linked"
          description="Your account is not linked to a staff record. Please contact your agency."
        />
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="mb-3 md:mb-4 px-1">
          <h1 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 md:h-6 md:w-6" />
            Team Chat
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">Chat with the agency management team</p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 glass-card p-3 md:p-4" ref={scrollRef}>
          <div className="space-y-2 md:space-y-3">
            {messages.length === 0 ? (
              <MessagingEmptyState 
                type="no-messages" 
                description="No messages yet. Send a message to start the conversation with management."
              />
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_type === staffData.type && msg.sender_id === staffData.id;
                return (
                  <MessageBubble
                    key={msg.id}
                    content={msg.content}
                    timestamp={msg.created_at}
                    isOwn={isOwn}
                    read={msg.read}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="mt-3 md:mt-4">
          <ChatInput
            value={newMessage}
            onChange={setNewMessage}
            onSend={handleSend}
            disabled={sending}
            sending={sending}
            helperText="💬 Messages are sent to agency management"
          />
        </div>
      </div>
    </EmployeeLayout>
  );
}
