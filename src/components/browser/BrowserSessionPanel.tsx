import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface BrowserSessionPanelProps {
  creatorName: string;
  platform: string;
  collapsed: boolean;
  onToggle: () => void;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

// Platform URL mappings for quick actions
const PLATFORM_URLS: Record<string, Record<string, string>> = {
  onlyfans: {
    "Open Chats": "https://onlyfans.com/my/chats",
    "View Fans List": "https://onlyfans.com/my/subscribers/active",
    "Check Earnings": "https://onlyfans.com/my/banking",
    "Create Post": "https://onlyfans.com/posts/create",
    "Send Mass DM": "https://onlyfans.com/my/chats/send",
    "Vault Media": "https://onlyfans.com/my/vault",
  },
  fansly: {
    "Open Chats": "https://fansly.com/messages",
    "View Fans List": "https://fansly.com/manage/subscribers",
    "Check Earnings": "https://fansly.com/manage/earnings",
    "Create Post": "https://fansly.com/post/create",
    "Send Mass DM": "https://fansly.com/messages/mass",
    "Vault Media": "https://fansly.com/manage/vault",
  },
};

export function BrowserSessionPanel({
  creatorName,
  platform,
  collapsed,
  onToggle,
  iframeRef,
}: BrowserSessionPanelProps) {
  const platformKey = platform.toLowerCase();
  const urls = PLATFORM_URLS[platformKey] || PLATFORM_URLS.onlyfans;

  const navigateIframe = useCallback((url: string) => {
    if (iframeRef?.current) {
      try {
        iframeRef.current.src = url;
      } catch {
        // Cross-origin — use postMessage fallback or just open in iframe
        window.open(url, "_blank");
      }
    }
  }, [iframeRef]);

  if (collapsed) {
    return (
      <div className="w-10 bg-card border-l flex flex-col items-center py-3 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-2 items-center">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <Users className="h-4 w-4 text-muted-foreground" />
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const actions = [
    { label: "Open Chats", description: "Go to messages inbox" },
    { label: "View Fans List", description: "See active subscribers" },
    { label: "Check Earnings", description: "Today's revenue breakdown" },
    { label: "Create Post", description: "Draft a new post" },
    { label: "Send Mass DM", description: "Bulk message fans" },
    { label: "Vault Media", description: "View content vault" },
  ];

  return (
    <div className="w-80 bg-card border-l flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div>
          <h3 className="font-semibold text-sm">{creatorName}</h3>
          <span className="text-xs text-muted-foreground capitalize">{platform}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 p-3 border-b">
        <QuickStat icon={DollarSign} label="Today" value="$0" color="text-green-400" />
        <QuickStat icon={MessageSquare} label="Messages" value="0" color="text-blue-400" />
        <QuickStat icon={Users} label="Fans Online" value="—" color="text-purple-400" />
        <QuickStat icon={TrendingUp} label="Subs" value="—" color="text-amber-400" />
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="quick-actions" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 h-8">
          <TabsTrigger value="quick-actions" className="text-xs h-7">
            <Zap className="h-3 w-3 mr-1" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="tips" className="text-xs h-7">
            <BarChart3 className="h-3 w-3 mr-1" />
            Tips
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs h-7">
            <Clock className="h-3 w-3 mr-1" />
            Activity
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="quick-actions" className="p-3 space-y-2 mt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Quick actions for this session
            </p>
            {actions.map((action) => (
              <ActionButton
                key={action.label}
                label={action.label}
                description={action.description}
                onClick={() => navigateIframe(urls[action.label] || "#")}
              />
            ))}
          </TabsContent>

          <TabsContent value="tips" className="p-3 space-y-3 mt-0">
            <TipCard
              title="Boost Reply Rate"
              description="Reply within 5 minutes to keep fans engaged. Use personalized openers."
            />
            <TipCard
              title="PPV Pricing"
              description="Start at $5-15 for solo content. Bundle 3+ items for higher conversions."
            />
            <TipCard
              title="Peak Hours"
              description="Most fans are active 8PM-12AM EST. Schedule posts and DMs accordingly."
            />
            <TipCard
              title="Upsell Strategy"
              description="After a fan purchases, follow up with related content within 24 hours."
            />
          </TabsContent>

          <TabsContent value="activity" className="p-3 space-y-2 mt-0">
            <p className="text-xs text-muted-foreground mb-2">Session activity log</p>
            <ActivityItem time="Now" event="Session started" />
            <p className="text-xs text-muted-foreground text-center py-4">
              Activity will appear here as you work
            </p>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-2.5 rounded-md border bg-muted/30 hover:bg-muted/60 transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="block text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-3 rounded-md border bg-primary/5 border-primary/20">
      <p className="text-sm font-medium text-primary">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function ActivityItem({ time, event }: { time: string; event: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-12 shrink-0">{time}</span>
      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
      <span>{event}</span>
    </div>
  );
}
