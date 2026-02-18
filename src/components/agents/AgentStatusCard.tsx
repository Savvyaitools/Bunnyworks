import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Shield, Newspaper, GraduationCap, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AgentStatusCardProps {
  agentType: 'sentinel' | 'herald' | 'scholar';
  lastRun?: any;
  actionsToday: number;
}

const agentConfig = {
  sentinel: { name: 'Sentinel', description: 'Performance Monitor', icon: Shield, schedule: 'Every 4 hours', color: 'text-destructive' },
  herald: { name: 'Herald', description: 'Daily Briefing', icon: Newspaper, schedule: 'Daily at 7 AM', color: 'text-accent' },
  scholar: { name: 'Scholar', description: 'JODIE Learning Loop', icon: GraduationCap, schedule: 'Nightly', color: 'text-primary' },
};

export function AgentStatusCard({ agentType, lastRun, actionsToday }: AgentStatusCardProps) {
  const config = agentConfig[agentType];
  const Icon = config.icon;

  const statusIcon = lastRun?.status === 'completed' ? <CheckCircle className="h-4 w-4 text-success" /> :
                     lastRun?.status === 'failed' ? <XCircle className="h-4 w-4 text-destructive" /> :
                     lastRun?.status === 'running' ? <Clock className="h-4 w-4 text-accent animate-spin" /> :
                     <Clock className="h-4 w-4 text-muted-foreground" />;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted/50 ${config.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{config.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">{config.schedule}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last run</span>
          <span className="flex items-center gap-1.5">
            {statusIcon}
            {lastRun ? formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true }) : 'Never'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Actions today</span>
          <span className="font-medium">{actionsToday}</span>
        </div>
        {lastRun?.duration_ms && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration</span>
            <span>{(lastRun.duration_ms / 1000).toFixed(1)}s</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
