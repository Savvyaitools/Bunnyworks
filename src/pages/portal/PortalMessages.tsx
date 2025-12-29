import { useState, useEffect, useRef } from "react";
import { Send, Bell } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { formatTime } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortalMessages() {
  const { creatorId, creatorProfile, loading: creatorLoading } = useCreatorPortal();
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Conversation ID matches how agency creates conversations: "creator-{creator_id}"
  const conversationId = creatorId ? `creator-${creatorId}` : "";

  const { messages, loading, sendMessage, markAsRead } = useMessages(conversationId, "creator");

  const handleSend = async () => {
    if (!messageInput.trim() || !creatorProfile) return;
    await sendMessage(messageInput, creatorProfile.name);
    setMessageInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead]);

  if (creatorLoading) {
    return (
      <PortalLayout>
        <div className="h-[calc(100vh-8rem)] flex flex-col glass-card animate-fade-in">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="flex-1 p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-3/4" />
            ))}
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (!creatorId) {
    return (
      <PortalLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center animate-fade-in">
          <div className="text-center glass-card p-12 max-w-md">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Account Not Linked</h2>
            <p className="text-muted-foreground">
              Your account is not linked to a creator profile. Please contact the agency to set up your account.
            </p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col glass-card animate-fade-in">
        {/* Chat Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Messages with Agency</h2>
          <p className="text-sm text-muted-foreground">Direct communication with your management team</p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.sender_type === "creator" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "message-bubble",
                      message.sender_type === "creator"
                        ? "bg-accent text-accent-foreground rounded-br-md"
                        : "message-bubble-received",
                    )}
                  >
                    {message.sender_type === "agency" && (
                      <p className="text-xs font-medium mb-1 opacity-70">{message.sender_name}</p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.sender_type === "creator" ? "text-accent-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-muted/50 border-border focus:border-accent"
            />
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow-sm shrink-0"
              onClick={handleSend}
              disabled={!messageInput.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
