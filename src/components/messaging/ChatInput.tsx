import { Send, Paperclip, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  showAttachment?: boolean;
  showEmoji?: boolean;
  variant?: "primary" | "accent";
  helperText?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  sending = false,
  showAttachment = false,
  showEmoji = false,
  variant = "primary",
  helperText,
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center gap-2">
        {showAttachment && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
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
          onClick={onSend}
          disabled={!value.trim() || disabled || sending}
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
