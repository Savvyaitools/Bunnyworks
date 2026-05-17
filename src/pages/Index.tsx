import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AlertCircle, Bot, ChevronLeft, ChevronRight, Crown, DollarSign, Flame, Maximize2, MessageSquare, Sparkles, TrendingUp, Trophy, Users, X, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type PanelKey = "dashboard" | "revenue" | "creators" | "chatters" | "agents" | "tasks";
type VisualSlot = "left" | "center" | "right" | "far-left" | "far-right" | "back";

const panelOrder: PanelKey[] = ["agents", "creators", "dashboard", "chatters", "revenue", "tasks"];

const panelLabels: Record<PanelKey, string> = {
  dashboard: "Dashboard",
  revenue: "Revenue · 6mo",
  creators: "Top Creators",
  chatters: "Chatter Board",
  agents: "AI Agents",
  tasks: "Priority Tasks",
};

function currency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Index() {
  const [activePanel, setActivePanel] = useState<PanelKey>("dashboard");
  const [expandedPanel, setExpandedPanel] = useState<PanelKey | null>(null);
  const { data: stats } = useDashboardStats();
  const { agency } = useAgency();
  const agencyId = agency?.id;
  const isMobile = useIsMobile();

  // Revenue: last 6 months + MTD breakdown + top creators
  const { data: revenueData } = useQuery({
    queryKey: ["ops-revenue", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 5);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const { data: creators } = await supabase
        .from("creators")
        .select("id, name")
        .eq("agency_id", agencyId!);
      const creatorMap = new Map((creators ?? []).map((c: any) => [c.id, c.name]));
      const ids = Array.from(creatorMap.keys());
      if (!ids.length) return { months: [], topCreators: [], mtdNet: 0, mtdAgency: 0, tips: 0, subs: 0, msgs: 0 };

      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount, period_start, creator_id, tips, subscriptions, messages_revenue")
        .in("creator_id", ids)
        .gte("period_start", since.toISOString().slice(0, 10));

      const buckets = new Map<string, number>();
      const creatorTotalsMTD = new Map<string, number>();
      const mtdStart = new Date();
      mtdStart.setDate(1);
      const mtdIso = mtdStart.toISOString().slice(0, 10);
      let mtdNet = 0, tips = 0, subs = 0, msgs = 0;

      for (const row of earnings ?? []) {
        const amt = Number(row.amount ?? 0);
        const key = monthKey(new Date(row.period_start));
        buckets.set(key, (buckets.get(key) ?? 0) + amt);
        if (row.period_start >= mtdIso) {
          mtdNet += amt;
          tips += Number(row.tips ?? 0);
          subs += Number(row.subscriptions ?? 0);
          msgs += Number(row.messages_revenue ?? 0);
          creatorTotalsMTD.set(row.creator_id, (creatorTotalsMTD.get(row.creator_id) ?? 0) + amt);
        }
      }

      const months: { label: string; value: number }[] = [];
      const cursor = new Date(since);
      for (let i = 0; i < 6; i++) {
        const key = monthKey(cursor);
        months.push({ label: cursor.toLocaleString("en-US", { month: "short" }), value: buckets.get(key) ?? 0 });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const topCreators = Array.from(creatorTotalsMTD.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, total]) => ({ id, name: creatorMap.get(id) ?? "Unknown", total }));

      return { months, topCreators, mtdNet, mtdAgency: mtdNet * 0.5, tips, subs, msgs };
    },
  });

  // Chatter board
  const { data: chatterBoard } = useQuery({
    queryKey: ["chatter-board", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const [logsRes, employeesRes] = await Promise.all([
        supabase
          .from("chatter_message_log")
          .select("id, was_auto_reply", { count: "exact" })
          .eq("agency_id", agencyId!)
          .gte("created_at", since.toISOString()),
        supabase
          .from("employees")
          .select("id, name, skill_grade, daily_target_messages")
          .eq("agency_id", agencyId!)
          .eq("status", "Active")
          .or("department.ilike.%chat%,role.ilike.%chat%"),
      ]);

      const totalMsgs = logsRes.count ?? 0;
      const autoReplies = (logsRes.data ?? []).filter((r: any) => r.was_auto_reply).length;
      const list = employeesRes.data ?? [];
      const distributed = list.length ? Math.round(totalMsgs / list.length) : 0;

      const chatters = list.map((e: any) => {
        const target = Number(e.daily_target_messages ?? 0) || 100;
        return {
          id: e.id,
          name: e.name,
          grade: e.skill_grade ?? "B",
          messages: distributed,
          target,
          pct: Math.min(100, Math.round((distributed / target) * 100)),
        };
      }).sort((a: any, b: any) => b.pct - a.pct).slice(0, 6);

      return { chatters, totalMsgs, autoReplies };
    },
  });

  // Tasks
  const { data: taskData } = useQuery({
    queryKey: ["dashboard-tasks", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const { data, count } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date", { count: "exact" })
        .neq("status", "Done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(6);
      const today = new Date().toISOString().slice(0, 10);
      const overdue = (data ?? []).filter((t: any) => t.due_date && t.due_date < today).length;
      return { tasks: data ?? [], total: count ?? 0, overdue };
    },
  });

  // AI agents (7d activity)
  const { data: agentActivity } = useQuery({
    queryKey: ["agent-activity", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const iso = since.toISOString();
      const [flick, coach, tatum, izzy, chatLog] = await Promise.all([
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).gte("created_at", iso),
        supabase.from("coach_pbf_messages").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).gte("created_at", iso),
        supabase.from("tatum_messages").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).gte("created_at", iso),
        supabase.from("izzy_messages").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).gte("created_at", iso),
        supabase.from("chatter_message_log").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!).gte("created_at", iso),
      ]);
      return [
        { name: "Flick", role: "Agency Manager", icon: Bot, count: flick.count ?? 0 },
        { name: "Coach PBF", role: "Performance", icon: Crown, count: coach.count ?? 0 },
        { name: "Tatum", role: "Trend scout", icon: Sparkles, count: tatum.count ?? 0 },
        { name: "Izzy", role: "Suggester", icon: Zap, count: izzy.count ?? 0 },
        { name: "Marylin", role: "Chatter AI", icon: MessageSquare, count: chatLog.count ?? 0 },
      ].sort((a, b) => b.count - a.count);
    },
  });

  // 6 slots distributed around the carousel (center + 2 sides + 2 outer + back)
  const visualSlots = useMemo(() => {
    const activeIndex = panelOrder.indexOf(activePanel);
    const slotMap: VisualSlot[] = ["center", "right", "far-right", "back", "far-left", "left"];
    return panelOrder.reduce<Record<PanelKey, VisualSlot>>((acc, panel, index) => {
      const relative = (index - activeIndex + panelOrder.length) % panelOrder.length;
      acc[panel] = slotMap[relative];
      return acc;
    }, {} as Record<PanelKey, VisualSlot>);
  }, [activePanel]);

  const cycle = (direction: "prev" | "next") => {
    const index = panelOrder.indexOf(activePanel);
    const nextIndex = direction === "next" ? index + 1 : index - 1;
    setActivePanel(panelOrder[(nextIndex + panelOrder.length) % panelOrder.length]);
  };

  // ESC closes the expanded modal
  useEffect(() => {
    if (!expandedPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedPanel]);

  const handlePanelClick = (panel: PanelKey) => {
    if (panel === activePanel) {
      setExpandedPanel(panel);
    } else {
      setActivePanel(panel);
    }
  };

  const renderPanel = (panel: PanelKey, compact = false) => {
    switch (panel) {
      case "dashboard": return <DashboardPanel revenue={revenueData} activeCreators={stats?.activeCreators ?? 0} activeEmployees={stats?.activeEmployees ?? 0} tasks={taskData?.total ?? 0} msgs={chatterBoard?.totalMsgs ?? 0} compact={compact} />;
      case "revenue": return <RevenuePanel data={revenueData} compact={compact} />;
      case "creators": return <CreatorsPanel data={revenueData} compact={compact} />;
      case "chatters": return <ChattersPanel data={chatterBoard} compact={compact} />;
      case "agents": return <AgentsPanel agents={agentActivity ?? []} compact={compact} />;
      case "tasks": return <TasksPanel data={taskData} compact={compact} />;
    }
  };

  if (isMobile) {
    return (
      <DashboardLayout>
        <section
          className="relative -m-4 min-h-[calc(100dvh-4rem)] overflow-hidden bg-background"
          style={{
            backgroundImage: `linear-gradient(180deg, hsl(var(--background) / 0.2), hsl(var(--background) / 0.55)), url('/ops-room/background.jpg')`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_55%)]" />
          <div className="relative flex items-center justify-between px-4 pt-4">
            <div className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.24em] text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_10px_hsl(var(--success))]" />
              Live Ops
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {panelOrder.indexOf(activePanel) + 1}/{panelOrder.length}
            </span>
          </div>
          <div className="relative mt-3 px-3 pb-28">
            <button
              type="button"
              onClick={() => setExpandedPanel(activePanel)}
              className="block w-full overflow-hidden rounded-xl border border-primary/45 bg-card/90 text-left shadow-2xl backdrop-blur-xl active:scale-[0.99] transition"
              aria-label={`Expand ${panelLabels[activePanel]}`}
            >
              <div className="flex h-10 items-center justify-between border-b border-primary/35 bg-primary/10 px-3">
                <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-foreground">{panelLabels[activePanel]}</span>
                <Maximize2 className="h-3.5 w-3.5 text-primary" />
              </div>
              {renderPanel(activePanel, true)}
            </button>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" onClick={() => cycle("prev")} aria-label="Previous" className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-card/85 text-foreground backdrop-blur active:scale-95 transition">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex flex-1 items-center justify-center gap-1.5">
                {panelOrder.map((panel) => (
                  <button key={panel} type="button" onClick={() => setActivePanel(panel)} aria-label={panelLabels[panel]}
                    className={cn("h-1.5 rounded-full transition-all", activePanel === panel ? "w-8 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]" : "w-1.5 bg-muted")} />
                ))}
              </div>
              <button type="button" onClick={() => cycle("next")} aria-label="Next" className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-card/85 text-foreground backdrop-blur active:scale-95 transition">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section
        className="relative -m-5 min-h-[calc(100dvh-2rem)] overflow-hidden bg-background lg:-m-8 xl:-mx-10"
        style={{
          backgroundImage: `linear-gradient(180deg, hsl(var(--background) / 0.1), hsl(var(--background) / 0.38)), url('/ops-room/background.jpg')`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_44%)]" />
        <div className="pointer-events-none absolute right-7 top-6 z-30 flex items-center gap-2 font-display text-xs uppercase tracking-[0.24em] text-success">
          <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_hsl(var(--success))]" />
          Live
        </div>

        <div className="relative h-[calc(100dvh-2rem)] min-h-[720px] [perspective:2000px]">
          {panelOrder.map((panel) => (
            <OpsPanel key={panel} panel={panel} slot={visualSlots[panel]} active={activePanel === panel} onSelect={handlePanelClick}>
              {renderPanel(panel)}
            </OpsPanel>
          ))}
        </div>

        <CarouselNav activePanel={activePanel} onSelect={setActivePanel} onCycle={cycle} />
      </section>

      {expandedPanel && (
        <ExpandedPanelModal panel={expandedPanel} onClose={() => setExpandedPanel(null)}>
          {renderPanel(expandedPanel)}
        </ExpandedPanelModal>
      )}
    </DashboardLayout>
  );
}

