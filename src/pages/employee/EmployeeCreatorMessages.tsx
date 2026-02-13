import { useState, useEffect, useRef } from "react";
import { Search, MoreVertical } from "lucide-react";
import { EmployeeLayout } from "@/components/employee";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMessages, useUnreadMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/shared";
import { 
  MessageBubble, 
  ChatInput, 
  ConversationItem, 
  MessagingEmptyState 
} from "@/components/messaging";

interface AssignedCreator {
  id: string;
  name: string;
  alias: string | null;
  avatar_url: string | null;
  avatar_seed: string | null;
  online_status: boolean | null;
}

export default function EmployeeCreatorMessages() {
  const { user } = useAuth();
  const [selectedCreator, setSelectedCreator] = useState<AssignedCreator | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch creators that this employee manages or has OF permissions for
  const { data: assignedCreators = [], isLoading: creatorsLoading } = useQuery({
    queryKey: ["employee-assigned-creators", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get the employee record for this user
      const { data: employee, error: empError } = await supabase
        .from("employees")
        .select("id, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (empError || !employee) return [];

      // Get creators managed by this employee (via manager_id)
      const { data: managedCreators } = await supabase
        .from("creators")
        .select("id, name, alias, avatar_url, avatar_seed, online_status")
        .eq("manager_id", employee.id);

      // Get creators this employee has OF permissions for
      const { data: permissionRows } = await supabase
        .from("employee_of_permissions")
        .select("creator_id")
        .eq("employee_id", employee.id);

      const permCreatorIds = (permissionRows || [])
        .map((p) => p.creator_id)
        .filter((id) => !(managedCreators || []).some((c) => c.id === id));

      let permCreators: AssignedCreator[] = [];
      if (permCreatorIds.length > 0) {
        const { data } = await supabase
          .from("creators")
          .select("id, name, alias, avatar_url, avatar_seed, online_status")
          .in("id", permCreatorIds);
        permCreators = (data || []) as AssignedCreator[];
      }

      // Merge and deduplicate
      return [...(managedCreators || []), ...permCreators] as AssignedCreator[];
    },
    enabled: !!user?.id,
  });

  const currentCreator = selectedCreator || assignedCreators[0];
  const conversationId = currentCreator ? `creator-${currentCreator.id}` : "";

  const { messages, loading, sendMessage, markAsRead } = useMessages(conversationId, "agency");
  const { unreadCounts } = useUnreadMessages("agency");

  const filteredCreators = assignedCreators.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.alias?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = async () => {
    if (!messageInput.trim() || !currentCreator) return;
    await sendMessage(messageInput, "Manager");
    setMessageInput("");
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
    if (currentCreator) {
      markAsRead();
    }
  }, [currentCreator?.id, markAsRead]);

  if (creatorsLoading) {
    return (
      <EmployeeLayout>
        <div className="h-[calc(100vh-8rem)] p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </EmployeeLayout>
    );
  }

  // No assigned creators
  if (assignedCreators.length === 0) {
    return (
      <EmployeeLayout>
        <div className="h-[calc(100vh-8rem)] glass-card m-4 animate-fade-in">
          <MessagingEmptyState
            type="no-conversations"
            title="No Assigned Creators"
            description="You don't have any creators assigned to you. Contact your agency manager to get assigned to creators."
          />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4 p-4 animate-fade-in">
        {/* Creators List */}
        <div className="w-80 flex flex-col glass-card">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Creator Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border focus:border-primary"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredCreators.map((creator) => (
                <ConversationItem
                  key={creator.id}
                  id={creator.id}
                  name={creator.alias || creator.name}
                  avatarSeed={creator.avatar_seed || creator.name.toLowerCase().split(" ")[0]}
                  subtitle="Creator"
                  badge="Creator"
                  badgeVariant="creator"
                  unreadCount={unreadCounts[`creator-${creator.id}`] || 0}
                  isOnline={creator.online_status || false}
                  isSelected={currentCreator?.id === creator.id}
                  onClick={() => setSelectedCreator(creator)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col glass-card">
          {currentCreator ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={currentCreator.alias || currentCreator.name}
                    avatarSeed={currentCreator.avatar_seed || undefined}
                    showOnlineStatus
                    isOnline={currentCreator.online_status || false}
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {currentCreator.alias || currentCreator.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {currentCreator.online_status ? "Online" : "Offline"}
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
    </EmployeeLayout>
  );
}
