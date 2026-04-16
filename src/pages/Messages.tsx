import { useState, useEffect, useRef } from "react";
import { Search, MoreVertical, ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages, useUnreadMessages } from "@/hooks/useMessages";
import { useCreators } from "@/hooks/useCreators";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { ChatInput } from "@/components/messaging/ChatInput";
import { ConversationItem } from "@/components/messaging/ConversationItem";
import { MessagingEmptyState } from "@/components/messaging/EmptyState";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  online: boolean;
}

export default function Messages() {
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { creators } = useCreators();

  // Build conversations from creators only (employees use Team Chat)
  const conversations: Conversation[] = creators.map((c) => ({
    id: `creator-${c.id}`,
    name: c.alias || c.name,
    avatar: c.avatar_seed || c.name.toLowerCase().split(" ")[0],
    avatarUrl: c.avatar_url || null,
    online: c.online_status || false,
  }));

  const currentConvo = selectedConvo || conversations[0];
  const conversationId = currentConvo?.id || "";

  const { messages, loading, sendMessage, deleteMessage, markAsRead } = useMessages(conversationId, "agency");
  const { unreadCounts } = useUnreadMessages("agency");

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!messageInput.trim() || !currentConvo) return;
    const sent = await sendMessage(messageInput, "Agency Team");
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

  // Mark as read when selecting conversation
  useEffect(() => {
    if (currentConvo) {
      markAsRead();
    }
  }, [currentConvo?.id, markAsRead]);

  // Empty state when no creators or employees
  if (conversations.length === 0) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] glass-card animate-fade-in">
          <MessagingEmptyState
            type="no-conversations"
            actions={[
              { label: "Add Creators", href: "/creators" },
              { label: "Add Employees", href: "/employees" },
            ]}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
        {/* Conversations List */}
        <div className={`${isMobile ? 'w-full' : 'w-80'} flex flex-col glass-card ${isMobile && mobileShowChat ? 'hidden' : ''}`}>
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border focus:border-primary"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.map((convo) => (
                <ConversationItem
                  key={convo.id}
                  id={convo.id}
                  name={convo.name}
                  avatarSeed={convo.avatar}
                  avatarUrl={convo.avatarUrl}
                  subtitle="Click to start chatting"
                  badge="Creator"
                  badgeVariant="creator"
                  unreadCount={unreadCounts[convo.id] || 0}
                  isOnline={convo.online}
                  isSelected={currentConvo?.id === convo.id}
                  onClick={() => {
                    setSelectedConvo(convo);
                    if (isMobile) setMobileShowChat(true);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col glass-card ${isMobile && !mobileShowChat ? 'hidden' : ''}`}>
          {currentConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setMobileShowChat(false)}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <UserAvatar
                    name={currentConvo.name}
                    avatarSeed={currentConvo.avatar}
                    avatarUrl={currentConvo.avatarUrl}
                    showOnlineStatus
                    isOnline={currentConvo.online}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{currentConvo.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {currentConvo.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-5 w-5" />
                </Button>
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
                        isOwn={message.sender_type === "agency"}
                        read={message.read}
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
                showAttachment
                showEmoji
              />
            </>
          ) : (
            <MessagingEmptyState type="select-conversation" />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
