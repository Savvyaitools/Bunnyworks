import { useState, useRef, useEffect } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Bot, Send, Loader2, Sparkles, BarChart3, TrendingUp, AlertTriangle, Trash2, Plus, MessageSquare, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFelix } from "@/hooks/useFelix";
import { format } from "date-fns";

interface FelixChatProps {
  className?: string;
  compact?: boolean;
}

const quickActions = [
  { label: "Daily Summary", icon: BarChart3, query: "Give me a quick summary of today's agency performance." },
  { label: "Top Performers", icon: TrendingUp, query: "Who are my top performing creators and chatters this week?" },
  { label: "Alerts", icon: AlertTriangle, query: "Are there any issues or concerns I should be aware of?" },
];

export function FelixChat({ className, compact = false }: FelixChatProps) {
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { 
    messages, conversations, activeConversationId, isLoading, isLoadingHistory,
    sendQuery, startNewChat, selectConversation, deleteConversation 
  } = useFelix();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const query = input;
    setInput("");
    await sendQuery(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (query: string) => {
    if (isLoading) return;
    await sendQuery(query);
  };

  return (
    <div className={cn("flex h-full bg-background rounded-lg border border-border", className)}>
      {/* Conversation History Sidebar */}
      {showHistory && !compact && (
        <div className="w-64 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">History</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { startNewChat(); setShowHistory(false); }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                    activeConversationId === conv.id && "bg-muted"
                  )}
                  onClick={() => { selectConversation(conv.id); }}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Chat */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            {!compact && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(!showHistory)}>
                <Clock className="h-4 w-4" />
              </Button>
            )}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-1.5">
                Coach PBF
                <Sparkles className="h-4 w-4 text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground">AI Agency Orchestrator</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8" title="New conversation">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef}>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-medium mb-1">Hey! I'm Coach PBF 👋</h4>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your AI agency orchestrator. Ask me about your team performance, revenue insights, or any questions about your agency.
                </p>
              </div>
              
              {!compact && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">Quick Actions</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.query)}
                        disabled={isLoading}
                        className="gap-1.5"
                      >
                        <action.icon className="h-3.5 w-3.5" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 border border-border"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs opacity-70">
                        {format(message.timestamp, "h:mm a")}
                      </span>
                      {message.dataAccessed && message.dataAccessed.length > 0 && (
                        <Badge variant="outline" className="text-xs py-0 h-5">
                          {message.dataAccessed.length} sources
                        </Badge>
                      )}
                      {message.actionsExecuted && message.actionsExecuted.length > 0 && (
                        <Badge variant="outline" className="text-xs py-0 h-5 gap-1 border-green-500/50 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          {message.actionsExecuted.filter(a => a.success).length} action{message.actionsExecuted.filter(a => a.success).length !== 1 ? 's' : ''} executed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted/50 border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask Coach PBF anything about your agency..."
              disabled={isLoading}
              className="bg-muted/50"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
