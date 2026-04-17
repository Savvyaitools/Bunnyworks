import { Send, Paperclip, Smile, X, Loader2, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { MessageAttachment } from "@/hooks/useMessages";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachment?: MessageAttachment | null) => void | Promise<void>;
  onUploadFile?: (file: File) => Promise<MessageAttachment | null>;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  showAttachment?: boolean;
  showEmoji?: boolean;
  variant?: "primary" | "accent";
  helperText?: string;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function ChatInput({
  value,
  onChange,
  onSend,
  onUploadFile,
  placeholder = "Type a message...",
  disabled = false,
  sending = false,
  showAttachment = false,
  showEmoji = false,
  variant = "primary",
  helperText,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<MessageAttachment | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!onUploadFile) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large (max 25MB)");
      return;
    }
    setUploading(true);
    const att = await onUploadFile(file);
    setUploading(false);
    if (att) setPending(att);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!value.trim() && !pending) return;
    await onSend(pending);
    setPending(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (!!value.trim() || !!pending) && !disabled && !sending && !uploading;

  return (
    <div className="p-4 border-t border-border">
      {pending && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">{pending.name}</span>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        {showAttachment && onUploadFile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Attach file"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
            </Button>
          </>
        )}
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyPress}
          className="bg-muted/50 border-border focus:border-primary"
          disabled={disabled || sending}
        />
        {showEmoji && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <Smile className="h-5 w-5" />
          </Button>
        )}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          className={variant === "accent"
            ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow-sm shrink-0"
            : "bg-gradient-primary hover:opacity-90 shadow-glow-sm shrink-0"
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      {helperText && (
        <p className="text-xs text-muted-foreground mt-2">{helperText}</p>
      )}
    </div>
  );
}
