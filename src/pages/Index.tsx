import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { cn } from "@/lib/utils";
import bunnyWorksLogo from "@/assets/bunnyworks-logo.png";

type PanelKey = "agents" | "dashboard" | "leaderboard";

const panelOrder: PanelKey[] = ["agents", "dashboard", "leaderboard"];

const panelMeta: Record<PanelKey, { label: string; eyebrow: string; icon: typeof BarChart3 }> = {
  agents: { label: "AI Agents", eyebrow: "Automation", icon: Bot },
  dashboard: { label: "Dashboard", eyebrow: "Live Ops", icon: BarChart3 },
  leaderboard: { label: "Leaderboard", eyebrow: "Creators", icon: Trophy },
};

const formatMoney = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;

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
      if (ids.length === 0) return { net: 0, agency: 0 };

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

  const activeIndex = panelOrder.indexOf(activePanel);
  const activeCreators = stats?.activeCreators ?? 0;
  const activeEmployees = stats?.activeEmployees ?? 0;
  const netRevenue = revenue?.net ?? stats?.totalNetRevenue ?? 0;
  const agencyRevenue = revenue?.agency ?? netRevenue * 0.5;

  const metrics = useMemo(
    () => [
      { label: "Net Revenue", value: formatMoney(netRevenue), icon: DollarSign, trend: "+12.4%" },
      { label: "Agency Cut", value: formatMoney(agencyRevenue), icon: Activity, trend: "+8.1%" },
      { label: "Active Creators", value: String(activeCreators), icon: Users, trend: "Live" },
      { label: "Team Members", value: String(activeEmployees), icon: ShieldCheck, trend: "Online" },
    ],
    [activeCreators, activeEmployees, agencyRevenue, netRevenue],
  );

  const focusPanel = (panel: PanelKey) => setActivePanel(panel);
  const cyclePanel = (direction: "prev" | "next") => {
    const offset = direction === "next" ? 1 : -1;
    setActivePanel(panelOrder[(activeIndex + offset + panelOrder.length) % panelOrder.length]);
  };

  return (
    <DashboardLayout>
      <section className="relative -m-5 min-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden bg-background lg:-m-8 xl:-mx-10">
        <div className="absolute inset-0 bg-[url('/ops-room/background.jpg')] bg-cover bg-center opacity-60" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/20 to-background" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" aria-hidden="true" />

        <div className="relative z-10 flex min-h-[calc(100dvh-2rem)] flex-col px-5 py-5 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={bunnyWorksLogo} alt="BunnyWorksOS" className="h-11 w-11 object-contain animate-neon-glow" />
              <div>
                <p className="ops-label">Command Center</p>
                <h1 className="ops-heading text-xl font-bold text-foreground sm:text-2xl">BunnyWorksOS</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 backdrop-blur-xl sm:flex">
              <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_16px_hsl(var(--success)/0.75)]" />
              <span className="ops-label text-foreground/80">Live Sync</span>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="relative min-h-[600px] overflow-hidden rounded-2xl border border-border bg-card/30 p-4 shadow-glow backdrop-blur-md sm:p-6">
              <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(hsl(var(--primary)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.08)_1px,transparent_1px)] [background-size:48px_48px]" aria-hidden="true" />
              <div className="absolute left-1/2 top-[48%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-primary/10 blur-3xl" aria-hidden="true" />

              <div className="relative h-[560px] min-h-[560px] perspective-[1600px]">
                {panelOrder.map((panel, index) => {
                  const distance = (index - activeIndex + panelOrder.length) % panelOrder.length;
                  const visualSlot = distance === 0 ? "center" : distance === 1 ? "right" : "left";
                  return (
                    <OpsPanel
                      key={panel}
                      panel={panel}
                      visualSlot={visualSlot}
                      metrics={metrics}
                      activeCreators={activeCreators}
                      activeEmployees={activeEmployees}
                      onFocus={() => focusPanel(panel)}
                    />
                  );
                })}
              </div>
            </div>

            <aside className="grid gap-3 xl:content-center">
              {metrics.map((metric) => (
                <div key={metric.label} className="ops-panel p-4">
                  <div className="flex items-center justify-between gap-3">
                    <metric.icon className="h-5 w-5 text-primary" />
                    <span className="ops-pill">{metric.trend}</span>
                  </div>
                  <p className="ops-label mt-4">{metric.label}</p>
                  <p className="ops-numeric mt-1 text-2xl font-bold text-foreground">{metric.value}</p>
                </div>
              ))}
            </aside>
          </div>

          <CarouselNav activePanel={activePanel} onFocus={focusPanel} onCycle={cyclePanel} />
        </div>
      </section>
    </DashboardLayout>
  );
}

interface OpsPanelProps {
  panel: PanelKey;
  visualSlot: "left" | "center" | "right";
  metrics: Array<{ label: string; value: string; icon: typeof DollarSign; trend: string }>;
  activeCreators: number;
  activeEmployees: number;
  onFocus: () => void;
}

