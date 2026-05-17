import { useMemo, useState } from "react";
import { Megaphone, Loader2, DollarSign, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { OfChatRow } from "@/hooks/useOfChats";

type AudienceType = "all_active" | "subscribed" | "min_spend";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ofAccountId: string | null;
  chats: OfChatRow[];
  accountLabel?: string;
}

export function MassMessageComposer({ open, onOpenChange, ofAccountId, chats, accountLabel }: Props) {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<AudienceType>("all_active");
  const [minSpend, setMinSpend] = useState<number>(50);
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [price, setPrice] = useState<number>(10);
  const [lockMessage, setLockMessage] = useState(true);
  const [sending, setSending] = useState(false);

  const estimated = useMemo(() => {
    if (audience === "all_active") return chats.length;
    if (audience === "subscribed") return chats.filter((c) => c.is_subscribed).length;
    return chats.filter((c) => Number(c.lifetime_spend ?? 0) >= minSpend).length;
  }, [chats, audience, minSpend]);

  const textRemaining = 4000 - text.length;
  const canSend = !!ofAccountId && text.trim().length > 0 && estimated > 0 && !sending;

  async function handleSend() {
    if (!ofAccountId) return;
    if (estimated > 100) {
      const ok = window.confirm(
        `Send to ${estimated} fans? This will run at ~1 send/sec to stay under OnlyFans rate limits (~${Math.ceil(estimated * 1.5)}s).`,
      );
      if (!ok) return;
    }

    setSending(true);
    const audiencePayload =
      audience === "min_spend"
        ? { type: "min_spend" as const, min_spend: minSpend }
        : { type: audience };

    try {
      const { data, error } = await supabase.functions.invoke("of-mass-message", {
        body: {
          of_account_id: ofAccountId,
          text: text.trim(),
          price: ppvEnabled ? price : 0,
          lock_message: ppvEnabled ? lockMessage : false,
          audience: audiencePayload,
        },
      });
      if (error) throw error;
      const { total, sent, failed } = data ?? {};
      if (failed > 0) {
        toast.warning(`Mass message complete: ${sent}/${total} sent · ${failed} failed`);
      } else {
        toast.success(`Mass message sent to ${sent}/${total} fans`);
      }
      onOpenChange(false);
      setText("");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to send mass message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-[hsl(var(--mp-accent,20_90%_58%))]" />
            Mass Message {accountLabel ? <span className="text-muted-foreground text-sm">· @{accountLabel}</span> : null}
          </DialogTitle>
          <DialogDescription>
            Send a DM or PPV blast to a filtered slice of this creator's fans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Audience */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Audience</Label>
            <RadioGroup
              value={audience}
              onValueChange={(v) => setAudience(v as AudienceType)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2"
            >
              <AudienceOption value="all_active" label="All active chats" />
              <AudienceOption value="subscribed" label="Subscribed only" />
              <AudienceOption value="min_spend" label="Lifetime spend ≥" />
            </RadioGroup>
            {audience === "min_spend" && (
              <div className="flex items-center gap-2 pl-1 pt-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  value={minSpend}
                  onChange={(e) => setMinSpend(Math.max(0, Number(e.target.value) || 0))}
                  className="h-8 w-28 bg-muted/50"
                />
                <span className="text-xs text-muted-foreground">USD lifetime</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="gap-1.5">
                <Users className="h-3 w-3" />
                {estimated} recipient{estimated === 1 ? "" : "s"}
              </Badge>
              {estimated === 0 && (
                <span className="text-[11px] text-destructive">No chats match — adjust the filter.</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message</Label>
              <span className={`text-[10px] ${textRemaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {textRemaining} chars left
              </span>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hey baby 💋 just dropped something special for my biggest fans..."
              rows={5}
              className="bg-muted/40 border-border focus:border-[hsl(var(--mp-accent,20_90%_58%))]"
              maxLength={4000}
            />
          </div>

          {/* PPV */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-[hsl(var(--mp-accent,20_90%_58%))]" />
                <span className="text-sm font-medium">Send as PPV (paid unlock)</span>
              </div>
              <Switch checked={ppvEnabled} onCheckedChange={setPpvEnabled} />
            </div>
            {ppvEnabled && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price (USD)</Label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={price}
                      onChange={(e) => setPrice(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                      className="h-8 bg-background/60"
                    />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Lock preview</Label>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                      Hide message text until unlocked
                    </p>
                  </div>
                  <Switch checked={lockMessage} onCheckedChange={setLockMessage} />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="bg-[hsl(var(--mp-accent,20_90%_58%))] hover:bg-[hsl(var(--mp-accent,20_90%_58%))]/90 text-white"
          >
            {sending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Sending {estimated}...
              </>
            ) : (
              <>
                <Megaphone className="h-3.5 w-3.5 mr-1.5" />
                Send to {estimated}
                {ppvEnabled ? ` · $${price} PPV` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AudienceOption({ value, label }: { value: string; label: string }) {
  return (
    <label
      htmlFor={`aud-${value}`}
      className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors has-[:checked]:border-[hsl(var(--mp-accent,20_90%_58%))] has-[:checked]:bg-[hsl(var(--mp-accent,20_90%_58%))]/10"
    >
      <RadioGroupItem id={`aud-${value}`} value={value} />
      <span className="text-xs font-medium">{label}</span>
    </label>
  );
}