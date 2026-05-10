import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Ban, ShieldOff, Star, RefreshCw, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { OfChatRow } from "@/hooks/useOfChats";

interface Props {
  chat: OfChatRow | null;
}

function whaleScore(spend: number) {
  if (spend >= 5000) return 5;
  if (spend >= 1000) return 4;
  if (spend >= 250) return 3;
  if (spend >= 50) return 2;
  if (spend > 0) return 1;
  return 0;
}

const whaleColors = ["bg-muted", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-orange-500", "bg-fuchsia-500"];

export function FanSidebar({ chat }: Props) {
  if (!chat) {
    return (
      <div className="w-[300px] shrink-0 border-l border-border/40 bg-card/30 backdrop-blur-xl p-4 hidden xl:block">
        <div className="text-xs text-muted-foreground text-center mt-8">
          Select a chat to see fan profile
        </div>
      </div>
    );
  }

  const spend = Number(chat.lifetime_spend ?? 0);
  const score = whaleScore(spend);

  return (
    <div className="w-[300px] shrink-0 border-l border-border/40 bg-card/30 backdrop-blur-xl flex flex-col hidden xl:flex">
      <div className="p-4 border-b border-border/40 text-center">
        <Avatar className="h-16 w-16 mx-auto mb-2 ring-2 ring-primary/30">
          <AvatarImage src={chat.fan_avatar ?? undefined} />
          <AvatarFallback className="bg-muted">
            {(chat.fan_name ?? chat.fan_username ?? "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-sm font-semibold text-foreground">{chat.fan_name || chat.fan_username || "Anon"}</h3>
        {chat.fan_username && <p className="text-[11px] text-muted-foreground">@{chat.fan_username}</p>}
        <div className="mt-3 flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={cn("h-1.5 w-6 rounded-full", i <= score ? whaleColors[score] : "bg-muted/40")}
            />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
          Whale score · {score}/5
        </p>
      </div>

      <div className="p-4 grid grid-cols-2 gap-2 border-b border-border/40">
        <Stat label="Lifetime" value={`$${spend.toFixed(0)}`} highlight />
        <Stat
          label="Status"
          value={chat.is_subscribed ? "Active" : "Expired"}
          tone={chat.is_subscribed ? "success" : "muted"}
        />
        <Stat
          label="Renews"
          value={chat.subscribed_until ? format(new Date(chat.subscribed_until), "MMM d") : "—"}
        />
        <Stat label="Unread" value={String(chat.unread_count ?? 0)} />
      </div>

      <div className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</h4>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Tag className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {(chat.tags ?? []).length === 0 && (
            <span className="text-[11px] text-muted-foreground">No tags yet</span>
          )}
          {(chat.tags ?? []).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] h-5">
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-border/40 space-y-1.5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick actions</h4>
        <FanAction icon={Star} label="Mark as VIP" />
        <FanAction icon={Crown} label="Add to Top Fans" />
        <FanAction icon={RefreshCw} label="Refresh from OF" />
        <FanAction icon={ShieldOff} label="Restrict" tone="warn" />
        <FanAction icon={Ban} label="Block" tone="danger" />
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Internal notes</h4>
        <textarea
          placeholder="Add a private note about this fan..."
          className="w-full min-h-[80px] text-xs bg-muted/30 border border-border/40 rounded-lg p-2 resize-none outline-none focus:border-primary/40"
        />
      </div>
    </div>
  );
}

function Stat({ label, value, highlight, tone }: { label: string; value: string; highlight?: boolean; tone?: "success" | "muted" }) {
  return (
    <div className="rounded-lg bg-muted/20 border border-border/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-sm font-semibold mt-0.5",
          highlight && "text-success",
          tone === "success" && "text-success",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function FanAction({ icon: Icon, label, tone }: { icon: any; label: string; tone?: "warn" | "danger" }) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/40 transition-colors text-left",
        tone === "warn" && "text-amber-400",
        tone === "danger" && "text-destructive",
        !tone && "text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
