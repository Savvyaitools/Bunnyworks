import { useState, useEffect, useRef } from "react";
import { Search, Send, Phone, Video, MoreVertical, Paperclip, Smile, Bell } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMessages, useUnreadMessages } from "@/hooks/useMessages";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  type: "creator" | "employee";
  online: boolean;
}

const conversations: Conversation[] = [
  { id: "emma-agency", name: "Emma Rose", avatar: "emma", type: "creator", online: true },
  { id: "sarah-agency", name: "Sarah Johnson", avatar: "sarah", type: "employee", online: true },
  { id: "luna-agency", name: "Luna Star", avatar: "luna", type: "creator", online: false },
  { id: "alex-agency", name: "Alex Rivera", avatar: "alex", type: "employee", online: true },
  { id: "jessica-agency", name: "Jessica Blake", avatar: "jessica", type: "creator", online: false },
];

export default function Messages() {
  const [selectedConvo, setSelectedConvo] = useState(conversations[0]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage, markAsRead } = useMessages(selectedConvo.id, "agency");
  const { unreadCounts } = useUnreadMessages("agency");

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!messageInput.trim()) return;
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
    markAsRead();
  }, [selectedConvo.id, markAsRead]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatLastSeen = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hr`;
    return `${Math.floor(minutes / 1440)} day`;
  };

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
                return (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo)}
                    className={cn(
                      "w-full p-3 rounded-lg flex items-start gap-3 transition-colors text-left",
                      selectedConvo.id === convo.id
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
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConvo.avatar}`} />
                  <AvatarFallback>{selectedConvo.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                {selectedConvo.online && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{selectedConvo.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConvo.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
