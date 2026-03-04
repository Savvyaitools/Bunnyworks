import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Chat {
  id: string;
  fan_name: string | null;
  fan_username: string | null;
  fan_avatar: string | null;
  last_message_at: string | null;
  unread_count: number | null;
  last_message_text: string | null;
}

interface ChatEngagementPanelProps {
  chats: Chat[];
  loading?: boolean;
}

export function ChatEngagementPanel({ chats, loading }: ChatEngagementPanelProps) {
  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const recentChats = chats
    .filter((c) => c.last_message_at)
    .sort((a, b) => new Date(b.last_message_at!).getTime() - new Date(a.last_message_at!).getTime())
    .slice(0, 10);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <CardTitle className="text-lg">Chat Engagement</CardTitle>
        </div>
        {totalUnread > 0 && (
          <Badge variant="destructive">{totalUnread} unread</Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentChats.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No chat data synced yet</p>
        ) : (
          <div className="space-y-2">
            {recentChats.map((chat) => (
              <div key={chat.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={chat.fan_avatar || undefined} />
                  <AvatarFallback className="bg-accent/20 text-accent text-xs">
                    {(chat.fan_name || chat.fan_username || "?")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {chat.fan_name || chat.fan_username || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.last_message_text || "No messages"}
                  </p>
                </div>
                {(chat.unread_count || 0) > 0 && (
                  <Badge variant="destructive" className="text-xs">{chat.unread_count}</Badge>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {chat.last_message_at
                    ? formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
