import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
  id: string;
  name: string;
  avatarSeed?: string;
  avatarUrl?: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "creator" | "employee" | "default";
  unreadCount?: number;
  isOnline?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  name,
  avatarSeed,
  avatarUrl,
  subtitle,
  badge,
  badgeVariant = "default",
  unreadCount = 0,
  isOnline,
  isSelected = false,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg flex items-start gap-3 transition-colors text-left",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/50"
      )}
    >
      <UserAvatar
        name={name}
        avatarSeed={avatarSeed}
        avatarUrl={avatarUrl}
        className="h-12 w-12"
        showOnlineStatus={isOnline !== undefined}
        isOnline={isOnline}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-foreground truncate">{name}</span>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground h-5 min-w-5 px-1.5">
              {unreadCount}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
        {badge && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs mt-1",
              badgeVariant === "creator" && "border-primary/30 text-primary",
              badgeVariant === "employee" && "border-accent/30 text-accent",
              badgeVariant === "default" && "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {badge}
          </Badge>
        )}
      </div>
    </button>
  );
}
