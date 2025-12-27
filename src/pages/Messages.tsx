import { useState, useEffect, useRef } from "react";
import { Search, Send, MoreVertical, Paperclip, Smile, Bell, MessageSquare, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMessages, useUnreadMessages } from "@/hooks/useMessages";
import { useCreators } from "@/hooks/useCreators";
import { useEmployees } from "@/hooks/useEmployees";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  type: "creator" | "employee";
  online: boolean;
}

export default function Messages() {
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { creators } = useCreators();
  const { employees } = useEmployees();

  // Build conversations from creators and employees
  const conversations: Conversation[] = [
    ...creators.map((c) => ({
      id: `creator-${c.id}`,
      name: c.name,
      avatar: c.avatar_seed || c.name.toLowerCase().split(" ")[0],
      type: "creator" as const,
      online: c.online_status || false,
    })),
    ...employees.map((e) => ({
      id: `employee-${e.id}`,
      name: e.name,
      avatar: e.avatar_seed || e.name.toLowerCase().split(" ")[0],
      type: "employee" as const,
      online: e.status === "Active",
    })),
  ];

  const currentConvo = selectedConvo || conversations[0];
  const conversationId = currentConvo?.id || "";

  const { messages, loading, sendMessage, markAsRead } = useMessages(conversationId, "agency");
  const { unreadCounts } = useUnreadMessages("agency");

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!messageInput.trim() || !currentConvo) return;
    await sendMessage(messageInput, "Agency Team");
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

  // Mark as read when selecting conversation
  useEffect(() => {
    if (currentConvo) {
      markAsRead();
    }
  }, [currentConvo?.id, markAsRead]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Empty state when no creators or employees
  if (conversations.length === 0) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center animate-fade-in">
          <div className="text-center glass-card p-12 max-w-md">
            <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No Contacts Yet</h2>
            <p className="text-muted-foreground mb-4">
              Add creators or employees to start messaging. Conversations will appear here once you have team members.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.location.href = "/creators"}>
                Add Creators
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/employees"}>
                Add Employees
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
        {/* Conversations List */}
        <div className="w-80 flex flex-col glass-card">
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
              {filteredConversations.map((convo) => {
                const unread = unreadCounts[convo.id] || 0;
                const isSelected = currentConvo?.id === convo.id;
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={cn(
                      "w-full p-3 rounded-lg flex items-start gap-3 transition-colors text-left",
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${convo.avatar}`} />
                        <AvatarFallback>{convo.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      {convo.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground truncate">{convo.name}</span>
                        {unread > 0 && (
                          <Badge className="bg-primary text-primary-foreground h-5 min-w-5 px-1.5">
                            {unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">Click to start chatting</p>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs mt-1",
                          convo.type === "creator" 
                            ? "border-primary/30 text-primary" 
                            : "border-accent/30 text-accent"
                        )}
                      >
                        {convo.type === "creator" ? "Creator" : "Employee"}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass-card">
          {currentConvo ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentConvo.avatar}`} />
                      <AvatarFallback>{currentConvo.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    {currentConvo.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
                    )}
                  </div>
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
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender_type === "agency" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "message-bubble",
                            message.sender_type === "agency"
                              ? "message-bubble-sent"
                              : "message-bubble-received"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            message.sender_type === "agency" ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
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
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-muted/50 border-border focus:border-primary"
                  />
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 shadow-glow-sm shrink-0"
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
