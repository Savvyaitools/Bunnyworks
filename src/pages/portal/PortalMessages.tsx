import { useState } from "react";
import { Search, Send, Paperclip, Smile } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: "creator" | "team";
  time: string;
}

const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Account Manager",
    avatar: "sarah",
    lastMessage: "Great work on the latest video!",
    time: "10 min",
    unread: 1,
    online: true,
  },
  {
    id: "2",
    name: "Alex Rivera",
    role: "Video Editor",
    avatar: "alex",
    lastMessage: "Finished editing your latest video",
    time: "2 hr",
    unread: 0,
    online: true,
  },
  {
    id: "3",
    name: "Jordan Lee",
    role: "Social Media Manager",
    avatar: "jordan",
    lastMessage: "Posts scheduled for next week",
    time: "5 hr",
    unread: 0,
    online: false,
  },
  {
    id: "4",
    name: "Mike Chen",
    role: "Content Strategist",
    avatar: "mike",
    lastMessage: "Let's discuss January content",
    time: "1 day",
    unread: 1,
    online: false,
  },
];

const conversationMessages: Message[] = [
  { id: "1", content: "Hey Emma! Just wanted to check in on the video progress.", sender: "team", time: "9:30 AM" },
  { id: "2", content: "Hi Sarah! I'm almost done filming. Should have everything ready by tomorrow.", sender: "creator", time: "9:45 AM" },
  { id: "3", content: "Perfect! The editing team is ready to receive the files.", sender: "team", time: "9:50 AM" },
  { id: "4", content: "Also, the analytics from last week's content look amazing. You've had a 25% increase in engagement!", sender: "team", time: "9:52 AM" },
  { id: "5", content: "That's great news! I've been trying some new content formats.", sender: "creator", time: "10:00 AM" },
  { id: "6", content: "It's definitely working. Keep it up! 🎉", sender: "team", time: "10:02 AM" },
  { id: "7", content: "Great work on the latest video! The team loved it.", sender: "team", time: "10:30 AM" },
];

export default function PortalMessages() {
  const [selectedMember, setSelectedMember] = useState(teamMembers[0]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = teamMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={cn(
                    "w-full p-3 rounded-lg flex items-start gap-3 transition-colors text-left",
                    selectedMember.id === member.id
                      ? "bg-accent/10 border border-accent/30"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`} />
                      <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    {member.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-foreground truncate">{member.name}</span>
                      <span className="text-xs text-muted-foreground">{member.time}</span>
                    </div>
                    <p className="text-xs text-accent mb-1">{member.role}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{member.lastMessage}</p>
                      {member.unread > 0 && (
                        <Badge className="bg-accent text-accent-foreground h-5 min-w-5 px-1.5">
                          {member.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass-card">
          {/* Chat Header */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.avatar}`} />
                <AvatarFallback>{selectedMember.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              {selectedMember.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{selectedMember.name}</h3>
              <p className="text-xs text-accent">{selectedMember.role}</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {conversationMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "creator" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "message-bubble",
                      message.sender === "creator"
                        ? "bg-accent text-accent-foreground rounded-br-md"
                        : "message-bubble-received"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender === "creator" ? "text-accent-foreground/70" : "text-muted-foreground"
                    )}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
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
                className="bg-muted/50 border-border focus:border-accent"
              />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
                <Smile className="h-5 w-5" />
              </Button>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow-sm shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
