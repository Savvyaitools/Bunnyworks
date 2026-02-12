import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

interface GoalProgressProps {
  goals: any[];
}

const priorityColors: Record<string, string> = {
  critical: 'bg-destructive/20 text-destructive',
  high: 'bg-primary/20 text-primary',
  medium: 'bg-accent/20 text-accent',
  low: 'bg-muted text-muted-foreground',
};

export function GoalProgress({ goals }: GoalProgressProps) {
  const activeGoals = goals.filter(g => g.is_active);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Agent Goals</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No goals configured yet.</p>
        ) : (
          activeGoals.map((goal) => {
            const progress = goal.target_value > 0 ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0;
            return (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{goal.metric.replace(/_/g, ' ')}</span>
                  <Badge className={`text-[10px] ${priorityColors[goal.priority] || ''}`}>{goal.priority}</Badge>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{goal.current_value}{goal.unit}</span>
                  <span>{goal.target_value}{goal.unit}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
