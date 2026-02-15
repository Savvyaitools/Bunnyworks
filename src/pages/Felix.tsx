import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FelixChat } from "@/components/ai/FelixChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Brain, BarChart3, Lightbulb, Clock, TrendingUp, Zap, Share2, MessagesSquare } from "lucide-react";
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

const capabilities = [
  { icon: BarChart3, title: "Analytics", description: "Ask about revenue, performance metrics, and trends" },
  { icon: TrendingUp, title: "Comparisons", description: "Compare creators, chatters, or time periods" },
  { icon: Lightbulb, title: "Recommendations", description: "Get strategic advice and improvement suggestions" },
  { icon: Clock, title: "Forecasts", description: "Predict future performance based on trends" },
];

const exampleQueries = [
  "How did we perform this week compared to last week?",
  "Which creator has the highest conversion rate?",
  "What should I focus on to increase revenue?",
  "Show me our top 3 chatters by messages sent",
  "Any creators underperforming their potential?",
  "What's our average response time across the team?",
];

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
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Bot className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Coach PBF
              <Brain className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-muted-foreground">
              Your AI-powered agency orchestrator & tools
            </p>
            </div>
          </div>
          {activeTab === "agents" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => triggerAgent('sentinel')} disabled={triggering !== null}>
                <Zap className="h-4 w-4 mr-1" />
                {triggering === 'sentinel' ? 'Running...' : 'Run Sentinel'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => triggerAgent('herald')} disabled={triggering !== null}>
                <Zap className="h-4 w-4 mr-1" />
                {triggering === 'herald' ? 'Running...' : 'Run Herald'}
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "tatum") navigate("/coach/social-media");
                else if (tab.id === "izzy") navigate("/coach/ai-chatter");
                else setActiveTab(tab.id);
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors relative",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FelixChat className="h-[600px]" />
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What I Can Do</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {capabilities.map((cap) => (
                    <div key={cap.title} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <cap.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{cap.title}</p>
                        <p className="text-xs text-muted-foreground">{cap.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Try Asking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exampleQueries.map((query, index) => (
                      <p key={index} className="text-sm text-muted-foreground p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                        "{query}"
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            {/* Agent Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AgentStatusCard agentType="sentinel" lastRun={getLastRun('sentinel')} actionsToday={getTodayActions('sentinel')} />
              <AgentStatusCard agentType="herald" lastRun={getLastRun('herald')} actionsToday={getTodayActions('herald')} />
              <AgentStatusCard agentType="scholar" lastRun={getLastRun('scholar')} actionsToday={getTodayActions('scholar')} />
            </div>

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
        )}
      </div>
    </DashboardLayout>
  );
}