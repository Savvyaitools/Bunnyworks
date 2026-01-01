import { useState, useEffect, useCallback, useRef } from "react";
import { Send, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

interface EmployeeData {
  id: string;
  name: string;
}

export default function EmployeeMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchEmployeeData = useCallback(async () => {
    if (!user?.email) return null;

    const { data } = await supabase
      .from("employees")
      .select("id, name")
      .ilike("email", user.email)
      .maybeSingle();

    if (data) {
      setEmployeeData(data);
      return data;
    }
    return null;
  }, [user?.email]);

  const fetchMessages = useCallback(async (employeeId: string) => {
    const { data, error } = await supabase
      .from("internal_messages")
      .select("*")
      .or(`and(sender_id.eq.${employeeId},sender_type.eq.employee),and(recipient_id.eq.${employeeId},recipient_type.eq.employee)`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  }, []);

  const markAsRead = useCallback(async (employeeId: string) => {
    await supabase
      .from("internal_messages")
      .update({ read: true })
      .eq("recipient_id", employeeId)
      .eq("recipient_type", "employee")
      .eq("read", false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const emp = await fetchEmployeeData();
      if (emp) {
        await fetchMessages(emp.id);
        markAsRead(emp.id);
      }
    };
    init();
  }, [fetchEmployeeData, fetchMessages, markAsRead]);

  // Real-time subscription
  useEffect(() => {
    if (!employeeData) return;

    const channel = supabase
      .channel("employee-messages")
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
            (newMsg.sender_id === employeeData.id && newMsg.sender_type === "employee") ||
            (newMsg.recipient_id === employeeData.id && newMsg.recipient_type === "employee")
          ) {
            setMessages((prev) => [...prev, newMsg]);
            if (newMsg.recipient_id === employeeData.id) {
              markAsRead(employeeData.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeData, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !employeeData) return;

    setSending(true);
    const { error } = await supabase.from("internal_messages").insert({
      content: newMessage.trim(),
      sender_id: employeeData.id,
      sender_type: "employee",
      recipient_id: "agency", // Agency receives all employee messages
      recipient_type: "agency",
      read: false,
    });

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </EmployeeLayout>
    );
  }

  if (!employeeData) {
    return (
      <EmployeeLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Account not linked to employee record.</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">Chat with the agency team</p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 glass-card p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_type === "employee" && msg.sender_id === employeeData.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      isOwn ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <span>{format(new Date(msg.created_at), "h:mm a")}</span>
                      {isOwn && (
                        msg.read ? (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-card border-border"
            disabled={sending}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending}
            className="bg-gradient-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </EmployeeLayout>
  );
}