import { useState, useRef, useEffect, useCallback } from "react";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { Send, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import { format } from "date-fns";
import { LucideIcon } from "lucide-react";

interface ExecutedAction {
  tool: string;
  result: string;
  success: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actionsExecuted?: ExecutedAction[];
}

interface QuickAction {
  label: string;
  icon: LucideIcon;
  query: string;
}

interface AgentChatPanelProps {
  agentContext: string;
  agentName: string;
  agentIcon: LucideIcon;
  agentDescription: string;
  agentBadge: string;
  colorClass: string;
  quickActions: QuickAction[];
  placeholder: string;
  loadingText?: string;
  className?: string;
}

export function AgentChatPanel({
  agentContext,
  agentName,
  agentIcon: AgentIcon,
  agentDescription,
  agentBadge,
  colorClass,
  quickActions,
  placeholder,
  loadingText = "Thinking...",
  className,
}: AgentChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { agency } = useAgency();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading || !agency?.id || !user?.id) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: query, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("ai-felix-query", {
        body: {
          query,
          queryType: "general",
          conversationHistory: history,
          agentContext,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.response, timestamp: new Date(), actionsExecuted: data.actionsExecuted },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      toast.error(msg);
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `Sorry, I encountered an error: ${msg}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, agency?.id, user?.id, messages, agentContext]);

  const handleSend = () => {
    if (!input.trim()) return;
    const q = input;
    setInput("");
    sendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card overflow-hidden", className)} style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
        <div className="relative">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", colorClass)}>
            <AgentIcon className="h-5 w-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        </div>
        <div>
          <h3 className="font-semibold flex items-center gap-1.5">
            {agentName}
            <Badge variant="outline" className="text-[10px]">{agentBadge}</Badge>
          </h3>
          <p className="text-xs text-muted-foreground">{agentDescription}</p>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMessages([])} title="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className={cn("w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center opacity-20", colorClass)}>
                <AgentIcon className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-medium mb-1">Hey, I'm {agentName} 👋</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{agentDescription}</p>
            </div>
            {quickActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">Quick Actions</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.map(a => (
                    <Button key={a.label} variant="outline" size="sm" onClick={() => sendMessage(a.query)} disabled={isLoading} className="gap-1.5">
                      <a.icon className="h-3.5 w-3.5" />
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(m => (
              <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "assistant" && (
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                    <AgentIcon className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={cn("max-w-[80%] rounded-lg p-3", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border")}>
                  {m.role === "assistant" ? <MarkdownRenderer content={m.content} /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs opacity-70">{format(m.timestamp, "h:mm a")}</span>
                    {m.actionsExecuted && m.actionsExecuted.length > 0 && (
                      <Badge variant="outline" className="text-xs py-0 h-5 gap-1 border-green-500/50 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {m.actionsExecuted.filter(a => a.success).length} action{m.actionsExecuted.filter(a => a.success).length !== 1 ? 's' : ''} executed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                  <AgentIcon className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted/50 border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">{loadingText}</span>
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
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="bg-muted/50"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
