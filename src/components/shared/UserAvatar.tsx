import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarUrl, getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarSeed?: string | null;
  avatarUrl?: string | null;
  className?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({
  name,
  avatarSeed,
  avatarUrl,
  className,
  showOnlineStatus = false,
  isOnline = false,
}: UserAvatarProps) {
  const imgSrc = avatarUrl || getAvatarUrl(avatarSeed || null, name);

  return (
    <div className="relative">
      <Avatar className={cn("h-10 w-10", className)}>
        <AvatarImage src={imgSrc} className="object-cover" />
        <AvatarFallback className="bg-primary/20 text-primary">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showOnlineStatus && isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-card" />
      )}
    </div>
  );
}
