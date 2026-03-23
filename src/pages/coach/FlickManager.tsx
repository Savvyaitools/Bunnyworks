import { useState, useRef, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarkdownRenderer } from "@/components/ai/MarkdownRenderer";
import { Bot, Send, Loader2, UserCog, ClipboardCheck, CalendarCheck, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: "Daily Check-In", icon: ClipboardCheck, query: "Run a daily creator check-in. Which creators haven't uploaded content today and who is falling behind on their weekly quotas?" },
  { label: "Content Pipeline", icon: CalendarCheck, query: "Review the content pipeline for all creators. Who has less than 3 days of scheduled content remaining?" },
  { label: "Performance Scores", icon: BarChart3, query: "Generate creator performance scores based on content consistency, fan engagement, and revenue efficiency." },
];

export default function FlickManager() {
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
          agentContext: "flick_manager",
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.response, timestamp: new Date() },
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
  }, [isLoading, agency?.id, user?.id, messages]);

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
    <DashboardLayout>
      <PageHeader title="Flick" subtitle="AI Creator Manager — onboarding, productivity, content pipeline & performance" />

      <div className="mt-6 flex flex-col rounded-xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-warning-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h3 className="font-semibold flex items-center gap-1.5">
              Flick
              <Badge variant="outline" className="text-[10px]">Manager</Badge>
            </h3>
            <p className="text-xs text-muted-foreground">Creator Management &amp; Productivity</p>
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
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
                  <UserCog className="h-8 w-8 text-warning" />
                </div>
                <h4 className="font-medium mb-1">Hey, I'm Flick 👋</h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your AI Creator Manager. I handle onboarding, daily check-ins, content pipeline tracking, performance scoring, and creator coaching. Ask me anything about your creators.
                </p>
              </div>
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
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center shrink-0">
                      <UserCog className="h-4 w-4 text-warning-foreground" />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] rounded-lg p-3", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border")}>
                    {m.role === "assistant" ? <MarkdownRenderer content={m.content} /> : <p className="text-sm whitespace-pre-wrap">{m.content}</p>}
                    <span className="text-xs opacity-70 mt-2 block">{format(m.timestamp, "h:mm a")}</span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center shrink-0">
                    <UserCog className="h-4 w-4 text-warning-foreground" />
                  </div>
                  <div className="bg-muted/50 border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Reviewing creator data...</span>
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
              placeholder="Ask Flick about creator management, content pipelines, performance..."
              disabled={isLoading}
              className="bg-muted/50"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
