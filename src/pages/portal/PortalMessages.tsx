import { useState, useEffect, useRef } from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages } from "@/hooks/useMessages";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { ChatInput } from "@/components/messaging/ChatInput";
import { MessagingEmptyState } from "@/components/messaging/EmptyState";

export default function PortalMessages() {
  const { creatorId, creatorProfile, loading: creatorLoading } = useCreatorPortal();
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Conversation ID matches how agency creates conversations: "creator-{creator_id}"
  const conversationId = creatorId ? `creator-${creatorId}` : "";

  const { messages, loading, sendMessage, markAsRead } = useMessages(conversationId, "creator");

  const handleSend = async () => {
    if (!messageInput.trim() || !creatorProfile) return;
    const sent = await sendMessage(messageInput, creatorProfile.name);
    if (sent) {
      setMessageInput("");
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
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
        <div className="h-[calc(100vh-8rem)] glass-card animate-fade-in">
          <MessagingEmptyState
            type="not-linked"
            description="Your account is not linked to a creator profile. Please contact the agency to set up your account."
          />
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
              <MessagingEmptyState type="no-messages" />
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  content={message.content}
                  timestamp={message.created_at}
                  isOwn={message.sender_type === "creator"}
                  senderName={message.sender_name}
                  showSenderName={message.sender_type === "agency"}
                  read={message.read}
                  variant="accent"
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <ChatInput
          value={messageInput}
          onChange={setMessageInput}
          onSend={handleSend}
          variant="accent"
        />
      </div>
    </PortalLayout>
  );
}
