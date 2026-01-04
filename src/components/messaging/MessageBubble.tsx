import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/formatters";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  showSenderName?: boolean;
  read?: boolean;
  showReadReceipt?: boolean;
  variant?: "primary" | "accent";
}

export function MessageBubble({
  content,
  timestamp,
  isOwn,
  senderName,
  showSenderName = false,
  read = false,
  showReadReceipt = true,
  variant = "primary",
}: MessageBubbleProps) {
  const bubbleClasses = cn(
    "message-bubble max-w-[70%]",
    isOwn
      ? variant === "accent"
        ? "bg-accent text-accent-foreground rounded-br-md"
        : "message-bubble-sent"
      : "message-bubble-received"
  );

  const timestampClasses = cn(
    "text-xs",
    isOwn
      ? variant === "accent"
        ? "text-accent-foreground/70"
        : "text-primary-foreground/70"
      : "text-muted-foreground"
  );

  const checkClasses = cn(
    "h-3.5 w-3.5",
    variant === "accent"
      ? read ? "text-accent-foreground/90" : "text-accent-foreground/50"
      : read ? "text-primary-foreground/90" : "text-primary-foreground/50"
  );

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={bubbleClasses}>
        {showSenderName && senderName && !isOwn && (
          <p className="text-xs font-medium mb-1 opacity-70">{senderName}</p>
        )}
        <p className="text-sm">{content}</p>
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <p className={timestampClasses}>{formatTime(timestamp)}</p>
          {isOwn && showReadReceipt && (
            read ? (
              <CheckCheck className={checkClasses} />
            ) : (
              <Check className={checkClasses} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
