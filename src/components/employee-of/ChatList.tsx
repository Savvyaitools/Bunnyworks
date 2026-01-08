import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useOnlyFansAPI } from "@/hooks/useOnlyFansAPI";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  with_user: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  last_message?: {
    text: string;
    created_at: string;
    is_from_me: boolean;
  };
  unread_count: number;
}

interface ChatListProps {
  accountId: string;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ accountId, selectedChatId, onSelectChat }: ChatListProps) {
  const { listChats, loading } = useOnlyFansAPI();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      const result = await listChats(accountId, 100, 0);
      if (result?.data) {
        setChats(result.data);
      }
      setIsLoading(false);
    };

    fetchChats();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchChats, 30000);
    return () => clearInterval(interval);
  }, [accountId]);

  const filteredChats = chats.filter(chat => 
    chat.with_user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.with_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 h-[calc(100%-80px)]">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No messages found" : "No messages yet"}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                  selectedChatId === chat.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={chat.with_user.avatar} />
                    <AvatarFallback>{chat.with_user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{chat.with_user.name}</span>
                      {chat.unread_count > 0 && (
                        <Badge variant="default" className="shrink-0">
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{chat.with_user.username}
                    </p>
                    {chat.last_message && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {chat.last_message.is_from_me && "You: "}
                        {chat.last_message.text || "[Media]"}
                      </p>
                    )}
                  </div>
                  {chat.last_message && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
