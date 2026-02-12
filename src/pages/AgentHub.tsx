import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AgentStatusCard } from "@/components/agents/AgentStatusCard";
import { AlertsFeed } from "@/components/agents/AlertsFeed";
import { ActionLog } from "@/components/agents/ActionLog";
import { GoalProgress } from "@/components/agents/GoalProgress";
import { DailyBriefingCard } from "@/components/agents/DailyBriefingCard";
import { useAgentRuns } from "@/hooks/useAgentRuns";
import { useAgentAlerts } from "@/hooks/useAgentAlerts";
import { useAgentGoals } from "@/hooks/useAgentGoals";
import { Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isToday } from "date-fns";

export default function AgentHub() {
  const { runs, actions, isLoading } = useAgentRuns();
  const { alerts, dismissAlert } = useAgentAlerts();
  const { goals, feedback, submitFeedback } = useAgentGoals();
  const [triggering, setTriggering] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const getLastRun = (type: string) => runs.find(r => r.agent_type === type);
  const getTodayActions = (type: string) => {
    return actions.filter(a => {
      const run = runs.find(r => r.id === a.run_id);
      return run?.agent_type === type && isToday(new Date(a.created_at));
    }).length;
  };

  const triggerAgent = async (agentType: string) => {
    setTriggering(agentType);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent-orchestrator?agent=${agentType}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('Failed to trigger agent');
      toast.success(`${agentType} agent triggered successfully`);
      // Refresh data after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
        queryClient.invalidateQueries({ queryKey: ['agent-actions'] });
        queryClient.invalidateQueries({ queryKey: ['agent-alerts'] });
      }, 3000);
    } catch (err) {
      toast.error('Failed to trigger agent');
    } finally {
      setTriggering(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Agent Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Autonomous AI agents monitoring and optimizing your agency
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerAgent('sentinel')}
              disabled={triggering !== null}
            >
              <Zap className="h-4 w-4 mr-1" />
              {triggering === 'sentinel' ? 'Running...' : 'Run Sentinel'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => triggerAgent('herald')}
              disabled={triggering !== null}
            >
              <Zap className="h-4 w-4 mr-1" />
              {triggering === 'herald' ? 'Running...' : 'Run Herald'}
            </Button>
          </div>
        </div>

        {/* Agent Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AgentStatusCard agentType="sentinel" lastRun={getLastRun('sentinel')} actionsToday={getTodayActions('sentinel')} />
          <AgentStatusCard agentType="herald" lastRun={getLastRun('herald')} actionsToday={getTodayActions('herald')} />
          <AgentStatusCard agentType="scholar" lastRun={getLastRun('scholar')} actionsToday={getTodayActions('scholar')} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <DailyBriefingCard />
            <AlertsFeed alerts={alerts} onDismiss={(id) => dismissAlert.mutate(id)} />
          </div>
          <div className="space-y-6">
            <GoalProgress goals={goals} />
            <ActionLog
              actions={actions}
              feedback={feedback}
              onFeedback={(actionId, rating) => submitFeedback.mutate({ actionId, rating })}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
