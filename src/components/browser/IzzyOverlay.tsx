import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, X, Loader2, Send, ChevronUp, ChevronDown,
  Zap, BrainCircuit, Eye, RotateCcw, MessageCircle, ShieldCheck, ScanSearch
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeBrowserAction } from "@/lib/browserbase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Suggestion {
  text: string;
  intent: string;
  confidence: number;
}

interface HandledMessage {
  fanMessage: string;
  reply: string;
  autoSent: boolean;
  timestamp: Date;
}

interface IzzyOverlayProps {
  creatorId: string;
  creatorName?: string;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
  browserbaseSessionId?: string;
}

export function IzzyOverlay({ creatorId, creatorName, iframeRef, browserbaseSessionId }: IzzyOverlayProps) {
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [fanMessage, setFanMessage] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);
  const [injecting, setInjecting] = useState<number | null>(null);
  const [history, setHistory] = useState<HandledMessage[]>([]);
  const [activeTab, setActiveTab] = useState<"assist" | "history">("assist");
  const [confidenceThreshold] = useState(80);
  const [detectedFanName, setDetectedFanName] = useState<string>("");
  const autoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-mode: periodically read chat and generate suggestions
  useEffect(() => {
    if (!autoMode || !browserbaseSessionId) {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const result = await invokeBrowserAction("read_chat_context", { browserbaseSessionId });
        if (!result?.success || !result.data?.lastFanMessage) return;

        const lastFan = result.data.lastFanMessage;
        if (lastFan === fanMessage) return; // Same message, skip

        setFanMessage(lastFan);
        if (result.data.fanName) setDetectedFanName(result.data.fanName);

        // Auto-generate suggestions
        const { data, error } = await supabase.functions.invoke("ai-izzy-suggest", {
          body: {
            fanMessage: lastFan,
            conversationHistory: (result.data.messages || []).map((m: any) => ({
              role: m.role === "fan" ? "user" : "assistant",
              content: m.text,
            })),
            creatorId,
            suggestionType: "reply",
          },
        });
        if (!error && data?.suggestions) {
          setSuggestions(data.suggestions);
          // Flash notification for high-confidence suggestions
          const highConf = data.suggestions.find((s: Suggestion) => s.confidence >= confidenceThreshold);
          if (highConf) {
            toast.info("Jodie has a high-confidence reply ready", { duration: 3000 });
          }
        }
      } catch (err) {
        console.warn("Auto-assist poll error:", err);
      }
    };

    poll(); // Run immediately
    autoIntervalRef.current = setInterval(poll, 15000); // Every 15 seconds
    return () => {
      if (autoIntervalRef.current) clearInterval(autoIntervalRef.current);
    };
  }, [autoMode, browserbaseSessionId, creatorId, confidenceThreshold]);

  // Read chat context from the live browser session via CDP
  const readChatContext = useCallback(async () => {
    if (!browserbaseSessionId) {
      toast.error("No active browser session");
      return;
    }
    setReading(true);
    try {
      const result = await invokeBrowserAction("read_chat_context", { browserbaseSessionId });
      if (!result?.success) {
        toast.error("Failed to read chat: " + (result?.error || "Unknown error"));
        return;
      }
      const data = result.data;
      if (data?.lastFanMessage) {
        setFanMessage(data.lastFanMessage);
        toast.success("Fan message captured");
      } else {
        toast.info("No fan messages detected on current page");
      }
      if (data?.fanName) setDetectedFanName(data.fanName);
    } catch (err) {
      toast.error("Failed to read chat context");
    } finally {
      setReading(false);
    }
  }, [browserbaseSessionId]);

  const getSuggestions = useCallback(async () => {
    if (!fanMessage.trim()) {
      toast.error("Paste or read the fan's message first");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-izzy-suggest", {
        body: {
          fanMessage,
          conversationHistory: [],
          creatorId,
          suggestionType: "reply",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get suggestions";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [fanMessage, creatorId]);

  const injectReply = useCallback(async (text: string, idx: number) => {
    setInjecting(idx);

    let injected = false;

    // Try CDP injection into the remote browser
    if (browserbaseSessionId) {
      try {
        const result = await invokeBrowserAction("inject_chat_text", {
          browserbaseSessionId,
          text,
        });
        if (result?.success) {
          injected = true;
        }
      } catch (err) {
        console.warn("CDP inject failed, falling back to clipboard:", err);
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
    } catch {}

    setHistory(prev => [{
      fanMessage: fanMessage || "—",
      reply: text,
      autoSent: false,
      timestamp: new Date(),
    }, ...prev]);

    toast.success(
      injected
        ? "Reply injected into chat input"
        : "Reply copied to clipboard — paste it into the chat",
      { description: injected ? "Review and hit Send in OnlyFans" : undefined }
    );

    setTimeout(() => {
      setInjecting(null);
      setSuggestions([]);
      setFanMessage("");
    }, 1200);
  }, [browserbaseSessionId, fanMessage]);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className={cn(
          "fixed bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          autoMode
            ? "bg-green-500 text-white animate-pulse"
            : "bg-primary text-primary-foreground hover:scale-105"
        )}
        title="Open Jodie AI"
      >
        <BrainCircuit className="h-6 w-6" />
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
            {history.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-[60] transition-all duration-300 shadow-2xl rounded-2xl border bg-card overflow-hidden",
        expanded
          ? "bottom-4 right-4 w-[400px] max-h-[600px]"
          : "bottom-6 right-6 w-[340px]"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2.5 border-b rounded-t-2xl",
        autoMode ? "bg-green-500/10" : "bg-primary/5"
      )}>
        <div className="flex items-center gap-2">
          <BrainCircuit className={cn("h-4 w-4", autoMode ? "text-green-500" : "text-primary")} />
          <span className="text-sm font-bold tracking-tight">Jodie</span>
          {(detectedFanName || creatorName) && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              {detectedFanName || creatorName}
            </Badge>
          )}
          {autoMode && (
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px] px-1.5 py-0 gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              AUTO
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMinimized(true)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Auto-mode toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Zap className={cn("h-3.5 w-3.5", autoMode ? "text-green-500" : "text-muted-foreground")} />
          <Label className="text-xs cursor-pointer" htmlFor="auto-mode">
            Auto-Assist Mode
          </Label>
        </div>
        <Switch
          id="auto-mode"
          checked={autoMode}
          onCheckedChange={setAutoMode}
          className="h-4 w-8"
          disabled={!browserbaseSessionId}
        />
      </div>

      {/* Tab switcher */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("assist")}
          className={cn(
            "flex-1 text-xs py-2 font-medium transition-colors border-b-2",
            activeTab === "assist"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3 w-3 inline mr-1" />
          Assist
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 text-xs py-2 font-medium transition-colors border-b-2 relative",
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-3 w-3 inline mr-1" />
          History
          {history.length > 0 && (
            <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1 rounded-full">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        {activeTab === "assist" ? (
          <div className="space-y-3">
            {autoMode && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                <p className="text-[11px] text-green-700 dark:text-green-400 leading-tight">
                  Jodie is monitoring incoming messages every 15s. High-confidence replies (≥{confidenceThreshold}%) will be flagged for you.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {/* Read Chat button — pulls fan message from live browser */}
              {browserbaseSessionId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={readChatContext}
                  disabled={reading}
                >
                  {reading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ScanSearch className="h-3.5 w-3.5" />
                  )}
                  {reading ? "Reading chat..." : "Read Chat from Browser"}
                </Button>
              )}

              <Textarea
                placeholder="Paste the fan's message here or click Read Chat..."
                value={fanMessage}
                onChange={(e) => setFanMessage(e.target.value)}
                rows={expanded ? 3 : 2}
                className="text-sm resize-none"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={getSuggestions}
                disabled={loading || !fanMessage.trim()}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {loading ? "Thinking..." : "Get Reply Suggestions"}
              </Button>
            </div>

            {suggestions.length > 0 && (
              <ScrollArea className={expanded ? "max-h-[300px]" : "max-h-[200px]"}>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border bg-muted/40 hover:bg-muted/70 transition-colors group"
                    >
                      <p className="text-sm leading-relaxed">{s.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {s.intent}
                          </Badge>
                          <span className={cn(
                            "text-[10px] font-medium",
                            s.confidence >= 80 ? "text-green-500" :
                            s.confidence >= 50 ? "text-amber-500" : "text-destructive"
                          )}>
                            {Math.round(s.confidence)}%
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={injecting === i ? "default" : "secondary"}
                          className="h-7 text-xs gap-1"
                          onClick={() => injectReply(s.text, i)}
                          disabled={injecting !== null}
                        >
                          {injecting === i ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Injecting...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3" />
                              Use Reply
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {suggestions.length === 0 && !loading && (
              <p className="text-[11px] text-muted-foreground text-center py-3">
                {browserbaseSessionId
                  ? <>Click <strong>Read Chat</strong> to pull the fan's message, then <strong>Get Reply Suggestions</strong></>
                  : <>Paste a fan message → get AI replies → click <strong>Use Reply</strong> to inject directly into chat</>
                }
              </p>
            )}
          </div>
        ) : (
          <ScrollArea className={expanded ? "max-h-[380px]" : "max-h-[250px]"}>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No replies sent yet this session</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-lg border bg-muted/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {h.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {h.autoSent && (
                        <Badge className="bg-green-500/20 text-green-600 text-[9px] px-1 py-0">AUTO</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">Fan: "{h.fanMessage}"</p>
                    <p className="text-xs">{h.reply}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] text-muted-foreground"
                      onClick={() => {
                        setFanMessage(h.fanMessage);
                        setActiveTab("assist");
                      }}
                    >
                      <RotateCcw className="h-2.5 w-2.5 mr-1" />
                      Re-generate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}