import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Bot, ChevronLeft, ChevronRight, Crown, DollarSign, LayoutDashboard, MessageSquare, Sparkles, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type PanelKey = "agents" | "dashboard" | "leaderboard";
type VisualSlot = "left" | "center" | "right";

const panelOrder: PanelKey[] = ["agents", "dashboard", "leaderboard"];

const panelLabels: Record<PanelKey, string> = {
  agents: "AI Agents",
  dashboard: "Dashboard",
  leaderboard: "Leaderboard",
};

function currency(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export default function Index() {
  const [activePanel, setActivePanel] = useState<PanelKey>("dashboard");
  const { data: stats } = useDashboardStats();
  const { agency } = useAgency();

  const { data: revenue } = useQuery({
    queryKey: ["ops-room-revenue", agency?.id],
    enabled: Boolean(agency?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agency!.id);

      const ids = (creators ?? []).map((creator: { id: string }) => creator.id);
      if (!ids.length) return { net: 0, agency: 0 };

      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount")
        .in("creator_id", ids)
        .gte("period_start", start.toISOString().slice(0, 10));

      const net = (earnings ?? []).reduce(
        (sum: number, row: { amount: number | string | null }) => sum + Number(row.amount ?? 0),
        0,
      );

      return { net, agency: net * 0.5 };
    },
  });

  const visualSlots = useMemo(() => {
    const activeIndex = panelOrder.indexOf(activePanel);
    return panelOrder.reduce<Record<PanelKey, VisualSlot>>((acc, panel, index) => {
      const relative = (index - activeIndex + panelOrder.length) % panelOrder.length;
      acc[panel] = relative === 0 ? "center" : relative === 1 ? "right" : "left";
      return acc;
    }, {} as Record<PanelKey, VisualSlot>);
  }, [activePanel]);

  const cycle = (direction: "prev" | "next") => {
    const index = panelOrder.indexOf(activePanel);
    const nextIndex = direction === "next" ? index + 1 : index - 1;
    setActivePanel(panelOrder[(nextIndex + panelOrder.length) % panelOrder.length]);
  };

  return (
    <DashboardLayout>
      <section
        className="relative -m-5 min-h-[calc(100dvh-2rem)] overflow-hidden bg-background lg:-m-8 xl:-mx-10"
        style={{
          backgroundImage: `linear-gradient(180deg, hsl(var(--background) / 0.1), hsl(var(--background) / 0.38)), url('/ops-room/background.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_44%)]" />
        <div className="pointer-events-none absolute right-7 top-6 z-30 flex items-center gap-2 font-display text-xs uppercase tracking-[0.24em] text-success">
          <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_hsl(var(--success))]" />
          Live
        </div>

        <div className="relative h-[calc(100dvh-2rem)] min-h-[720px] [perspective:1800px]">
          <OpsPanel panel="agents" slot={visualSlots.agents} active={activePanel === "agents"} onFocus={setActivePanel}>
            <AgentsPanel />
          </OpsPanel>
          <OpsPanel panel="dashboard" slot={visualSlots.dashboard} active={activePanel === "dashboard"} onFocus={setActivePanel}>
            <DashboardPanel revenue={revenue} activeCreators={stats?.activeCreators ?? 0} activeEmployees={stats?.activeEmployees ?? 0} />
          </OpsPanel>
          <OpsPanel panel="leaderboard" slot={visualSlots.leaderboard} active={activePanel === "leaderboard"} onFocus={setActivePanel}>
            <LeaderboardPanel />
          </OpsPanel>
        </div>

        <CarouselNav activePanel={activePanel} onSelect={setActivePanel} onCycle={cycle} />
      </section>
    </DashboardLayout>
  );
}

function OpsPanel({ panel, slot, active, onFocus, children }: { panel: PanelKey; slot: VisualSlot; active: boolean; onFocus: (panel: PanelKey) => void; children: ReactNode }) {
  const slotClass = {
    center: "left-1/2 top-1/2 z-30 w-[min(48vw,820px)] opacity-100",
    left: "left-[1.5%] top-[53%] z-20 w-[min(37vw,690px)] opacity-90",
    right: "right-[1.5%] top-[53%] z-20 w-[min(37vw,690px)] opacity-90",
  }[slot];

  const transformBySlot: Record<VisualSlot, CSSProperties["transform"]> = {
    center: "translate3d(-50%, -50%, 0) rotateY(0deg) scale(1)",
    left: "translate3d(0, -50%, 0) rotateY(23deg) scale(0.95)",
    right: "translate3d(0, -50%, 0) rotateY(-23deg) scale(0.95)",
  };

  return (
    <button
      type="button"
      onClick={() => onFocus(panel)}
      aria-label={`Focus ${panelLabels[panel]}`}
      className={cn(
        "absolute aspect-[1.55/1] origin-center text-left transition-all duration-500 [transform-style:preserve-3d] hover:drop-shadow-[0_0_28px_hsl(var(--primary)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        slotClass,
        active && "drop-shadow-[0_0_30px_hsl(var(--primary)/0.32)]",
      )}
      style={{ transform: transformBySlot[slot] }}
    >
      <div className="h-full overflow-hidden rounded-md border border-primary/55 bg-card/90 shadow-2xl backdrop-blur-xl">
        <div className="flex h-11 items-center justify-between border-b border-primary/35 bg-primary/10 px-4">
          <span className="font-display text-sm font-bold uppercase tracking-[0.22em] text-foreground">{panelLabels[panel]}</span>
          <ChevronRight className="h-4 w-4 text-primary" />
        </div>
        {children}
      </div>
    </button>
  );
}

function DashboardPanel({ revenue, activeCreators, activeEmployees }: { revenue?: { net: number; agency: number }; activeCreators: number; activeEmployees: number }) {
  const kpis = [
    { label: "Net Revenue", value: currency(revenue?.net ?? 0), icon: DollarSign, tint: "text-success" },
    { label: "Agency Earnings", value: currency(revenue?.agency ?? 0), icon: TrendingUp, tint: "text-primary" },
    { label: "Active Creators", value: String(activeCreators), icon: Sparkles, tint: "text-accent" },
    { label: "Team Members", value: String(activeEmployees), icon: Users, tint: "text-warning" },
  ];

  return (
    <div className="flex h-[calc(100%-2.75rem)] flex-col gap-3 p-3">
      <div className="grid grid-cols-4 gap-2">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-md border border-border bg-background/55 p-3">
            <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="truncate">{kpi.label}</span>
              <kpi.icon className={cn("h-3.5 w-3.5", kpi.tint)} />
            </div>
            <div className="mt-2 font-mono text-xl font-bold text-foreground">{kpi.value}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 rounded-md border border-border bg-background/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-foreground">Monthly Performance</h2>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Net earnings</span>
        </div>
        <div className="grid h-[72%] grid-cols-4 items-end gap-7 border-b border-border/80 px-8 pb-7">
          {[64, 72, 58, 67].map((height, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="h-2 w-full rounded-sm bg-primary shadow-[0_0_16px_hsl(var(--primary)/0.6)]" style={{ height: `${height}%` }} />
              <div className="h-2 w-full rounded-sm bg-success shadow-[0_0_16px_hsl(var(--success)/0.45)]" style={{ height: `${Math.max(22, height - 24)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 px-8 text-center font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {['Jan', 'Feb', 'Mar', 'Apr'].map((month) => <span key={month}>{month}</span>)}
        </div>
      </div>
    </div>
  );
}

function AgentsPanel() {
  const agents = [
    { name: "Flick", role: "Agency Manager", sessions: 229, icon: Bot },
    { name: "Coach PBF", role: "Performance coach", sessions: 43, icon: Crown },
    { name: "Tatum Social", role: "Trend scout", sessions: 18, icon: Sparkles },
    { name: "Marulin Chatter", role: "Messaging assistant", sessions: 31, icon: MessageSquare },
  ];

  return (
    <div className="space-y-3 p-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">AI Agents</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your AI assistant suite</p>
      </div>
      {agents.map((agent) => (
        <div key={agent.name} className="flex items-center gap-3 rounded-md border border-border bg-background/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary">
            <agent.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-base font-bold text-foreground">{agent.name}</span>
              <span className="rounded-full border border-primary/25 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-primary">{agent.role}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{agent.sessions} sessions completed</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardPanel() {
  const creators = [
    { name: "Addison Weems", cut: 5873, pct: 96 },
    { name: "Mia Scarlett", cut: 3768, pct: 72 },
    { name: "Lina Brett", cut: 2736, pct: 58 },
    { name: "Nora Reed", cut: 1304, pct: 34 },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <span>Creator</span>
        <span>Agency cut</span>
      </div>
      {creators.map((creator, index) => (
        <div key={creator.name} className="space-y-2 rounded-md border border-border bg-background/45 p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-foreground">{index + 1}. {creator.name}</p>
              <p className="text-xs text-muted-foreground">Top {index === 0 ? "0.5" : index + 2}% · 50% rate</p>
            </div>
            <p className="font-mono text-xl font-bold text-success">{currency(creator.cut)}</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success shadow-[0_0_12px_hsl(var(--success)/0.55)]" style={{ width: `${creator.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CarouselNav({ activePanel, onSelect, onCycle }: { activePanel: PanelKey; onSelect: (panel: PanelKey) => void; onCycle: (direction: "prev" | "next") => void }) {
  return (
    <div className="absolute bottom-6 left-0 right-0 z-40 flex items-center justify-center gap-2">
      <button type="button" aria-label="Previous panel" onClick={() => onCycle("prev")} className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-card/85 text-foreground backdrop-blur transition hover:bg-primary/20">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-1 rounded-full border border-primary/25 bg-card/80 p-1 backdrop-blur">
        {panelOrder.map((panel) => (
          <button key={panel} type="button" onClick={() => onSelect(panel)} className={cn("rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition", activePanel === panel ? "bg-primary/25 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {panelLabels[panel]}
          </button>
        ))}
      </div>
      <button type="button" aria-label="Next panel" onClick={() => onCycle("next")} className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-card/85 text-foreground backdrop-blur transition hover:bg-primary/20">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}