function OpsPanel({ panel, slot, active, onSelect, children }: { panel: PanelKey; slot: VisualSlot; active: boolean; onSelect: (panel: PanelKey) => void; children: ReactNode }) {
  const slotClass: Record<VisualSlot, string> = {
    center:     "left-1/2 top-1/2 z-40 w-[min(46vw,820px)] opacity-100",
    right:      "left-[68%] top-[50%] z-30 w-[min(30vw,560px)] opacity-90",
    "far-right":"left-[86%] top-[50%] z-20 w-[min(22vw,420px)] opacity-55",
    left:       "left-[32%] top-[50%] z-30 w-[min(30vw,560px)] opacity-90",
    "far-left": "left-[14%] top-[50%] z-20 w-[min(22vw,420px)] opacity-55",
    back:       "left-1/2 top-[50%] z-10 w-[min(26vw,460px)] opacity-30",
  };

  const transformBySlot: Record<VisualSlot, CSSProperties["transform"]> = {
    center:     "translate3d(-50%, -50%, 0) rotateY(0deg) scale(1)",
    right:      "translate3d(-50%, -50%, -120px) rotateY(-28deg) scale(0.86)",
    "far-right":"translate3d(-50%, -50%, -260px) rotateY(-42deg) scale(0.66)",
    left:       "translate3d(-50%, -50%, -120px) rotateY(28deg) scale(0.86)",
    "far-left": "translate3d(-50%, -50%, -260px) rotateY(42deg) scale(0.66)",
    back:       "translate3d(-50%, -50%, -380px) rotateY(180deg) scale(0.55)",
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(panel)}
      aria-label={active ? `Expand ${panelLabels[panel]}` : `Focus ${panelLabels[panel]}`}
      className={cn(
        "absolute aspect-[1.55/1] origin-center text-left transition-all duration-500 [transform-style:preserve-3d] hover:drop-shadow-[0_0_28px_hsl(var(--primary)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        slotClass[slot],
        active && "drop-shadow-[0_0_32px_hsl(var(--primary)/0.4)]",
      )}
      style={{ transform: transformBySlot[slot] }}
    >
      <div className="h-full overflow-hidden rounded-md border border-primary/55 bg-card/90 shadow-2xl backdrop-blur-xl">
        <div className="flex h-11 items-center justify-between border-b border-primary/35 bg-primary/10 px-4">
          <span className="font-display text-sm font-bold uppercase tracking-[0.22em] text-foreground">{panelLabels[panel]}</span>
          {active ? <Maximize2 className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
        </div>
        {children}
      </div>
    </button>
  );
}

