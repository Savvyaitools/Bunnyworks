import { useState } from "react";
import { Check, ChevronDown, Bell, Sparkles, Zap, DollarSign, MessageSquare, Inbox, Search, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { OfAccount } from "@/hooks/useOfAccounts";
import type { OfChatRow } from "@/hooks/useOfChats";

interface Props {
  accounts: OfAccount[];
  activeAccount: OfAccount | null;
  onSelectAccount: (a: OfAccount) => void;
  chats: OfChatRow[];
  speedMode: boolean;
  onSpeedModeChange: (v: boolean) => void;
  aiAssist: boolean;
  onAiAssistChange: (v: boolean) => void;
  onOpenMassMessage?: () => void;
}

function fmtMoney(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function BunnyChatTopBar({
  accounts, activeAccount, onSelectAccount, chats, speedMode, onSpeedModeChange, aiAssist, onAiAssistChange, onOpenMassMessage,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const totalUnread = chats.reduce((a, c) => a + (c.unread_count ?? 0), 0);
  const totalSpend = chats.reduce((a, c) => a + Number(c.lifetime_spend ?? 0), 0);
  const subscribed = chats.filter((c) => c.is_subscribed).length;

  const filteredAccounts = accounts.filter((a) =>
    !q || (a.creator_name ?? "").toLowerCase().includes(q.toLowerCase()) || (a.username ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="h-14 shrink-0 border-b border-border/40 bg-card/40 backdrop-blur-xl px-3 flex items-center gap-3">
      {/* Creator switcher */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/60 border border-border/50 transition-colors min-w-0">
            {activeAccount ? (
              <>
                <Avatar className="h-7 w-7 ring-1 ring-[hsl(var(--mp-accent))]/40">
                  <AvatarImage src={activeAccount.creator_avatar ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-[hsl(var(--mp-accent))]/20 text-[hsl(var(--mp-accent))]">
                    {(activeAccount.creator_name ?? activeAccount.username).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <div className="text-xs font-semibold text-foreground truncate max-w-[140px]">
                    {activeAccount.creator_name || activeAccount.username}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                    @{activeAccount.username} · {activeAccount.status}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground px-1">Select creator</span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <div className="p-2 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search creators..."
                className="w-full h-8 pl-7 pr-2 rounded-md bg-muted/40 text-xs outline-none border border-border/40 focus:border-[hsl(var(--mp-accent))]/50"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {filteredAccounts.map((a) => {
              const active = activeAccount?.of_account_id === a.of_account_id;
              return (
                <button
                  key={a.of_account_id}
                  onClick={() => { onSelectAccount(a); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                    active ? "bg-[hsl(var(--mp-accent))]/15" : "hover:bg-muted/40",
                  )}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={a.creator_avatar ?? undefined} />
                    <AvatarFallback className="text-[10px] bg-muted">
                      {(a.creator_name ?? a.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground truncate">{a.creator_name || a.username}</div>
                    <div className="text-[10px] text-muted-foreground truncate">@{a.username}</div>
                  </div>
                  <span className={cn("h-2 w-2 rounded-full", a.status === "active" ? "bg-success" : "bg-muted-foreground")} />
                  {active && <Check className="h-3.5 w-3.5 text-[hsl(var(--mp-accent))]" />}
                </button>
              );
            })}
            {filteredAccounts.length === 0 && (
              <div className="text-center text-[11px] text-muted-foreground py-6">No creators found</div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <div className="h-7 w-px bg-border/40" />

      {/* Global metric chips */}
      <div className="flex items-center gap-1.5">
        <MetricChip icon={Inbox} label="Unread" value={String(totalUnread)} accent={totalUnread > 0} />
        <MetricChip icon={MessageSquare} label="Active subs" value={String(subscribed)} />
        <MetricChip icon={DollarSign} label="Lifetime" value={fmtMoney(totalSpend)} tone="success" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenMassMessage}
          disabled={!activeAccount}
          className="h-8 gap-1.5 border-[hsl(var(--mp-accent))]/40 bg-[hsl(var(--mp-accent))]/10 text-[hsl(var(--mp-accent))] hover:bg-[hsl(var(--mp-accent))]/20 hover:text-[hsl(var(--mp-accent))]"
        >
          <Megaphone className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">Mass Message</span>
        </Button>
        <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/40 cursor-pointer hover:bg-muted/50 transition-colors">
          <Sparkles className={cn("h-3.5 w-3.5", aiAssist ? "text-[hsl(var(--mp-accent))]" : "text-muted-foreground")} />
          <span className="text-[11px] font-medium text-foreground">AI Assist</span>
          <Switch checked={aiAssist} onCheckedChange={onAiAssistChange} className="scale-75" />
        </label>
        <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/40 cursor-pointer hover:bg-muted/50 transition-colors">
          <Zap className={cn("h-3.5 w-3.5", speedMode ? "text-amber-400" : "text-muted-foreground")} />
          <span className="text-[11px] font-medium text-foreground">Speed mode</span>
          <Switch checked={speedMode} onCheckedChange={onSpeedModeChange} className="scale-75" />
        </label>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[hsl(var(--mp-accent))]" />
          )}
        </Button>
      </div>
    </div>
  );
}

function MetricChip({
  icon: Icon, label, value, accent, tone,
}: { icon: any; label: string; value: string; accent?: boolean; tone?: "success" }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-md border",
      accent
        ? "bg-[hsl(var(--mp-accent))]/15 border-[hsl(var(--mp-accent))]/40"
        : "bg-muted/30 border-border/40",
    )}>
      <Icon className={cn(
        "h-3 w-3",
        accent ? "text-[hsl(var(--mp-accent))]" : tone === "success" ? "text-success" : "text-muted-foreground",
      )} />
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={cn(
        "text-xs font-semibold",
        accent ? "text-[hsl(var(--mp-accent))]" : tone === "success" ? "text-success" : "text-foreground",
      )}>{value}</span>
    </div>
  );
}
