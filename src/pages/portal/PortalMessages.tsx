import { useState, useEffect, useRef } from "react";
import { Search, Send, Paperclip, Smile, Bell } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMessages, useUnreadMessages } from "@/hooks/useMessages";
import { UserAvatar } from "@/components/shared";
import { formatTime } from "@/lib/formatters";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
}

const teamMembers: TeamMember[] = [
  { id: "emma-agency", name: "PBF", role: "Account Manager", avatar: "sarah", online: true },
  { id: "alex-agency", name: "TROY", role: "Video Editor", avatar: "alex", online: true },
  { id: "jordan-agency", name: "BTZ", role: "Social Media Manager", avatar: "jordan", online: false },
  { id: "mike-agency", name: "FLIX", role: "Content Strategist", avatar: "mike", online: false },
];

export default function PortalMessages() {
  const [selectedMember, setSelectedMember] = useState(teamMembers[0]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage, markAsRead } = useMessages(selectedMember.id, "creator");
  const { unreadCounts } = useUnreadMessages("creator");

  const filteredMembers = teamMembers.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    await sendMessage(messageInput, "Creator");
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
  }, [selectedMember.id, markAsRead]);

  return (
    <PortalLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4 animate-fade-in">
        {/* Team Members List */}
        <div className="w-80 flex flex-col glass-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Team Chat</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border focus:border-accent"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredMembers.map((member) => {
                const unread = unreadCounts[member.id] || 0;
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={cn(
                      "w-full p-3 rounded-lg flex items-start gap-3 transition-colors text-left",
                      selectedMember.id === member.id ? "bg-accent/10 border border-accent/30" : "hover:bg-muted/50",
                    )}
                  >
                    <UserAvatar
                      name={member.name}
                      avatarSeed={member.avatar}
                      className="h-12 w-12"
                      showOnlineStatus
                      isOnline={member.online}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-foreground truncate">{member.name}</span>
                        {unread > 0 && (
                          <Badge className="bg-accent text-accent-foreground h-5 min-w-5 px-1.5">{unread}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-accent mb-1">{member.role}</p>
                      <p className="text-sm text-muted-foreground truncate">Click to start chatting</p>
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
          <div className="p-4 border-b border-border flex items-center gap-3">
            <UserAvatar
              name={selectedMember.name}
              avatarSeed={selectedMember.avatar}
              showOnlineStatus
              isOnline={selectedMember.online}
            />
            <div>
              <h3 className="font-semibold text-foreground">{selectedMember.name}</h3>
              <p className="text-xs text-accent">{selectedMember.role}</p>
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
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-muted/50 border-border focus:border-accent"
              />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
                <Smile className="h-5 w-5" />
              </Button>
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
      </div>
    </PortalLayout>
  );
}
