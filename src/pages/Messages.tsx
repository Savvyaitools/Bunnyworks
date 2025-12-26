import { useState } from "react";
import { Search, Send, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  type: "creator" | "employee";
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "other";
  time: string;
}

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Emma Rose",
    avatar: "emma",
    type: "creator",
    lastMessage: "Can we schedule a call for tomorrow?",
    time: "2 min",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "Sarah Johnson",
    avatar: "sarah",
    type: "employee",
    lastMessage: "The content is ready for review",
    time: "15 min",
    unread: 0,
    online: true,
  },
  {
    id: "3",
    name: "Luna Star",
    avatar: "luna",
    type: "creator",
    lastMessage: "Thanks for the update!",
    time: "1 hr",
    unread: 0,
    online: false,
  },
  {
    id: "4",
    name: "Alex Rivera",
    avatar: "alex",
    type: "employee",
    lastMessage: "I'll have the edits done by EOD",
    time: "2 hr",
    unread: 1,
    online: true,
  },
  {
    id: "5",
    name: "Jessica Blake",
    avatar: "jessica",
    type: "creator",
    lastMessage: "Just finished the onboarding form",
    time: "3 hr",
    unread: 5,
    online: false,
  },
];

const messages: Message[] = [
  { id: "1", content: "Hey! I wanted to discuss the upcoming content schedule.", sender: "other", time: "10:30 AM" },
  { id: "2", content: "Sure! What did you have in mind?", sender: "user", time: "10:32 AM" },
  { id: "3", content: "I was thinking we could do a special series for the holidays. Maybe 5 videos over the next two weeks?", sender: "other", time: "10:35 AM" },
  { id: "4", content: "That sounds great! Let me check the production schedule and get back to you.", sender: "user", time: "10:38 AM" },
  { id: "5", content: "Perfect! Also, can we schedule a call for tomorrow to go over the details?", sender: "other", time: "10:40 AM" },
];

export default function Messages() {
  const [selectedConvo, setSelectedConvo] = useState(conversations[0]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              {filteredConversations.map((convo) => (
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
                      <span className="text-xs text-muted-foreground">{convo.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                      {convo.unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground h-5 min-w-5 px-1.5">
                          {convo.unread}
                        </Badge>
                      )}
                    </div>
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
              ))}
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
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.sender === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "message-bubble",
                      message.sender === "user"
                        ? "message-bubble-sent"
                        : "message-bubble-received"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      message.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
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
                className="bg-muted/50 border-border focus:border-primary"
              />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground shrink-0">
                <Smile className="h-5 w-5" />
              </Button>
              <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-sm shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
