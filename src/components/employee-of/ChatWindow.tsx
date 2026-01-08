import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOnlyFansAPI } from "@/hooks/useOnlyFansAPI";
import { Send, MessageCircle, Image } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  created_at: string;
  is_from_me: boolean;
  media?: { id: string; url: string; type: string }[];
  price?: number;
}

interface ChatWindowProps {
  accountId: string;
  chatId: string | null;
  canSendMessages: boolean;
}

export function ChatWindow({ accountId, chatId, canSendMessages }: ChatWindowProps) {
  const { getChatMessages, sendMessage, loading } = useOnlyFansAPI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      
      setIsLoading(true);
      const result = await getChatMessages(accountId, chatId, 100, 0);
      if (result?.data) {
        // Reverse to show oldest first
        setMessages(result.data.reverse());
      }
      setIsLoading(false);
    };

    fetchMessages();
    
    // Poll for new messages every 10 seconds when chat is open
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [accountId, chatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!chatId || !newMessage.trim() || isSending) return;

    setIsSending(true);
    const result = await sendMessage(accountId, chatId, newMessage.trim());
    if (result) {
      setNewMessage("");
      // Refresh messages
      const updated = await getChatMessages(accountId, chatId, 100, 0);
      if (updated?.data) {
        setMessages(updated.data.reverse());
      }
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
        <p className="text-muted-foreground">
          Choose a conversation from the list to start chatting
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <CardHeader className="border-b">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="flex-1 p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
              <Skeleton className="h-16 w-48 rounded-lg" />
            </div>
          ))}
        </CardContent>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="border-b py-3">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.is_from_me ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    message.is_from_me
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.media && message.media.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {message.media.map((m) => (
                        <div key={m.id} className="rounded overflow-hidden">
                          {m.type === "photo" ? (
                            <img src={m.url} alt="" className="max-w-full h-auto" />
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                              <Image className="h-4 w-4" />
                              <span className="text-sm">Video</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                  {message.price && message.price > 0 && (
                    <p className="text-xs mt-1 opacity-75">💰 ${message.price}</p>
                  )}
                  <p className={cn(
                    "text-xs mt-1",
                    message.is_from_me ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {canSendMessages && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
            <Button onClick={handleSend} disabled={isSending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
