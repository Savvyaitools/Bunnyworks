import { useMemo, useState } from "react";
import { Search, Pin, RefreshCw, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import type { OfChatRow } from "@/hooks/useOfChats";

type Tab = "all" | "unread" | "subscribed" | "vip" | "tipped";

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

export function ChatList({ chats, loading, activeChatId, onSelect, onSync }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = chats;
    if (tab === "unread") list = list.filter((c) => (c.unread_count ?? 0) > 0);
    else if (tab === "subscribed") list = list.filter((c) => c.is_subscribed);
    else if (tab === "vip") list = list.filter((c) => (c.tags ?? []).includes("vip"));
    else if (tab === "tipped") list = list.filter((c) => (c.lifetime_spend ?? 0) > 0);
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
  }, [chats, tab, q]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "all", label: "All", count: chats.length },
    { id: "unread", label: "Unread", count: chats.filter((c) => (c.unread_count ?? 0) > 0).length },
    { id: "subscribed", label: "Subs" },
    { id: "vip", label: "VIP" },
    { id: "tipped", label: "Tipped" },
  ];

  return (
    <div className="w-[340px] shrink-0 flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl">
      <div className="p-3 border-b border-border/40 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground tracking-tight">Inbox</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSync} title="Sync chats">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Filters">
              <Filter className="h-3.5 w-3.5" />
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && !loading && (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No conversations yet. Click sync to pull chats from OnlyFans.
          </div>
        )}
        {filtered.map((c) => {
          const isActive = c.id === activeChatId;
          const unread = c.unread_count ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={cn(
                "w-full text-left px-3 py-2.5 flex gap-3 border-b border-border/20 transition-colors group",
                isActive ? "bg-primary/10" : "hover:bg-muted/30",
              )}
            >
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
                    <span className="text-sm font-medium text-foreground truncate">
                      {c.fan_name || c.fan_username || "Anon"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {c.last_message_at
                      ? formatDistanceToNowStrict(new Date(c.last_message_at), { addSuffix: false })
                      : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
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
                  <span className="text-[10px] font-semibold text-success">
                    {fmtMoney(c.lifetime_spend)}
                  </span>
                  {c.fan_username && (
                    <span className="text-[10px] text-muted-foreground/70 truncate">
                      @{c.fan_username}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