function ExpandedPanelModal({ panel, onClose, children }: { panel: PanelKey; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-4 backdrop-blur-md animate-in fade-in duration-200 sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={panelLabels[panel]}
    >
      <div
        className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-primary/55 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-primary/35 bg-primary/10 px-5">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_hsl(var(--success))]" />
            <span className="font-display text-base font-bold uppercase tracking-[0.22em] text-foreground">{panelLabels[panel]}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-background/60 text-foreground transition hover:bg-primary/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Panels ---------- */

function DashboardPanel({ revenue, activeCreators, activeEmployees, tasks, msgs, compact = false }: { revenue?: any; activeCreators: number; activeEmployees: number; tasks: number; msgs: number; compact?: boolean }) {
  const kpis = [
    { label: "Net Rev MTD", value: currency(revenue?.mtdNet ?? 0), icon: DollarSign, tint: "text-success" },
    { label: "Agency Cut", value: currency(revenue?.mtdAgency ?? 0), icon: TrendingUp, tint: "text-primary" },
    { label: "Creators", value: String(activeCreators), icon: Sparkles, tint: "text-accent" },
    { label: "Team", value: String(activeEmployees), icon: Users, tint: "text-warning" },
    { label: "Open Tasks", value: String(tasks), icon: AlertCircle, tint: "text-primary" },
    { label: "Msgs 24h", value: String(msgs), icon: MessageSquare, tint: "text-success" },
  ];
  return (
    <div className={cn("flex flex-col gap-3 p-3", compact ? "" : "h-[calc(100%-2.75rem)]")}>
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-md border border-border bg-background/55 p-2.5">
            <div className="flex items-center justify-between gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="truncate">{kpi.label}</span>
              <kpi.icon className={cn("h-3.5 w-3.5", kpi.tint)} />
            </div>
            <div className={cn("mt-1.5 font-mono font-bold text-foreground", compact ? "text-base" : "text-lg")}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <div className={cn("rounded-md border border-border bg-background/50 p-3", compact ? "h-44" : "flex-1")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.16em] text-foreground">Monthly Trend</h2>
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Net</span>
        </div>
        <MiniBars months={revenue?.months ?? []} compact={compact} />
      </div>
    </div>
  );
}

function RevenuePanel({ data, compact = false }: { data?: any; compact?: boolean }) {
  const max = Math.max(1, ...((data?.months ?? []).map((m: any) => m.value)));
  return (
    <div className={cn("flex flex-col gap-3 p-3", compact ? "" : "h-[calc(100%-2.75rem)]")}>
      <div className={cn("rounded-md border border-border bg-background/55 p-3", compact ? "h-48" : "flex-1")}>
        <div className="flex h-full items-end gap-2.5 px-1">
          {(data?.months ?? []).map((m: any, i: number) => {
            const h = Math.max(4, (m.value / max) * 100);
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] text-success">{m.value > 0 ? currency(m.value) : ""}</span>
                <div className="w-full rounded-t-sm bg-gradient-to-t from-primary/30 via-primary/70 to-success shadow-[0_0_18px_hsl(var(--primary)/0.45)]" style={{ height: `${h}%` }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{m.label}</span>
              </div>
            );
          })}
          {!data?.months?.length && <EmptyHint label="No revenue yet" />}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Mini label="Tips" value={currency(data?.tips ?? 0)} />
        <Mini label="Subs" value={currency(data?.subs ?? 0)} />
        <Mini label="Messages" value={currency(data?.msgs ?? 0)} />
      </div>
    </div>
  );
}

function CreatorsPanel({ data, compact = false }: { data?: any; compact?: boolean }) {
  const list = data?.topCreators ?? [];
  const max = Math.max(1, ...list.map((x: any) => x.total));
  return (
    <div className={cn("space-y-2 p-3", compact ? "" : "h-[calc(100%-2.75rem)] overflow-auto")}>
      {list.map((c: any, i: number) => {
        const pct = Math.round((c.total / max) * 100);
        return (
          <div key={c.id} className="space-y-1.5 rounded-md border border-border bg-background/50 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                <span className="truncate font-display text-sm font-bold text-foreground">{c.name}</span>
                {i === 0 && <Trophy className="h-3.5 w-3.5 text-warning" />}
              </div>
              <span className="font-mono text-sm font-bold text-success">{currency(c.total)}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-success shadow-[0_0_10px_hsl(var(--success)/0.55)]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      {!list.length && <EmptyHint label="No earnings recorded this month" />}
    </div>
  );
}

function ChattersPanel({ data, compact = false }: { data?: any; compact?: boolean }) {
  const list = data?.chatters ?? [];
  return (
    <div className={cn("space-y-2 p-3", compact ? "" : "h-[calc(100%-2.75rem)] overflow-auto")}>
      <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 p-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Total 24h</span>
        <span className="font-mono text-sm font-bold text-foreground">{data?.totalMsgs ?? 0} <span className="text-muted-foreground">msgs</span></span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-success">{data?.autoReplies ?? 0} auto</span>
      </div>
      {list.map((c: any) => (
        <div key={c.id} className="space-y-1.5 rounded-md border border-border bg-background/50 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-warning" />
              <span className="truncate font-display text-sm font-bold text-foreground">{c.name}</span>
              <span className={cn("rounded-full border px-1.5 py-0.5 font-mono text-[9px]",
                c.grade === "A" ? "border-success/40 text-success" : c.grade === "B" ? "border-primary/40 text-primary" : "border-muted text-muted-foreground")}>
                {c.grade}
              </span>
            </div>
            <span className="font-mono text-xs text-foreground">{c.messages}<span className="text-muted-foreground">/{c.target}</span></span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", c.pct >= 80 ? "bg-success" : c.pct >= 50 ? "bg-primary" : "bg-warning")} style={{ width: `${c.pct}%` }} />
          </div>
        </div>
      ))}
      {!list.length && <EmptyHint label="Add chatter employees to populate" />}
    </div>
  );
}

function AgentsPanel({ agents, compact = false }: { agents: any[]; compact?: boolean }) {
  const max = Math.max(1, ...agents.map(a => a.count));
  return (
    <div className={cn("space-y-2 p-3", compact ? "" : "h-[calc(100%-2.75rem)] overflow-auto")}>
      {agents.map((a) => {
        const pct = Math.round((a.count / max) * 100);
        return (
          <div key={a.name} className="rounded-md border border-border bg-background/50 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary">
                <a.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-foreground">{a.name}</div>
                    <div className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{a.role}</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-success">{a.count}</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {!agents.length && <EmptyHint label="No agent activity yet" />}
    </div>
  );
}

function TasksPanel({ data, compact = false }: { data?: any; compact?: boolean }) {
  const tasks = data?.tasks ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className={cn("space-y-2 p-3", compact ? "" : "h-[calc(100%-2.75rem)] overflow-auto")}>
      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 p-2 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="text-muted-foreground">Total Open</span>
        <span className="font-bold text-foreground">{data?.total ?? 0}</span>
        <span className={cn(data?.overdue ? "text-destructive" : "text-muted-foreground")}>{data?.overdue ?? 0} overdue</span>
      </div>
      {tasks.map((t: any) => {
        const overdue = t.due_date && t.due_date < today;
        return (
          <div key={t.id} className="rounded-md border border-border bg-background/50 p-2.5">
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 font-display text-xs font-bold text-foreground">{t.title}</span>
              <span className={cn("rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]",
                t.priority === "High" ? "border-destructive/40 text-destructive" : t.priority === "Low" ? "border-muted text-muted-foreground" : "border-primary/40 text-primary")}>
                {t.priority}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
              <span className="text-muted-foreground">{t.status}</span>
              {t.due_date && <span className={cn(overdue ? "text-destructive" : "text-muted-foreground")}>{new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            </div>
          </div>
        );
      })}
      {!tasks.length && <EmptyHint label="No open tasks" />}
    </div>
  );
}

/* ---------- Bits ---------- */

function MiniBars({ months, compact }: { months: { label: string; value: number }[]; compact: boolean }) {
  const max = Math.max(1, ...months.map(m => m.value));
  return (
    <div className="flex h-[calc(100%-1rem)] items-end gap-2 px-1">
      {months.map((m, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="w-full rounded-t-sm bg-gradient-to-t from-primary/30 to-success shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
            style={{ height: `${Math.max(4, (m.value / max) * 100)}%` }} />
          <span className={cn("font-mono uppercase tracking-[0.16em] text-muted-foreground", compact ? "text-[9px]" : "text-[10px]")}>{m.label}</span>
        </div>
      ))}
      {!months.length && <EmptyHint label="No data" />}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-bold text-foreground">{value}</div>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <div className="w-full rounded-md border border-dashed border-border bg-background/30 p-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>;
}

function CarouselNav({ activePanel, onSelect, onCycle }: { activePanel: PanelKey; onSelect: (panel: PanelKey) => void; onCycle: (direction: "prev" | "next") => void }) {
  return (
    <div className="absolute bottom-6 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4">
      <button type="button" aria-label="Previous" onClick={() => onCycle("prev")} className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-card/85 text-foreground backdrop-blur transition hover:bg-primary/20">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-primary/25 bg-card/80 p-1 backdrop-blur">
        {panelOrder.map((panel) => (
          <button key={panel} type="button" onClick={() => onSelect(panel)}
            className={cn("rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition",
              activePanel === panel ? "bg-primary/25 text-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {panelLabels[panel]}
          </button>
        ))}
      </div>
      <button type="button" aria-label="Next" onClick={() => onCycle("next")} className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-card/85 text-foreground backdrop-blur transition hover:bg-primary/20">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
