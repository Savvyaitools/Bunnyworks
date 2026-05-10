import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { OfAccount } from "@/hooks/useOfAccounts";

interface Props {
  accounts: OfAccount[];
  activeId: string | null;
  onSelect: (a: OfAccount) => void;
  unreadByAccount: Record<string, number>;
}

export function CreatorRail({ accounts, activeId, onSelect, unreadByAccount }: Props) {
  return (
    <div className="w-16 shrink-0 flex flex-col items-center gap-3 py-4 border-r border-border/40 bg-card/30 backdrop-blur-xl">
      <TooltipProvider delayDuration={150}>
        {accounts.map((a) => {
          const isActive = activeId === a.of_account_id;
          const unread = unreadByAccount[a.of_account_id] || 0;
          return (
            <Tooltip key={a.of_account_id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelect(a)}
                  className={cn(
                    "relative group transition-all",
                    isActive ? "scale-110" : "hover:scale-105 opacity-70 hover:opacity-100",
                  )}
                >
                  <span
                    className={cn(
                      "absolute -left-3 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all",
                      isActive ? "h-8 bg-primary shadow-[0_0_12px_hsl(var(--primary))]" : "h-0",
                    )}
                  />
                  <Avatar className={cn("h-10 w-10 ring-2 transition-colors", isActive ? "ring-primary" : "ring-transparent")}>
                    <AvatarImage src={a.creator_avatar ?? undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {(a.creator_name ?? a.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                      a.status === "active" ? "bg-success" : "bg-muted-foreground",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="text-xs">
                  <div className="font-semibold">{a.creator_name}</div>
                  <div className="text-muted-foreground">@{a.username}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {accounts.length === 0 && (
          <div className="text-[10px] text-muted-foreground text-center px-1">No OF accounts</div>
        )}
      </TooltipProvider>
    </div>
  );
}
