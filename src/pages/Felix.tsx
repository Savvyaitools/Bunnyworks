import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FelixChat } from "@/components/ai/FelixChat";
import { Bot, Brain, Zap, Share2, MessagesSquare } from "lucide-react";
import { AgentStatusCard } from "@/components/agents/AgentStatusCard";
import { AlertsFeed } from "@/components/agents/AlertsFeed";
import { ActionLog } from "@/components/agents/ActionLog";
import { GoalProgress } from "@/components/agents/GoalProgress";
import { DailyBriefingCard } from "@/components/agents/DailyBriefingCard";
import { useAgentRuns } from "@/hooks/useAgentRuns";
import { useAgentAlerts } from "@/hooks/useAgentAlerts";
import { useAgentGoals } from "@/hooks/useAgentGoals";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { isToday } from "date-fns";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "chat", label: "Chat", icon: Bot },
  { id: "tatum", label: "Tatum · Social", icon: Share2 },
  { id: "izzy", label: "Izzy · Chatter", icon: MessagesSquare },
  { id: "agents", label: "Agents", icon: Zap },
];

export default function Felix() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Coach PBF</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered agency orchestrator & tools
              </p>
            </div>
          </div>
          {activeTab === "agents" && (
            <div className="flex gap-2">
              {['sentinel', 'herald'].map((agent) => (
                <Button
                  key={agent}
                  variant="outline"
                  size="sm"
                  onClick={() => triggerAgent(agent)}
                  disabled={triggering !== null}
                  className="capitalize"
                >
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  {triggering === agent ? 'Running…' : `Run ${agent}`}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "tatum") navigate("/coach/social-media");
                else if (tab.id === "izzy") navigate("/coach/ai-chatter");
                else setActiveTab(tab.id);
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chat Tab — full width */}
        {activeTab === "chat" && (
          <FelixChat className="h-[calc(100vh-220px)]" />
        )}

        {/* Agents Tab — clean dashboard grid */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            {/* Agent Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AgentStatusCard agentType="sentinel" lastRun={getLastRun('sentinel')} actionsToday={getTodayActions('sentinel')} />
              <AgentStatusCard agentType="herald" lastRun={getLastRun('herald')} actionsToday={getTodayActions('herald')} />
              <AgentStatusCard agentType="scholar" lastRun={getLastRun('scholar')} actionsToday={getTodayActions('scholar')} />
            </div>

            {/* Briefing + Goals row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DailyBriefingCard />
              <GoalProgress goals={goals} />
            </div>

            {/* Alerts + Action Log row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertsFeed alerts={alerts} onDismiss={(id) => dismissAlert.mutate(id)} />
              <ActionLog
                actions={actions}
                feedback={feedback}
                onFeedback={(actionId, rating) => submitFeedback.mutate({ actionId, rating })}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
