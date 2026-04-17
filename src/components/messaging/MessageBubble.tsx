import { Check, CheckCheck, Trash2, FileText, Download, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMessageTimestamp } from "@/lib/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  showSenderName?: boolean;
  read?: boolean;
  showReadReceipt?: boolean;
  variant?: "primary" | "accent";
  onDelete?: () => void;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
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
  onDelete,
  attachmentUrl,
  attachmentName,
  attachmentType,
}: MessageBubbleProps) {
  const isImage = !!attachmentType?.startsWith("image/");
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
    <div className={cn("group flex items-center gap-2", isOwn ? "justify-end" : "justify-start")}>
      {isOwn && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label="Delete message"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this message?</AlertDialogTitle>
              <AlertDialogDescription>
                This message will be permanently removed for everyone in the conversation. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <div className={bubbleClasses}>
        {showSenderName && senderName && !isOwn && (
          <p className="text-xs font-medium mb-1 opacity-70">{senderName}</p>
        )}
        {content && <p className="text-sm whitespace-pre-wrap">{content}</p>}
        {attachmentUrl && (
          isImage ? (
            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
              <img
                src={attachmentUrl}
                alt={attachmentName || "attachment"}
                className="rounded-md max-h-64 object-cover border border-border/50"
              />
            </a>
          ) : (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mt-2 flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition-colors",
                isOwn
                  ? "border-primary-foreground/30 bg-primary-foreground/10 hover:bg-primary-foreground/20"
                  : "border-border bg-background/50 hover:bg-background"
              )}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{attachmentName || "Attachment"}</span>
              <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
            </a>
          )
        )}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <p className={timestampClasses}>{formatMessageTimestamp(timestamp)}</p>
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
