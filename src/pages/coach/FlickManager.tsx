import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AgentChatPanel } from "@/components/ai/AgentChatPanel";
import { UserCog, ClipboardCheck, CalendarCheck, BarChart3, MessageSquare } from "lucide-react";

const quickActions = [
  { label: "Daily Check-In", icon: ClipboardCheck, query: "Run a daily creator check-in. Which creators haven't uploaded content today and who is falling behind on their weekly quotas?" },
  { label: "Content Pipeline", icon: CalendarCheck, query: "Review the content pipeline for all creators. Who has less than 3 days of scheduled content remaining?" },
  { label: "Performance Scores", icon: BarChart3, query: "Generate creator performance scores based on content consistency, fan engagement, and revenue efficiency." },
  { label: "Message Creators", icon: MessageSquare, query: "Send a motivational check-in message to all active creators encouraging them to stay on track with their content goals this week." },
];

export default function FlickManager() {
  return (
    <DashboardLayout>
      <PageHeader title="Flick" subtitle="AI Creator Manager — onboarding, productivity, content pipeline & creator messaging" />
      <div className="mt-6">
        <AgentChatPanel
          agentContext="flick_manager"
          agentName="Flick"
          agentIcon={UserCog}
          agentDescription="Your AI Creator Manager. I handle onboarding, daily check-ins, content pipeline tracking, performance scoring, creator coaching, and direct creator messaging. Ask me anything about your creators."
          agentBadge="Manager"
          colorClass="bg-gradient-to-br from-amber-500 to-amber-600"
          quickActions={quickActions}
          placeholder="Ask Flick about creator management, message creators, content pipelines..."
          loadingText="Reviewing creator data..."
        />
      </div>
    </DashboardLayout>
  );
}