function OpsPanel({ panel, visualSlot, metrics, activeCreators, activeEmployees, onFocus }: OpsPanelProps) {
  const meta = panelMeta[panel];
  const Icon = meta.icon;
  const isCenter = visualSlot === "center";

  return (
    <button
      type="button"
      onClick={onFocus}
      aria-label={`Show ${meta.label}`}
      className={cn(
        "absolute left-1/2 top-1/2 block w-[min(78%,680px)] -translate-x-1/2 -translate-y-1/2 text-left transition-all duration-500 ease-out preserve-3d focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        visualSlot === "center" && "z-30 scale-100 opacity-100",
        visualSlot === "left" && "z-20 -translate-x-[92%] scale-[0.78] opacity-70 blur-[0.3px]",
        visualSlot === "right" && "z-20 -translate-x-[8%] scale-[0.78] opacity-70 blur-[0.3px]",
      )}
      style={{
        transform:
          visualSlot === "center"
            ? "translate3d(-50%, -50%, 120px) rotateY(0deg)"
            : visualSlot === "left"
              ? "translate3d(-105%, -50%, -160px) rotateY(24deg)"
              : "translate3d(5%, -50%, -160px) rotateY(-24deg)",
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5 shadow-lg backdrop-blur-2xl sm:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" aria-hidden="true" />
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="ops-label">{meta.eyebrow}</p>
            <h2 className="ops-heading mt-1 text-2xl font-bold text-foreground sm:text-3xl">{meta.label}</h2>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-primary shadow-glow-sm">
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="relative mt-6">{panel === "dashboard" ? <DashboardPanel metrics={metrics} /> : panel === "agents" ? <AgentsPanel /> : <LeaderboardPanel activeCreators={activeCreators} activeEmployees={activeEmployees} />}</div>

        {!isCenter && <div className="absolute inset-0 rounded-2xl bg-background/20" aria-hidden="true" />}
      </div>
    </button>
  );
}

function DashboardPanel({ metrics }: { metrics: OpsPanelProps["metrics"] }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-secondary/60 p-4">
            <metric.icon className="h-4 w-4 text-primary" />
            <p className="ops-label mt-3">{metric.label}</p>
            <p className="ops-numeric mt-1 text-xl font-bold text-foreground">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-secondary/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="ops-label">Revenue Pulse</p>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex h-28 items-end gap-2">
          {[42, 58, 51, 72, 64, 86, 78, 92, 84, 100].map((height, index) => (
            <div key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-primary/90 animate-pulse" style={{ height: `${height}%`, animationDelay: `${index * 80}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentsPanel() {
  const agents = [
    { name: "Felix", task: "Query triage", status: "Active" },
    { name: "Tatum", task: "Content research", status: "Reviewing" },
    { name: "Izzy", task: "Message assist", status: "Queued" },
  ];

  return (
    <div className="space-y-3">
      {agents.map((agent, index) => (
        <div key={agent.name} className="flex items-center gap-4 rounded-xl border border-border bg-secondary/60 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{agent.name}</p>
            <p className="text-sm text-muted-foreground">{agent.task}</p>
          </div>
          <span className="ops-pill">{agent.status}</span>
          <div className="h-12 w-1 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: `${index * 120}ms` }} />
        </div>
      ))}
    </div>
  );
}

function LeaderboardPanel({ activeCreators, activeEmployees }: { activeCreators: number; activeEmployees: number }) {
  const creators = [
    { name: "Addison Weems", value: "$9,420", score: 94 },
    { name: "Mia Stone", value: "$7,180", score: 82 },
    { name: "Luna Vale", value: "$6,540", score: 74 },
  ];

  return (
    <div className="space-y-4">
      {creators.map((creator, index) => (
        <div key={creator.name} className="rounded-xl border border-border bg-secondary/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-foreground">#{index + 1} {creator.name}</p>
              <p className="ops-label mt-1">Monthly revenue</p>
            </div>
            <p className="ops-numeric text-lg font-bold text-primary">{creator.value}</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${creator.score}%` }} />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/50 p-3">
          <p className="ops-label">Creators</p>
          <p className="ops-numeric text-xl text-foreground">{activeCreators}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/50 p-3">
          <p className="ops-label">Staff</p>
          <p className="ops-numeric text-xl text-foreground">{activeEmployees}</p>
        </div>
      </div>
    </div>
  );
}

function CarouselNav({ activePanel, onFocus, onCycle }: { activePanel: PanelKey; onFocus: (panel: PanelKey) => void; onCycle: (direction: "prev" | "next") => void }) {
  return (
    <nav className="flex items-center justify-center gap-2 pb-2" aria-label="Dashboard panels">
      <button
        type="button"
        aria-label="Previous panel"
        onClick={() => onCycle("prev")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur-xl transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 backdrop-blur-xl">
        {panelOrder.map((panel) => (
          <button
            key={panel}
            type="button"
            onClick={() => onFocus(panel)}
            aria-pressed={activePanel === panel}
            className={cn(
              "rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-ring sm:px-4",
              activePanel === panel ? "bg-primary text-primary-foreground shadow-glow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {panelMeta[panel].label}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Next panel"
        onClick={() => onCycle("next")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur-xl transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
