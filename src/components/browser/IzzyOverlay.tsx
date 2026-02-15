import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, X, Sparkles, Loader2, Copy, Check, 
  ChevronDown, ChevronUp, Zap 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Suggestion {
  text: string;
  intent: string;
  confidence: number;
}

interface IzzyOverlayProps {
  creatorId: string;
  creatorName?: string;
}

export function IzzyOverlay({ creatorId, creatorName }: IzzyOverlayProps) {
  const [expanded, setExpanded] = useState(false);
  const [fanMessage, setFanMessage] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [minimized, setMinimized] = useState(false);

  const getSuggestions = useCallback(async () => {
    if (!fanMessage.trim()) {
      toast.error("Paste the fan's message first");
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
      if (msg.includes("Rate limit")) {
        toast.error("Too many requests — wait a moment");
      } else if (msg.includes("credits")) {
        toast.error("AI credits exhausted");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [fanMessage, creatorId]);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied! Paste into the chat");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-[60] h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        title="Open Izzy AI"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-[60] transition-all duration-200 shadow-2xl rounded-xl border bg-card",
        expanded
          ? "bottom-4 right-4 w-[360px] max-h-[520px]"
          : "bottom-6 right-6 w-[300px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-primary/5 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Izzy AI</span>
          {creatorName && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {creatorName}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setMinimized(true)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-3">
        <div className="space-y-2">
          <Textarea
            placeholder="Paste the fan's message here..."
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
              <Zap className="h-3.5 w-3.5 mr-1.5" />
            )}
            {loading ? "Thinking..." : "Get Reply Suggestions"}
          </Button>
        </div>

        {suggestions.length > 0 && (
          <ScrollArea className={expanded ? "max-h-[280px]" : "max-h-[180px]"}>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border bg-muted/40 hover:bg-muted/70 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm flex-1">{s.text}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-60 group-hover:opacity-100"
                      onClick={() => copyToClipboard(s.text, i)}
                    >
                      {copiedIdx === i ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {s.intent}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(s.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {suggestions.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Paste a fan message and click to get AI reply suggestions. Copy &amp; paste into the chat.
          </p>
        )}
      </div>
    </div>
  );
}
