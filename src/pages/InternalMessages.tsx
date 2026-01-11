import { useState, useEffect, useRef } from "react";
import { Search, MoreVertical, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useInternalMessages } from "@/hooks/useInternalMessages";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/shared";
import { 
  MessageBubble, 
  ChatInput, 
  MessagingEmptyState 
} from "@/components/messaging";

export default function InternalMessages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage, markAsRead } = useInternalMessages();
  const { teamMembers, loading: membersLoading } = useTeamMembers();
  const { profile } = useAuth();

  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get messages for selected member
  const conversationMessages = selectedMember
    ? messages.filter(
        (m) =>
          (m.sender_type === selectedMember.type && m.sender_id === selectedMember.id) ||
          (m.recipient_type === selectedMember.type && m.recipient_id === selectedMember.id)
      ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  // Get unread count per member
  const getUnreadCount = (member: TeamMember) => {
    return messages.filter(
      (m) =>
        !m.read &&
        m.sender_type === member.type &&
        m.sender_id === member.id
    ).length;
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages.length]);

  // Mark as read when viewing
  useEffect(() => {
    if (selectedMember) {
      const unreadIds = messages
        .filter(
          (m) =>
            !m.read &&
            m.sender_type === selectedMember.type &&
            m.sender_id === selectedMember.id
        )
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  }, [selectedMember, messages, markAsRead]);

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedMember || !profile) return;

    await sendMessage({
      sender_id: profile.id,
      sender_type: "agency",
      recipient_id: selectedMember.id,
      recipient_type: selectedMember.type,
      content: messageInput.trim(),
    });

    setMessageInput("");
  };

  const getMemberSubtitle = (member: TeamMember) => {
    if (member.type === "chatter") {
      return `Grade ${member.skillGrade || "B"} • ${member.isActive ? "Active" : "Inactive"}`;
    }
    return `${member.role} • ${member.isActive ? "Active" : "Inactive"}`;
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-border bg-card animate-fade-in">
        {/* Team Members List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Chat
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {membersLoading ? (
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
            ) : filteredMembers.length === 0 ? (
              <MessagingEmptyState type="no-conversations" title="No team members found" />
            ) : (
              <div className="p-2">
                {filteredMembers.map((member) => {
                  const unreadCount = getUnreadCount(member);
                  const isSelected = selectedMember?.id === member.id && selectedMember?.type === member.type;
                  
                  return (
                    <button
                      key={`${member.type}-${member.id}`}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <UserAvatar 
                        name={member.name} 
                        avatarSeed={member.avatarSeed || undefined}
                        className="h-10 w-10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{member.name}</p>
                          <Badge 
                            variant={member.type === "chatter" ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {member.type === "chatter" ? "Chatter" : "Staff"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {getMemberSubtitle(member)}
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col">
          {selectedMember ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    name={selectedMember.name} 
                    avatarSeed={selectedMember.avatarSeed || undefined} 
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{selectedMember.name}</p>
                      <Badge 
                        variant={selectedMember.type === "chatter" ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {selectedMember.type === "chatter" ? "Chatter" : "Staff"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getMemberSubtitle(selectedMember)}
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
                helperText="💬 Internal team messaging — for staff coordination only."
              />
            </>
          ) : (
            <MessagingEmptyState type="select-conversation" title="Select a team member" />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
