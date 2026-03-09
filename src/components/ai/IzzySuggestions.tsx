import { Sparkles, Loader2, Check, Zap, MessageCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Suggestion {
  text: string;
  intent: string;
  confidence: number;
}

interface IzzySuggestionsProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  onSelect: (suggestion: Suggestion, index: number) => void;
  onRefresh?: () => void;
  className?: string;
}

const intentIcons: Record<string, React.ReactNode> = {
  engage: <MessageCircle className="h-3 w-3" />,
  tease: <Sparkles className="h-3 w-3" />,
  upsell: <DollarSign className="h-3 w-3" />,
  retain: <Check className="h-3 w-3" />,
};

const intentColors: Record<string, string> = {
  engage: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tease: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  upsell: 'bg-green-500/20 text-green-400 border-green-500/30',
  retain: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function IzzySuggestions({ 
  suggestions, 
  isLoading, 
  onSelect, 
  onRefresh,
  className 
}: IzzySuggestionsProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border", className)}>
        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-sm text-muted-foreground">MARYLIN is thinking...</span>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2 p-3 bg-muted/30 rounded-lg border border-border", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-primary">
            <Sparkles className="h-4 w-4" />
            <Zap className="h-3 w-3" />
          </div>
          <span className="text-sm font-medium">MARYLIN Suggestions</span>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} className="h-7 px-2 text-xs">
            Refresh
          </Button>
        )}
      </div>
      
      <div className="grid gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion, index)}
            className="group text-left p-3 rounded-md bg-background/50 hover:bg-background border border-transparent hover:border-primary/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm leading-relaxed flex-1">{suggestion.text}</p>
              <Badge 
                variant="outline" 
                className={cn(
                  "shrink-0 text-xs",
                  intentColors[suggestion.intent] || 'bg-muted text-muted-foreground'
                )}
              >
                <span className="mr-1">{intentIcons[suggestion.intent]}</span>
                {suggestion.intent}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${suggestion.confidence}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{suggestion.confidence}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
