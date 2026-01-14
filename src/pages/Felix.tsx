import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FelixChat } from "@/components/ai/FelixChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Brain, BarChart3, Lightbulb, Clock, TrendingUp } from "lucide-react";

const capabilities = [
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Ask about revenue, performance metrics, and trends"
  },
  {
    icon: TrendingUp,
    title: "Comparisons",
    description: "Compare creators, chatters, or time periods"
  },
  {
    icon: Lightbulb,
    title: "Recommendations",
    description: "Get strategic advice and improvement suggestions"
  },
  {
    icon: Clock,
    title: "Forecasts",
    description: "Predict future performance based on trends"
  }
];

const exampleQueries = [
  "How did we perform this week compared to last week?",
  "Which creator has the highest conversion rate?",
  "What should I focus on to increase revenue?",
  "Show me our top 3 chatters by messages sent",
  "Any creators underperforming their potential?",
  "What's our average response time across the team?"
];

export default function Felix() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <Bot className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              FELIX
              <Brain className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-muted-foreground">
              Your AI-powered agency manager assistant
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Chat */}
          <div className="lg:col-span-2">
            <FelixChat className="h-[600px]" />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Capabilities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What FELIX Can Do</CardTitle>
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

            {/* Example Queries */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Try Asking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {exampleQueries.map((query, index) => (
                    <p 
                      key={index} 
                      className="text-sm text-muted-foreground p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      "{query}"
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
