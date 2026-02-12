import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle, SkipForward } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActionLogProps {
  actions: any[];
  feedback: any[];
  onFeedback: (actionId: string, rating: number) => void;
}

export function ActionLog({ actions, feedback, onFeedback }: ActionLogProps) {
  const feedbackMap = new Map(feedback.map(f => [f.action_id, f.rating]));

  const outcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle className="h-3.5 w-3.5 text-success" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'skipped': return <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Action Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No agent actions yet.</p>
        ) : (
          actions.map((action) => {
            const existing = feedbackMap.get(action.id);
            return (
              <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                {outcomeIcon(action.outcome)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{action.action_type}</span>
                    <Badge variant="outline" className="text-[10px]">{action.outcome}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {action.target_entity_type ? `${action.target_entity_type}` : 'System action'}
                    {' · '}
                    {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant={existing === 1 ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onFeedback(action.id, 1)}
                    disabled={existing !== undefined}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={existing === -1 ? "destructive" : "ghost"}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onFeedback(action.id, -1)}
                    disabled={existing !== undefined}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
