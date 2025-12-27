import { useState, useEffect, useRef } from "react";
import { Send, Search, Users, MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useInternalMessages } from "@/hooks/useInternalMessages";
import { useChatters } from "@/hooks/useChatters";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";

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
  }, [selectedChatterId, messages]);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-border bg-card animate-fade-in">
        {/* Chatters List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3">Internal Messages</h2>
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
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No chatters found</p>
              </div>
            ) : (
              <div className="p-2">
                {filteredChatters.map((chatter) => {
                  const unreadCount = getUnreadCount(chatter.id);
                  const isSelected = selectedChatterId === chatter.id;

                  return (
                    <button
                      key={chatter.id}
                      onClick={() => setSelectedChatterId(chatter.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                        isSelected
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${chatter.avatar_seed || chatter.name}`} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {chatter.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground truncate">{chatter.name}</p>
                          {unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Grade {chatter.skill_grade} • {chatter.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col">
          {selectedChatter ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChatter.avatar_seed || selectedChatter.name}`} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedChatter.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedChatter.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Grade {selectedChatter.skill_grade} • {selectedChatter.timezone || "No timezone"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                        <Skeleton className="h-16 w-64 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((message) => {
                      const isFromAgency = message.sender_type === "agency";
                      return (
                        <div
                          key={message.id}
                          className={cn("flex", isFromAgency ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg p-3",
                              isFromAgency
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={cn(
                              "text-xs mt-1",
                              isFromAgency ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {format(parseISO(message.created_at), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-muted/50 border-border"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Internal messages only. Chatters cannot communicate with creators.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a chatter</p>
                <p className="text-sm">Choose a chatter to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
