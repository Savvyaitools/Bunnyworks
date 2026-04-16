import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AgentChatPanel } from "@/components/ai/AgentChatPanel";
import { UserCog, ClipboardCheck, CalendarCheck, BarChart3, MessageSquare, Plus } from "lucide-react";

const quickActions = [
  { label: "Daily Check-In", icon: ClipboardCheck, query: "Run a daily creator check-in. Which creators haven't uploaded content today and who is falling behind on their weekly quotas?" },
  { label: "Content Pipeline", icon: CalendarCheck, query: "Review the platform content pipeline for all creators. Who has less than 3 days of scheduled OnlyFans/Fansly content remaining?" },
  { label: "Add Platform Plan", icon: Plus, query: "Create a 7-day OnlyFans content plan for my top creator with a mix of PPV, photos, videos, and a livestream." },
  { label: "Message Creators", icon: MessageSquare, query: "Send a motivational check-in message to all active creators encouraging them to stay on track with their content goals this week." },
];

export default function FlickManager() {
  return (
    <DashboardLayout>
      <PageHeader title="Flick" subtitle="AI Creator Manager — platform content plans, creator messaging & accountability" />
      <div className="mt-6">
        <AgentChatPanel
          agentContext="flick_manager"
          agentName="Flick"
          agentIcon={UserCog}
          agentDescription="Your AI Creator Manager. I create OnlyFans & Fansly content plans, handle daily check-ins, message creators directly, and track content pipeline performance."
          agentBadge="Manager"
          colorClass="bg-gradient-to-br from-amber-500 to-amber-600"
          quickActions={quickActions}
          placeholder="Ask Flick to create platform content plans, message creators..."
          loadingText="Reviewing creator data..."
        />
      </div>
    </DashboardLayout>
  );
}
