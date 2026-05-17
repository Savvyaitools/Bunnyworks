import { useMemo } from "react";
import { Activity, AlertCircle, Bot, CheckCircle2, Crown, DollarSign, Flame, MessageSquare, Sparkles, TrendingUp, Trophy, Users, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAgency } from "@/hooks/useAgency";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function currency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Index() {
  const { data: stats } = useDashboardStats();
  const { agency } = useAgency();
  const agencyId = agency?.id;

  // Revenue: last 6 months + MTD totals
  const { data: revenueData } = useQuery({
    queryKey: ["ops-revenue-6mo", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 5);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const { data: creators } = await supabase
        .from("creators")
        .select("id, name, avatar_url")
        .eq("agency_id", agencyId!);
      const creatorMap = new Map((creators ?? []).map((c: any) => [c.id, c]));
      const ids = Array.from(creatorMap.keys());
      if (!ids.length) return { months: [], topCreators: [], mtdNet: 0, mtdAgency: 0 };

      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount, period_start, creator_id, tips, subscriptions, messages_revenue")
        .in("creator_id", ids)
        .gte("period_start", since.toISOString().slice(0, 10));

      const buckets = new Map<string, number>();
      const creatorTotalsMTD = new Map<string, number>();
      const mtdStart = new Date();
      mtdStart.setDate(1);
      mtdStart.setHours(0, 0, 0, 0);
      const mtdIso = mtdStart.toISOString().slice(0, 10);
      let mtdNet = 0;
      let tips = 0, subs = 0, msgs = 0;

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
        .slice(0, 5)
        .map(([id, total]) => ({
          id,
          name: (creatorMap.get(id) as any)?.name ?? "Unknown",
          avatar_url: (creatorMap.get(id) as any)?.avatar_url ?? null,
          total,
        }));

      return { months, topCreators, mtdNet, mtdAgency: mtdNet * 0.5, tips, subs, msgs };
    },
  });

  // Chatter board: messages logged in last 24h per chatter (proxy: chatter_message_log count + active chatters)
  const { data: chatterBoard } = useQuery({
    queryKey: ["chatter-board", agencyId],
    enabled: Boolean(agencyId),
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const since = new Date();
      since.setHours(since.getHours() - 24);

      const [logsRes, employeesRes, shiftsRes] = await Promise.all([
        supabase
          .from("chatter_message_log")
          .select("id, was_sent, was_auto_reply, created_at", { count: "exact" })
          .eq("agency_id", agencyId!)
          .gte("created_at", since.toISOString()),
        supabase
          .from("employees")
          .select("id, name, avatar_seed, avatar_url, skill_grade, daily_target_messages, status")
          .eq("agency_id", agencyId!)
          .eq("status", "Active")
          .or("department.ilike.%chat%,role.ilike.%chat%"),
        supabase
          .from("chatter_time_logs")
          .select("chatter_id, duration_minutes, clock_in")
          .gte("clock_in", since.toISOString()),
      ]);

      const totalMsgs = logsRes.count ?? 0;
      const autoReplies = (logsRes.data ?? []).filter((r: any) => r.was_auto_reply).length;
      const minutesByChatter = new Map<string, number>();
      for (const row of shiftsRes.data ?? []) {
        if (!row.chatter_id) continue;
        minutesByChatter.set(row.chatter_id, (minutesByChatter.get(row.chatter_id) ?? 0) + Number(row.duration_minutes ?? 0));
      }

      const chatters = (employeesRes.data ?? []).map((e: any) => {
        const minutes = minutesByChatter.get(e.id) ?? 0;
        const target = Number(e.daily_target_messages ?? 0) || 100;
        const distributedMsgs = totalMsgs > 0 && (employeesRes.data?.length ?? 0) > 0
          ? Math.round(totalMsgs / (employeesRes.data?.length ?? 1))
          : 0;
        return {
          id: e.id,
          name: e.name,
          grade: e.skill_grade ?? "B",
          minutes,
          messages: distributedMsgs,
          target,
          pct: Math.min(100, Math.round((distributedMsgs / target) * 100)),
        };
      }).sort((a: any, b: any) => b.messages - a.messages || b.minutes - a.minutes).slice(0, 6);

      return { chatters, totalMsgs, autoReplies };
    },
  });

  // Tasks board
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

  // AI agent activity (last 7d message counts across agents)
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

  const maxBar = useMemo(() => Math.max(1, ...(revenueData?.months.map(m => m.value) ?? [0])), [revenueData]);

  return (
    <DashboardLayout>
      <section
        className="relative -m-5 min-h-[calc(100dvh-2rem)] overflow-hidden bg-background lg:-m-8 xl:-mx-10"
        style={{
          backgroundImage: `linear-gradient(180deg, hsl(var(--background) / 0.55), hsl(var(--background) / 0.85)), url('/ops-room/background.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_55%)]" />

        <div className="relative space-y-4 p-5 lg:p-7 xl:p-8">
          {/* Header strip */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.28em] text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_10px_hsl(var(--success))]" />
                Live Ops Room
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.08em] text-foreground lg:text-3xl">
                {agency?.name ?? "Agency"} · Command Center
              </h1>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {/* KPI row — 6 across */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Net Revenue (MTD)" value={currency(revenueData?.mtdNet ?? 0)} icon={DollarSign} tint="text-success" />
            <Kpi label="Agency Cut" value={currency(revenueData?.mtdAgency ?? 0)} icon={TrendingUp} tint="text-primary" />
            <Kpi label="Active Creators" value={String(stats?.activeCreators ?? 0)} icon={Sparkles} tint="text-accent" />
            <Kpi label="Team Members" value={String(stats?.activeEmployees ?? 0)} icon={Users} tint="text-warning" />
            <Kpi label="Open Tasks" value={String(taskData?.total ?? 0)} icon={CheckCircle2} tint="text-primary" sub={taskData?.overdue ? `${taskData.overdue} overdue` : undefined} />
            <Kpi label="Msgs 24h" value={String(chatterBoard?.totalMsgs ?? 0)} icon={MessageSquare} tint="text-success" sub={chatterBoard?.autoReplies ? `${chatterBoard.autoReplies} auto` : undefined} />
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Revenue chart */}
            <Panel title="Revenue · Last 6 Months" subtitle="Net earnings" icon={Activity} className="lg:col-span-8">
              <div className="flex h-56 items-end gap-3 px-2">
                {(revenueData?.months ?? [{label:"—",value:0},{label:"—",value:0},{label:"—",value:0},{label:"—",value:0},{label:"—",value:0},{label:"—",value:0}]).map((m, i) => {
                  const h = Math.max(4, (m.value / maxBar) * 100);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <span className="font-mono text-[10px] text-success">{m.value > 0 ? currency(m.value) : ""}</span>
                      <div
                        className="w-full rounded-t-sm bg-gradient-to-t from-primary/30 via-primary/70 to-success shadow-[0_0_20px_hsl(var(--primary)/0.45)]"
                        style={{ height: `${h}%` }}
                      />
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{m.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                <Mini label="Tips" value={currency(revenueData?.tips ?? 0)} />
                <Mini label="Subscriptions" value={currency(revenueData?.subs ?? 0)} />
                <Mini label="Messages" value={currency(revenueData?.msgs ?? 0)} />
              </div>
            </Panel>

            {/* AI Agents activity */}
            <Panel title="AI Agents · 7d" subtitle="Activity" icon={Bot} className="lg:col-span-4">
              <div className="space-y-2.5">
                {(agentActivity ?? []).map((a) => {
                  const max = Math.max(1, ...(agentActivity?.map(x => x.count) ?? [1]));
                  const pct = Math.round((a.count / max) * 100);
                  return (
                    <div key={a.name} className="rounded-md border border-border bg-background/50 p-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary">
                          <a.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-display text-sm font-bold text-foreground">{a.name}</span>
                            <span className="font-mono text-xs text-success">{a.count}</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!agentActivity?.length && <EmptyHint label="No agent activity yet" />}
              </div>
            </Panel>

            {/* Top Creators leaderboard */}
            <Panel title="Top Creators · MTD" subtitle="Revenue leaders" icon={Trophy} className="lg:col-span-4">
              <div className="space-y-2.5">
                {(revenueData?.topCreators ?? []).map((c, i) => {
                  const max = Math.max(1, ...(revenueData?.topCreators.map(x => x.total) ?? [1]));
                  const pct = Math.round((c.total / max) * 100);
                  return (
                    <div key={c.id} className="space-y-1.5 rounded-md border border-border bg-background/45 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                          <span className="truncate font-display text-sm font-bold text-foreground">{c.name}</span>
                        </div>
                        <span className="font-mono text-sm font-bold text-success">{currency(c.total)}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-success shadow-[0_0_10px_hsl(var(--success)/0.55)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!revenueData?.topCreators.length && <EmptyHint label="No earnings recorded this month" />}
              </div>
            </Panel>

            {/* Chatter Board */}
            <Panel title="Chatter Board · 24h" subtitle="Messaging team performance" icon={Flame} className="lg:col-span-5">
              <div className="space-y-2">
                <div className="grid grid-cols-12 px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <span className="col-span-5">Chatter</span>
                  <span className="col-span-2 text-center">Grade</span>
                  <span className="col-span-2 text-right">Mins</span>
                  <span className="col-span-3 text-right">Msgs / Target</span>
                </div>
                {(chatterBoard?.chatters ?? []).map((c) => (
                  <div key={c.id} className="grid grid-cols-12 items-center gap-2 rounded-md border border-border bg-background/50 p-2.5">
                    <span className="col-span-5 truncate font-display text-sm font-bold text-foreground">{c.name}</span>
                    <span className="col-span-2 text-center">
                      <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px]", c.grade === "A" ? "border-success/40 text-success" : c.grade === "B" ? "border-primary/40 text-primary" : "border-muted text-muted-foreground")}>
                        {c.grade}
                      </span>
                    </span>
                    <span className="col-span-2 text-right font-mono text-xs text-muted-foreground">{c.minutes}m</span>
                    <div className="col-span-3 space-y-1">
                      <div className="text-right font-mono text-xs text-foreground">{c.messages}<span className="text-muted-foreground"> / {c.target}</span></div>
                      <div className="h-1 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", c.pct >= 80 ? "bg-success" : c.pct >= 50 ? "bg-primary" : "bg-warning")} style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {!chatterBoard?.chatters.length && <EmptyHint label="Add chatter employees to populate the board" />}
              </div>
            </Panel>

            {/* Tasks */}
            <Panel title="Priority Tasks" subtitle={`${taskData?.overdue ?? 0} overdue`} icon={AlertCircle} className="lg:col-span-3">
              <div className="space-y-2">
                {(taskData?.tasks ?? []).map((t: any) => {
                  const overdue = t.due_date && t.due_date < new Date().toISOString().slice(0, 10);
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
                        {t.due_date && (
                          <span className={cn(overdue ? "text-destructive" : "text-muted-foreground")}>
                            {new Date(t.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!taskData?.tasks.length && <EmptyHint label="No open tasks" />}
              </div>
            </Panel>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

function Kpi({ label, value, icon: Icon, tint, sub }: { label: string; value: string; icon: any; tint: string; sub?: string }) {
  return (
    <div className="rounded-md border border-primary/35 bg-card/85 p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="truncate">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", tint)} />
      </div>
      <div className="mt-1.5 font-mono text-xl font-bold text-foreground">{value}</div>
      {sub && <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-warning">{sub}</div>}
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, className, children }: { title: string; subtitle?: string; icon: any; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-primary/45 bg-card/85 shadow-2xl backdrop-blur-xl", className)}>
      <div className="flex h-11 items-center justify-between border-b border-primary/30 bg-primary/10 px-3.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground">{title}</span>
        </div>
        {subtitle && <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="p-3.5">{children}</div>
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
  return <div className="rounded-md border border-dashed border-border bg-background/30 p-4 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>;
}
