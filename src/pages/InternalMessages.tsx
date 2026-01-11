import { useState, useEffect, useRef } from "react";
import { Search, MoreVertical } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternalMessages } from "@/hooks/useInternalMessages";
import { useChatters } from "@/hooks/useChatters";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/shared";
import { 
  MessageBubble, 
  ChatInput, 
  ConversationItem, 
  MessagingEmptyState 
} from "@/components/messaging";

export default function InternalMessages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatterId, setSelectedChatterId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage, markAsRead } = useInternalMessages();
  const { chatters, loading: chattersLoading } = useChatters();
  const { profile } = useAuth();

  const filteredChatters = chatters.filter((chatter) =>
    chatter.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedChatter = chatters.find((c) => c.id === selectedChatterId);

  // Get messages for selected chatter
  const conversationMessages = messages.filter(
    (m) =>
      (m.sender_type === "chatter" && m.sender_id === selectedChatterId) ||
      (m.recipient_type === "chatter" && m.recipient_id === selectedChatterId)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  // Get unread count per chatter
  const getUnreadCount = (chatterId: string) => {
    return messages.filter(
      (m) =>
        !m.read &&
        m.sender_type === "chatter" &&
        m.sender_id === chatterId
    ).length;
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages.length]);

  // Mark as read when viewing
  useEffect(() => {
    if (selectedChatterId) {
      const unreadIds = messages
        .filter(
          (m) =>
            !m.read &&
            m.sender_type === "chatter" &&
            m.sender_id === selectedChatterId
        )
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  }, [selectedChatterId, messages, markAsRead]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedChatterId || !profile) return;

    await sendMessage({
      sender_id: profile.id,
      sender_type: "agency",
      recipient_id: selectedChatterId,
      recipient_type: "chatter",
      content: messageInput.trim(),
    });

    setMessageInput("");
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-border bg-card animate-fade-in">
        {/* Chatters List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3">Team Chat</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chatters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {chattersLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChatters.length === 0 ? (
              <MessagingEmptyState type="no-conversations" title="No chatters found" />
            ) : (
              <div className="p-2">
                {filteredChatters.map((chatter) => (
                  <ConversationItem
                    key={chatter.id}
                    id={chatter.id}
                    name={chatter.name}
                    avatarSeed={chatter.avatar_seed || undefined}
                    subtitle={`Grade ${chatter.skill_grade} • ${chatter.is_active ? "Active" : "Inactive"}`}
                    unreadCount={getUnreadCount(chatter.id)}
                    isSelected={selectedChatterId === chatter.id}
                    onClick={() => setSelectedChatterId(chatter.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col">
          {selectedChatter ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    name={selectedChatter.name} 
                    avatarSeed={selectedChatter.avatar_seed} 
                  />
                  <div>
                    <p className="font-medium text-foreground">{selectedChatter.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Grade {selectedChatter.skill_grade} • {selectedChatter.timezone || "No timezone"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className="h-16 w-64 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <MessagingEmptyState type="no-messages" />
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        content={message.content}
                        timestamp={message.created_at}
                        isOwn={message.sender_type === "agency"}
                        read={message.read}
                        showReadReceipt={false}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <ChatInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSend}
                helperText="💬 Internal team messaging — for staff coordination only. Use Creator Messages for creators."
              />
            </>
          ) : (
            <MessagingEmptyState type="select-conversation" title="Select a chatter" />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
