import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  aiJSON,
  corsHeaders,
  jsonError,
  jsonResponse,
  handleAIError,
  AIGatewayError,
} from "../_shared/ai-client.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface AgencyData {
  agency: any;
  creators: any[];
  employees: any[];
  tasks: any[];
  earnings: any[];
  shifts: any[];
  alerts: any[];
  goals: any[];
  recentFeedback: any[];
  recentRuns: any[];
  contentPlans: any[];
  timeLogs: any[];
}

async function gatherAgencyData(supabase: any, agencyId: string): Promise<AgencyData> {
  const { data: agencyCreators } = await supabase.from('creators').select('id').eq('agency_id', agencyId);
  const creatorIds = (agencyCreators || []).map((c: any) => c.id);
  const { data: agencyChatters } = await supabase.from('chatters').select('id').eq('agency_id', agencyId);
  const chatterIds = (agencyChatters || []).map((c: any) => c.id);

  const [
    { data: agency }, { data: creators }, { data: employees }, { data: tasks },
    { data: earnings }, { data: shifts }, { data: alerts }, { data: goals },
    { data: recentFeedback }, { data: recentRuns }, { data: contentPlans }, { data: timeLogs },
  ] = await Promise.all([
    supabase.from('agencies').select('*').eq('id', agencyId).single(),
    supabase.from('creators').select('*').eq('agency_id', agencyId),
    supabase.from('employees').select('*').eq('agency_id', agencyId),
    supabase.from('tasks').select('*').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(100),
    creatorIds.length > 0
      ? supabase.from('creator_earnings').select('*, creators(name)').in('creator_id', creatorIds).order('period_end', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
    chatterIds.length > 0
      ? supabase.from('chatter_shifts').select('*, chatters(name), creators(name)').in('chatter_id', chatterIds).order('shift_start', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
    supabase.from('ai_performance_alerts').select('*').eq('agency_id', agencyId).eq('is_dismissed', false).order('created_at', { ascending: false }).limit(20),
    supabase.from('agent_goals').select('*').eq('agency_id', agencyId).eq('is_active', true),
    supabase.from('agent_feedback').select('*, agent_actions(action_type, parameters)').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(20),
    supabase.from('agent_runs').select('*').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(5),
    supabase.from('content_plans').select('*, creators(name)').eq('agency_id', agencyId).order('updated_at', { ascending: false }).limit(30),
    chatterIds.length > 0
      ? supabase.from('chatter_time_logs').select('*, chatters(name)').in('chatter_id', chatterIds).order('clock_in', { ascending: false }).limit(30)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    agency, creators: creators || [], employees: employees || [],
    tasks: tasks || [], earnings: earnings || [], shifts: shifts || [],
    alerts: alerts || [], goals: goals || [], recentFeedback: recentFeedback || [],
    recentRuns: recentRuns || [], contentPlans: contentPlans || [], timeLogs: timeLogs || [],
  };
}

// ─── Workflow: Monitor ─────────────────────────────────────────────
function buildMonitorPrompt(data: AgencyData): string {
  const normalize = (s: string) => (s || '').toLowerCase().replace(/[_ ]/g, '');
  const activeCreators = data.creators.filter(c => normalize(c.status) === 'active');
  const overdueTasks = data.tasks.filter(t => normalize(t.status) !== 'done' && normalize(t.status) !== 'completed' && t.due_date && new Date(t.due_date) < new Date());
  const totalRevenue = data.earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingTasks = data.tasks.filter(t => normalize(t.status) === 'todo' || normalize(t.status) === 'pending');
  const feedbackSummary = data.recentFeedback.length > 0
    ? `\nPAST FEEDBACK:\n${data.recentFeedback.map(f => `- ${f.rating === 1 ? '👍' : '👎'} ${f.agent_actions?.action_type}: ${f.comment || 'no comment'}`).join('\n')}`
    : '';
  const goalsSummary = data.goals.length > 0
    ? `\nGOALS:\n${data.goals.map(g => `- ${g.metric}: ${g.current_value}/${g.target_value} ${g.unit} (${g.priority})`).join('\n')}`
    : '';

  return `You are the Flick performance monitor for an OnlyFans agency.

AGENCY: ${data.agency?.name || 'Unknown'}
CREATORS: ${data.creators.length} (${activeCreators.length} active)
EMPLOYEES: ${data.employees.length}
REVENUE: $${totalRevenue.toFixed(2)}
OVERDUE: ${overdueTasks.length} | PENDING: ${pendingTasks.length}
${data.creators.map(c => `- ${c.name}: status=${c.status}, revenue=$${c.revenue || 0}`).join('\n')}
${overdueTasks.slice(0, 10).map(t => `- OVERDUE: "${t.title}" due ${t.due_date}`).join('\n')}
UNDISMISSED ALERTS: ${data.alerts.length}
${goalsSummary}${feedbackSummary}

Respond ONLY with JSON array of actions:
- {"action":"create_alert","severity":"warning|critical|info","title":"...","message":"...","alert_type":"revenue_drop|missed_shift|overdue_task|inactive_creator|goal_at_risk","entity_type":"creator|employee|task","entity_id":"uuid-or-null"}
- {"action":"send_notification","user_type":"agency","title":"...","message":"..."}
Rules: Only real issues. Don't duplicate existing alerts. Consider feedback. If nothing wrong, return [].`;
}

// ─── Workflow: Briefing ────────────────────────────────────────────
function buildBriefingPrompt(data: AgencyData): string {
  const normalize = (s: string) => (s || '').toLowerCase().replace(/[_ ]/g, '');
  const totalRevenue = data.earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const completedTasks = data.tasks.filter(t => normalize(t.status) === 'done' || normalize(t.status) === 'completed').length;
  const pendingTasks = data.tasks.filter(t => normalize(t.status) === 'todo' || normalize(t.status) === 'pending').length;
  const activeCreators = data.creators.filter(c => normalize(c.status) === 'active').length;

  return `Generate a daily briefing for "${data.agency?.name}" agency.
Metrics: Creators=${data.creators.length} (${activeCreators} active), Employees=${data.employees.length}, Revenue=$${totalRevenue.toFixed(2)}, Done=${completedTasks}, Pending=${pendingTasks}
Top creators: ${data.creators.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5).map(c => `${c.name}=$${c.revenue || 0}`).join(', ')}
Alerts: ${data.alerts.length} undismissed
Goals: ${data.goals.map(g => `${g.metric}: ${g.current_value}/${g.target_value}`).join(', ') || 'None'}

Respond ONLY JSON: {"summary":"...","key_metrics":{"total_revenue":N,"active_creators":N,"pending_tasks":N,"completed_tasks":N,"active_employees":N},"alerts":[{"type":"...","message":"...","severity":"info|warning|critical"}],"recommendations":[{"title":"...","description":"...","priority":"low|medium|high"}]}`;
}

// ─── Workflow: Revenue Recovery ────────────────────────────────────
function buildRevenueRecoveryPrompt(data: AgencyData): string {
  const earningsByCreator: Record<string, number[]> = {};
  for (const e of data.earnings) {
    const name = e.creators?.name || 'Unknown';
    if (!earningsByCreator[name]) earningsByCreator[name] = [];
    earningsByCreator[name].push(e.amount || 0);
  }

  const trends = Object.entries(earningsByCreator).map(([name, amounts]) => {
    const recent = amounts.slice(0, 3);
    const older = amounts.slice(3, 6);
    const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const olderAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : 0;
    const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1) : '0';
    return `${name}: recent avg=$${recentAvg.toFixed(0)}, prior avg=$${olderAvg.toFixed(0)}, change=${change}%`;
  }).join('\n');

  return `Analyze revenue trends for "${data.agency?.name}" and identify recovery opportunities.

REVENUE TRENDS BY CREATOR:
${trends || 'No earnings data'}

ACTIVE CONTENT PLANS:
${data.contentPlans.slice(0, 10).map(p => `"${p.title}" for ${p.creators?.name} (${p.board_column})`).join('\n') || 'None'}

Respond ONLY JSON array of recovery actions:
[{"action":"create_alert","severity":"warning|critical","title":"...","message":"...","alert_type":"revenue_drop","entity_type":"creator","entity_id":null},
{"action":"create_task","title":"...","description":"...","priority":"Urgent|High","creator_name":"..."}]
If no drops detected, return [].`;
}

// ─── Workflow: Content Gap Detection ───────────────────────────────
function buildContentGapPrompt(data: AgencyData): string {
  const normalize = (s: string) => (s || '').toLowerCase().replace(/[_ ]/g, '');
  const activeCreators = data.creators.filter(c => normalize(c.status) === 'active');

  const plansByCreator: Record<string, number> = {};
  for (const p of data.contentPlans) {
    const name = p.creators?.name || 'Unknown';
    plansByCreator[name] = (plansByCreator[name] || 0) + 1;
  }

  const creatorPlans = activeCreators.map(c => {
    const count = plansByCreator[c.name] || 0;
    const inProgress = data.contentPlans.filter(p => p.creators?.name === c.name && p.board_column === 'in_progress').length;
    const done = data.contentPlans.filter(p => p.creators?.name === c.name && p.board_column === 'done').length;
    return `${c.name}: ${count} plans (${inProgress} in-progress, ${done} done)`;
  }).join('\n');

  return `Detect content pipeline gaps for "${data.agency?.name}".

ACTIVE CREATORS & THEIR CONTENT PLANS:
${creatorPlans || 'No active creators'}

OVERDUE/STALE TASKS:
${data.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && normalize(t.status) !== 'completed').slice(0, 10).map(t => `"${t.title}" due ${t.due_date}`).join('\n') || 'None'}

Respond ONLY JSON array of actions:
[{"action":"create_alert","severity":"warning","title":"...","message":"...","alert_type":"content_gap","entity_type":"creator","entity_id":null},
{"action":"create_task","title":"...","description":"...","priority":"High","creator_name":"..."}]
If pipeline is healthy, return [].`;
}

// ─── Workflow: Shift Optimization ──────────────────────────────────
function buildShiftOptimizationPrompt(data: AgencyData): string {
  const today = new Date().toISOString().split('T')[0];
  const todayShifts = data.shifts.filter(s => s.shift_start?.startsWith(today));
  const shiftsByBlock = { night: 0, day: 0, evening: 0 };
  for (const s of todayShifts) {
    const hour = new Date(s.shift_start).getHours();
    if (hour < 8) shiftsByBlock.night++;
    else if (hour < 16) shiftsByBlock.day++;
    else shiftsByBlock.evening++;
  }

  const recentLogs = data.timeLogs.slice(0, 20).map(t =>
    `${t.chatters?.name}: ${t.duration_minutes ? Math.round(t.duration_minutes) + 'min' : 'ongoing'}`
  ).join(', ');

  return `Optimize shift coverage for "${data.agency?.name}".

TODAY'S COVERAGE: Night(12-8AM)=${shiftsByBlock.night}, Day(8AM-4PM)=${shiftsByBlock.day}, Evening(4PM-12AM)=${shiftsByBlock.evening}
TOTAL CHATTERS: ${data.shifts.length > 0 ? [...new Set(data.shifts.map(s => s.chatters?.name))].join(', ') : 'None scheduled'}
RECENT TIME LOGS: ${recentLogs || 'None'}

Respond ONLY JSON array:
[{"action":"create_alert","severity":"warning","title":"...","message":"...","alert_type":"shift_gap"},
{"action":"send_notification","user_type":"agency","title":"...","message":"..."}]
If coverage is adequate, return [].`;
}

// ─── Workflow: Fan Re-engagement ───────────────────────────────────
function buildFanReengagementPrompt(data: AgencyData): string {
  const earningsByCreator: Record<string, any[]> = {};
  for (const e of data.earnings) {
    const name = e.creators?.name || 'Unknown';
    if (!earningsByCreator[name]) earningsByCreator[name] = [];
    earningsByCreator[name].push(e);
  }

  const analysis = Object.entries(earningsByCreator).map(([name, records]) => {
    const recent = records[0];
    const tipTrend = records.slice(0, 3).map(r => r.tips || 0);
    const msgTrend = records.slice(0, 3).map(r => r.messages_revenue || 0);
    return `${name}: tips=[${tipTrend.join(',')}], msgs=[${msgTrend.join(',')}], subs=$${recent?.subscriptions || 0}`;
  }).join('\n');

  return `Identify fan re-engagement opportunities for "${data.agency?.name}".

REVENUE BREAKDOWN (last 3 periods per creator):
${analysis || 'No data'}

Respond ONLY JSON array:
[{"action":"create_alert","severity":"info","title":"...","message":"...","alert_type":"fan_reengagement","entity_type":"creator","entity_id":null},
{"action":"create_task","title":"...","description":"...","priority":"Medium","creator_name":"..."}]
If engagement is healthy, return [].`;
}

// ─── Action Executors ──────────────────────────────────────────────
async function executeActions(supabase: any, agencyId: string, runId: string, actions: any[]): Promise<number> {
  // Auto-dismiss alerts older than 7 days to prevent alert fatigue
  await supabase
    .from('ai_performance_alerts')
    .update({ is_dismissed: true })
    .eq('agency_id', agencyId)
    .eq('is_dismissed', false)
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  let count = 0;
  for (const action of actions) {
    try {
      if (action.action === 'create_alert') {
        await supabase.from('ai_performance_alerts').insert({
          agency_id: agencyId, severity: action.severity || 'info',
          title: action.title, message: action.message,
          alert_type: action.alert_type || 'general',
          entity_type: action.entity_type || null, entity_id: action.entity_id || null,
        });
      } else if (action.action === 'send_notification') {
        const { data: profiles } = await supabase.from('profiles').select('id').eq('agency_id', agencyId).eq('user_type', 'agency');
        for (const p of (profiles || [])) {
          await supabase.from('notifications').insert({
            user_id: p.id, title: action.title, message: action.message, type: 'agent', link: '/of-ai',
          });
        }
      } else if (action.action === 'create_task') {
        await supabase.from('tasks').insert({
          agency_id: agencyId, title: action.title,
          description: action.description || '', priority: action.priority || 'Normal', status: 'To Do',
        });
      }
      await supabase.from('agent_actions').insert({
        run_id: runId, agency_id: agencyId, action_type: action.action,
        target_entity_type: action.entity_type || null, target_entity_id: action.entity_id || null,
        parameters: action, outcome: 'success',
      });
      count++;
    } catch (err) {
      console.error('Action error:', err);
      await supabase.from('agent_actions').insert({
        run_id: runId, agency_id: agencyId, action_type: action.action,
        parameters: action, outcome: 'failed',
        outcome_details: err instanceof Error ? err.message : 'Unknown',
      });
    }
  }
  return count;
}

async function executeBriefing(supabase: any, agencyId: string, runId: string, briefing: any): Promise<number> {
  try {
    await supabase.from('felix_briefings').insert({
      agency_id: agencyId, briefing_date: new Date().toISOString().split('T')[0],
      summary: briefing.summary || 'Daily briefing.', key_metrics: briefing.key_metrics || {},
      alerts: briefing.alerts || [], recommendations: briefing.recommendations || [],
    });
    await supabase.from('agent_actions').insert({
      run_id: runId, agency_id: agencyId, action_type: 'generate_briefing',
      parameters: { briefing_date: new Date().toISOString().split('T')[0] }, outcome: 'success',
    });
    return 1;
  } catch (err) {
    console.error('Briefing error:', err);
    return 0;
  }
}

// ─── Workflow Registry ─────────────────────────────────────────────
const WORKFLOWS: Record<string, (data: AgencyData) => string> = {
  monitor: buildMonitorPrompt,
  briefing: buildBriefingPrompt,
  revenue_recovery: buildRevenueRecoveryPrompt,
  content_gap: buildContentGapPrompt,
  shift_optimization: buildShiftOptimizationPrompt,
  fan_reengagement: buildFanReengagementPrompt,
};

// ─── Main ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const agentType = url.searchParams.get('agent') || 'monitor';

    if (!WORKFLOWS[agentType]) {
      return jsonError(`Unknown workflow: ${agentType}. Available: ${Object.keys(WORKFLOWS).join(', ')}`);
    }

    const { data: agencies, error: agencyError } = await supabase.from('agencies').select('id, name');
    if (agencyError || !agencies?.length) {
      return jsonResponse({ message: 'No agencies found', error: agencyError });
    }

    const results: any[] = [];

    for (const agency of agencies) {
      const { data: run, error: runError } = await supabase
        .from('agent_runs')
        .insert({ agency_id: agency.id, agent_type: agentType, status: 'running' })
        .select().single();

      if (runError || !run) {
        console.error(`Run creation failed for ${agency.id}:`, runError);
        continue;
      }

      try {
        const data = await gatherAgencyData(supabase, agency.id);
        const prompt = WORKFLOWS[agentType](data);

        const parsed = await aiJSON(
          'You are an AI operations agent. Respond with ONLY valid JSON.',
          prompt,
          { model: 'google/gemini-2.5-flash', temperature: 0.3 }
        );

        let actionsCount = 0;
        if (agentType === 'briefing') {
          actionsCount = await executeBriefing(supabase, agency.id, run.id, parsed);
        } else {
          const actions = Array.isArray(parsed) ? parsed : [];
          actionsCount = await executeActions(supabase, agency.id, run.id, actions);
        }

        const duration = Date.now() - startTime;
        await supabase.from('agent_runs').update({
          status: 'completed', actions_taken: actionsCount, duration_ms: duration,
          completed_at: new Date().toISOString(),
          data_snapshot: { creators: data.creators.length, employees: data.employees.length, earnings: data.earnings.length, tasks: data.tasks.length },
        }).eq('id', run.id);

        results.push({ agency: agency.name, status: 'completed', actions: actionsCount });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        await supabase.from('agent_runs').update({
          status: 'failed', error_message: errorMsg, duration_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        }).eq('id', run.id);
        results.push({ agency: agency.name, status: 'failed', error: errorMsg });
      }
    }

    return jsonResponse({ agent: agentType, results, total_duration_ms: Date.now() - startTime });
  } catch (error) {
    return handleAIError(error);
  }
});
