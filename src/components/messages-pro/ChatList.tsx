import { useMemo, useState } from "react";
import { Search, Pin, RefreshCw, Filter, X, DollarSign, Crown, Flame, Circle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import type { OfChatRow } from "@/hooks/useOfChats";

type Tab = "all" | "unread" | "subscribed" | "vip" | "expired" | "tipped" | "flagged";

type SpendChip = "any" | "0" | "1-50" | "50-500" | "500+";
type WhaleChip = "any" | "whale" | "vip" | "regular";

interface Props {
  chats: OfChatRow[];
  loading: boolean;
  activeChatId: string | null;
  onSelect: (c: OfChatRow) => void;
  onSync: () => void;
}

function fmtMoney(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function whaleTier(spend: number): WhaleChip {
  if (spend >= 500) return "whale";
  if (spend >= 50) return "vip";
  return "regular";
}

export function ChatList({ chats, loading, activeChatId, onSelect, onSync }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [spendChip, setSpendChip] = useState<SpendChip>("any");
  const [whaleChip, setWhaleChip] = useState<WhaleChip>("any");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hasPpvUnread, setHasPpvUnread] = useState(false);

  const filtered = useMemo(() => {
    let list = chats;
    if (tab === "unread") list = list.filter((c) => (c.unread_count ?? 0) > 0);
    else if (tab === "subscribed") list = list.filter((c) => c.is_subscribed);
    else if (tab === "vip") list = list.filter((c) => (c.tags ?? []).includes("vip"));
    else if (tab === "expired") list = list.filter((c) => !c.is_subscribed);
    else if (tab === "tipped") list = list.filter((c) => (c.lifetime_spend ?? 0) > 0);
    else if (tab === "flagged") list = list.filter((c) => (c.tags ?? []).includes("flagged"));

    if (spendChip !== "any") {
      list = list.filter((c) => {
        const s = Number(c.lifetime_spend ?? 0);
        if (spendChip === "0") return s === 0;
        if (spendChip === "1-50") return s > 0 && s < 50;
        if (spendChip === "50-500") return s >= 50 && s < 500;
        return s >= 500;
      });
    }
    if (whaleChip !== "any") {
      list = list.filter((c) => whaleTier(Number(c.lifetime_spend ?? 0)) === whaleChip);
    }
    if (hasPpvUnread) {
      list = list.filter((c) => (c.unread_count ?? 0) > 0 && /ppv|locked|💎/i.test(c.last_message_text ?? ""));
    }
    if (onlineOnly) {
      list = list.filter((c) => c.is_subscribed); // proxy until online presence ships
    }

    if (q) {
      const s = q.toLowerCase();
      list = list.filter(
        (c) =>
          (c.fan_name ?? "").toLowerCase().includes(s) ||
          (c.fan_username ?? "").toLowerCase().includes(s) ||
          (c.last_message_text ?? "").toLowerCase().includes(s),
      );
    }
    return list.sort((a, b) => {
      if (!!b.is_pinned !== !!a.is_pinned) return b.is_pinned ? 1 : -1;
      const ta = a.last_message_at ? +new Date(a.last_message_at) : 0;
      const tb = b.last_message_at ? +new Date(b.last_message_at) : 0;
      return tb - ta;
    });
  }, [chats, tab, q, spendChip, whaleChip, hasPpvUnread, onlineOnly]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: chats.length },
    { id: "unread", label: "Unread", count: chats.filter((c) => (c.unread_count ?? 0) > 0).length },
    { id: "subscribed", label: "Subs" },
    { id: "vip", label: "VIP" },
    { id: "expired", label: "Expired" },
    { id: "tipped", label: "Tipped" },
    { id: "flagged", label: "Flagged" },
  ];

  const activeFilterCount =
    (spendChip !== "any" ? 1 : 0) +
    (whaleChip !== "any" ? 1 : 0) +
    (hasPpvUnread ? 1 : 0) +
    (onlineOnly ? 1 : 0);

  const clearFilters = () => {
    setSpendChip("any");
    setWhaleChip("any");
    setHasPpvUnread(false);
    setOnlineOnly(false);
  };

  const totalUnread = chats.reduce((acc, c) => acc + (c.unread_count ?? 0), 0);

  return (
    <div className="w-[340px] shrink-0 flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl">
      <div className="p-3 border-b border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground tracking-tight">Inbox</h2>
            {totalUnread > 0 && (
              <Badge className="h-4 px-1.5 text-[10px] bg-primary/20 text-primary border border-primary/40">
                {totalUnread} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSync} title="Sync chats">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 relative", showFilters && "bg-primary/15 text-primary")}
              onClick={() => setShowFilters((v) => !v)}
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search fans, messages..."
            className="h-8 pl-8 text-xs bg-muted/40 border-border/50"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1 scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                tab === t.id
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="text-[10px] opacity-70">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="space-y-2 pt-1 border-t border-border/30 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Filters
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Lifetime spend
              </div>
              <div className="flex flex-wrap gap-1">
                {(["any", "0", "1-50", "50-500", "500+"] as SpendChip[]).map((c) => (
                  <FilterChip key={c} active={spendChip === c} onClick={() => setSpendChip(c)}>
                    {c === "any" ? "Any" : c === "0" ? "$0" : `$${c}`}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                <Crown className="h-3 w-3" /> Tier
              </div>
              <div className="flex flex-wrap gap-1">
                {(["any", "whale", "vip", "regular"] as WhaleChip[]).map((c) => (
                  <FilterChip key={c} active={whaleChip === c} onClick={() => setWhaleChip(c)}>
                    {c === "any" ? "Any" : c === "whale" ? "🐳 Whale" : c === "vip" ? "VIP" : "Regular"}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              <FilterChip active={hasPpvUnread} onClick={() => setHasPpvUnread((v) => !v)}>
                <Flame className="h-3 w-3" /> PPV unread
              </FilterChip>
              <FilterChip active={onlineOnly} onClick={() => setOnlineOnly((v) => !v)}>
                <Circle className="h-2 w-2 fill-success text-success" /> Online
              </FilterChip>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !loading && (
          <div className="p-8 text-center text-xs text-muted-foreground">
            {chats.length === 0
              ? "No conversations yet. Click sync to pull chats from OnlyFans."
              : "No chats match your filters."}
          </div>
        )}
        {filtered.map((c) => {
          const isActive = c.id === activeChatId;
          const unread = c.unread_count ?? 0;
          const spend = Number(c.lifetime_spend ?? 0);
          const tier = whaleTier(spend);
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={cn(
                "w-full text-left px-3 py-2.5 flex gap-3 border-b border-border/20 transition-colors group relative",
                isActive ? "bg-primary/10" : "hover:bg-muted/30",
                unread > 0 && !isActive && "bg-primary/5",
              )}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary" />}
              <div className="relative shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={c.fan_avatar ?? undefined} />
                  <AvatarFallback className="bg-muted text-xs">
                    {(c.fan_name ?? c.fan_username ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {c.is_subscribed && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    {c.is_pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                    <span className={cn("text-sm truncate", unread > 0 ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                      {c.fan_name || c.fan_username || "Anon"}
                    </span>
                    {tier === "whale" && <span className="text-[10px]" title="Whale">🐳</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {c.last_message_at
                      ? formatDistanceToNowStrict(new Date(c.last_message_at), { addSuffix: false })
                      : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className={cn("text-xs truncate", unread > 0 ? "text-foreground/80" : "text-muted-foreground")}>
                    {c.last_message_is_from_me ? "You: " : ""}
                    {c.last_message_text ?? "—"}
                  </span>
                  {unread > 0 && (
                    <Badge className="h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground shrink-0">
                      {unread}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] font-semibold",
                    spend >= 500 ? "text-warning" : spend > 0 ? "text-success" : "text-muted-foreground/60",
                  )}>
                    {fmtMoney(spend)}
                  </span>
                  {c.fan_username && (
                    <span className="text-[10px] text-muted-foreground/70 truncate">
                      @{c.fan_username}
                    </span>
                  )}
                  {(c.tags ?? []).slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors flex items-center gap-1",
        active
          ? "bg-primary/20 text-primary border-primary/40"
          : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
