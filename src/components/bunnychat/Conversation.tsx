import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lock, DollarSign, Paperclip, Smile, Send, Sparkles, Clock, ExternalLink, MoreVertical, Image as ImageIcon, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { useOfMessages, sendOfMessage } from "@/hooks/useOfMessages";
import type { OfChatRow } from "@/hooks/useOfChats";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TONES = [
  { value: "flirty", label: "Flirty" },
  { value: "playful", label: "Playful" },
  { value: "romantic", label: "Romantic" },
  { value: "dominant", label: "Dominant" },
  { value: "submissive", label: "Submissive" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "thankful", label: "Thankful" },
] as const;
const LENGTHS = [
  { value: "short", label: "Short", hint: "≤12 words" },
  { value: "medium", label: "Medium", hint: "2–3 sentences" },
  { value: "long", label: "Long", hint: "4–6 sentences" },
] as const;
type Tone = (typeof TONES)[number]["value"];
type Length = (typeof LENGTHS)[number]["value"];

interface Props {
  chat: OfChatRow | null;
  ofAccountId: string | null;
  creatorName?: string;
}

export function Conversation({ chat, ofAccountId, creatorName }: Props) {
  const { messages, loading, sync, syncError } = useOfMessages(chat?.id ?? null);
  const [body, setBody] = useState("");
  const [price, setPrice] = useState<string>("");
  const [ppvOpen, setPpvOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiSending, setAiSending] = useState(false);
  const [aiTone, setAiTone] = useState<Tone>("flirty");
  const [aiLength, setAiLength] = useState<Length>("medium");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, chat?.id]);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/40">
        <div className="text-center max-w-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Select a conversation</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a chat from the inbox to start replying with realtime sync from OnlyFans.
          </p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!chat || (!body.trim() && !ppvOpen)) return;
    setSending(true);
    try {
      await sendOfMessage({
        chatId: chat.id,
        body: body.trim(),
        price: ppvOpen ? Number(price) || 0 : 0,
      });
      setBody("");
      setPrice("");
      setPpvOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOneClickAI = async () => {
    if (!chat) return;
    const lastIn = [...messages].reverse().find((m) => m.direction === "in");
    const fanMessage = lastIn?.body?.trim();
    if (!fanMessage) {
      toast.error("No fan message to reply to");
      return;
    }
    setAiSending(true);
    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.direction === "in" ? "fan" : "creator",
        content: m.body ?? "",
      }));
      const { data, error } = await supabase.functions.invoke("ai-chatter", {
        body: {
          action: "generate_reply",
          fanMessage,
          creatorName: creatorName ?? "Creator",
          conversationHistory: history,
          confidenceThreshold: 0,
          tone: aiTone,
          length: aiLength,
        },
      });
      if (error) throw error;
      const reply = (data as any)?.reply?.trim();
      if (!reply) throw new Error("AI returned no reply");
      await sendOfMessage({ chatId: chat.id, body: reply, price: 0 });
      toast.success("AI reply sent");
    } catch (e: any) {
      toast.error(e?.message ?? "One-click send failed");
    } finally {
      setAiSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background/30 min-w-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={chat.fan_avatar ?? undefined} />
            <AvatarFallback className="bg-muted text-xs">
              {(chat.fan_name ?? chat.fan_username ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {chat.fan_name || chat.fan_username || "Anon"}
              </h3>
              {chat.is_subscribed && (
                <Badge className="h-4 px-1.5 text-[10px] bg-success/20 text-success border-success/40">
                  Subscribed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {chat.fan_username && <span>@{chat.fan_username}</span>}
              <span>•</span>
              <span className="text-success font-medium">${Number(chat.lifetime_spend ?? 0).toFixed(0)} lifetime</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => sync().catch((e) => toast.error(e?.message ?? "Message sync failed"))} title="Sync">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Open on OnlyFans">
            <a href={`https://onlyfans.com/my/chats/chat/${chat.of_chat_id}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled title="More actions — coming soon">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading && messages.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">Loading messages...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">
            {syncError ?? "No messages yet. Send the first one below."}
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDay = !prev || !isSameDay(new Date(prev.created_at), new Date(m.created_at));
          const isOut = m.direction === "out";
          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex justify-center my-3">
                  <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                    {format(new Date(m.created_at), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className={cn("flex", isOut ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    isOut
                      ? "bg-[hsl(var(--mp-accent))] text-white rounded-br-sm"
                      : "bg-card border border-border/40 text-foreground rounded-bl-sm",
                    m.status === "pending" && "opacity-70",
                    m.status === "failed" && "ring-1 ring-destructive",
                  )}
                >
                  {m.is_ppv && (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 mb-1.5 pb-1.5 border-b text-[11px] font-medium",
                        isOut ? "border-white/30" : "border-border/40 text-amber-400",
                      )}
                    >
                      <Lock className="h-3 w-3" />
                      PPV ${Number(m.price).toFixed(2)}
                      {m.is_unlocked && <span className="text-success">• Unlocked</span>}
                    </div>
                  )}
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  {Array.isArray((m.media as any)) && (m.media as any[]).length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] opacity-80">
                      <ImageIcon className="h-3 w-3" />
                      {(m.media as any[]).length} attachment{(m.media as any[]).length > 1 ? "s" : ""}
                    </div>
                  )}
                  <div
                    className={cn(
                      "text-[10px] mt-1 flex items-center gap-1",
                      isOut ? "text-white/75 justify-end" : "text-muted-foreground",
                    )}
                  >
                    {format(new Date(m.created_at), "HH:mm")}
                    {m.status === "pending" && <span>• sending</span>}
                    {m.status === "failed" && <span className="text-destructive">• failed</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-border/40 bg-card/30 backdrop-blur-xl p-3 space-y-2">
        {ppvOpen && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">PPV Lock</span>
            <DollarSign className="h-3 w-3 text-muted-foreground ml-auto" />
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-20 h-6 bg-transparent border-b border-amber-500/40 text-xs text-foreground outline-none focus:border-amber-400"
            />
            <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setPpvOpen(false)}>
              Remove
            </Button>
          </div>
        )}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKey}
          placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
          className="min-h-[60px] max-h-40 resize-none bg-muted/30 border-border/50 text-sm"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled title="Attach from Vault — coming soon">
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled title="Emoji picker — coming soon">
              <Smile className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={ppvOpen ? "default" : "ghost"}
              size="icon"
              className={cn("h-7 w-7", ppvOpen && "bg-amber-500 hover:bg-amber-600 text-black")}
              onClick={() => setPpvOpen((v) => !v)}
              title="PPV price"
            >
              <Lock className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled title="Schedule send — coming soon">
              <Clock className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="AI suggest (fill draft)"
              disabled={aiSending}
              onClick={async () => {
                const lastIn = [...messages].reverse().find((m) => m.direction === "in");
                if (!lastIn?.body) { toast.error("No fan message to reply to"); return; }
                setAiSending(true);
                try {
                  const { data, error } = await supabase.functions.invoke("ai-chatter", {
                    body: {
                      action: "generate_reply",
                      fanMessage: lastIn.body,
                      creatorName: creatorName ?? "Creator",
                      conversationHistory: messages.slice(-8).map((m) => ({ role: m.direction === "in" ? "fan" : "creator", content: m.body ?? "" })),
                      confidenceThreshold: 0,
                      tone: aiTone,
                      length: aiLength,
                    },
                  });
                  if (error) throw error;
                  const reply = (data as any)?.reply?.trim();
                  if (reply) setBody(reply);
                } catch (e: any) { toast.error(e?.message ?? "AI suggest failed"); }
                finally { setAiSending(false); }
              }}
            >
              <Sparkles className={cn("h-3.5 w-3.5 text-[hsl(var(--mp-accent))]", aiSending && "animate-pulse")} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
          <Select value={aiTone} onValueChange={(v) => setAiTone(v as Tone)}>
            <SelectTrigger className="h-7 w-[110px] text-[11px] bg-muted/30 border-border/50" title="AI tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={aiLength} onValueChange={(v) => setAiLength(v as Length)}>
            <SelectTrigger className="h-7 w-[100px] text-[11px] bg-muted/30 border-border/50" title="AI reply length">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LENGTHS.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">
                  <span className="font-medium">{l.label}</span>
                  <span className="ml-1 text-muted-foreground">{l.hint}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOneClickAI}
            disabled={aiSending || sending}
            className="h-7 gap-1.5 border-[hsl(var(--mp-accent))]/40 text-[hsl(var(--mp-accent))] hover:bg-[hsl(var(--mp-accent))]/10"
            title={`Generate ${aiTone} ${aiLength} reply and send instantly`}
          >
            <Zap className={cn("h-3.5 w-3.5", aiSending && "animate-pulse")} />
            {aiSending ? "AI sending…" : "One-click AI"}
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending || (!body.trim() && !ppvOpen)}
            className="h-7 gap-1.5 bg-[hsl(var(--mp-accent))] hover:bg-[hsl(var(--mp-accent-glow))] text-white"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
