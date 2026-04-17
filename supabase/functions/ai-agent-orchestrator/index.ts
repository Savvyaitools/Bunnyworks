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
    { data: recentFeedback }, { data: contentPlans }, { data: timeLogs },
  ] = await Promise.all([
    supabase.from('agencies').select('name, subscription_tier, commission_rate').eq('id', agencyId).single(),
    supabase.from('creators').select('id, name, status, revenue').eq('agency_id', agencyId),
    supabase.from('employees').select('id, name, role, status').eq('agency_id', agencyId),
    supabase.from('tasks').select('id, title, status, priority, due_date').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(50),
    creatorIds.length > 0
      ? supabase.from('creator_earnings').select('creator_id, amount, tips, subscriptions, messages_revenue, period_start, period_end, creators(name)').in('creator_id', creatorIds).order('period_end', { ascending: false }).limit(30)
      : Promise.resolve({ data: [] }),
    chatterIds.length > 0
      ? supabase.from('chatter_shifts').select('shift_start, shift_end, shift_type, chatters(name), creators(name)').in('chatter_id', chatterIds).order('shift_start', { ascending: false }).limit(30)
      : Promise.resolve({ data: [] }),
    supabase.from('ai_performance_alerts').select('title, message, severity, alert_type, created_at').eq('agency_id', agencyId).eq('is_dismissed', false).order('created_at', { ascending: false }).limit(15),
    supabase.from('agent_goals').select('metric, current_value, target_value, unit, priority').eq('agency_id', agencyId).eq('is_active', true),
    supabase.from('agent_feedback').select('rating, comment, agent_actions(action_type)').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(10),
    supabase.from('content_plans').select('title, board_column, platform, status, scheduled_date, creators(name)').eq('agency_id', agencyId).order('updated_at', { ascending: false }).limit(20),
    chatterIds.length > 0
      ? supabase.from('chatter_time_logs').select('duration_minutes, chatters(name)').in('chatter_id', chatterIds).order('clock_in', { ascending: false }).limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    agency, creators: creators || [], employees: employees || [],
    tasks: tasks || [], earnings: earnings || [], shifts: shifts || [],
    alerts: alerts || [], goals: goals || [], recentFeedback: recentFeedback || [],
    contentPlans: contentPlans || [], timeLogs: timeLogs || [],
  };
}

const normalize = (s: string) => (s || '').toLowerCase().replace(/[_ ]/g, '');

// ─── Workflow: Monitor ─────────────────────────────────────────────
function buildMonitorPrompt(data: AgencyData): string {
  const activeCreators = data.creators.filter(c => normalize(c.status) === 'active');
  const overdueTasks = data.tasks.filter(t => normalize(t.status) !== 'done' && normalize(t.status) !== 'completed' && t.due_date && new Date(t.due_date) < new Date());
  const totalRevenue = data.earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingTasks = data.tasks.filter(t => normalize(t.status) === 'todo' || normalize(t.status) === 'pending');

  const feedbackSummary = data.recentFeedback.length > 0
    ? `\nFEEDBACK:\n${data.recentFeedback.map(f => `- ${f.rating === 1 ? '👍' : '👎'} ${f.agent_actions?.action_type}: ${f.comment || 'no comment'}`).join('\n')}`
    : '';
  const goalsSummary = data.goals.length > 0
    ? `\nGOALS:\n${data.goals.map(g => `- ${g.metric}: ${g.current_value}/${g.target_value} ${g.unit} (${g.priority})`).join('\n')}`
    : '';

  return `Performance monitor for "${data.agency?.name}".
CREATORS: ${data.creators.length} (${activeCreators.length} active) | REVENUE: $${totalRevenue.toFixed(2)}
OVERDUE: ${overdueTasks.length} | PENDING: ${pendingTasks.length}
${data.creators.map(c => `- ${c.name}: ${c.status}, $${c.revenue || 0}`).join('\n')}
${overdueTasks.slice(0, 8).map(t => `- OVERDUE: "${t.title}" due ${t.due_date}`).join('\n')}
EXISTING ALERTS: ${data.alerts.length} (${data.alerts.slice(0, 3).map(a => a.title).join(', ')})
${goalsSummary}${feedbackSummary}

Respond JSON array of actions. Don't duplicate existing alerts by title.
[{"action":"create_alert","severity":"warning|critical|info","title":"...","message":"...","alert_type":"revenue_drop|missed_shift|overdue_task|inactive_creator|goal_at_risk"}]
If nothing wrong, return [].`;
}

// ─── Workflow: Briefing ────────────────────────────────────────────
function buildBriefingPrompt(data: AgencyData): string {
  const totalRevenue = data.earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const completed = data.tasks.filter(t => normalize(t.status) === 'done' || normalize(t.status) === 'completed').length;
  const pending = data.tasks.filter(t => normalize(t.status) === 'todo' || normalize(t.status) === 'pending').length;
  const active = data.creators.filter(c => normalize(c.status) === 'active').length;

  return `Daily briefing for "${data.agency?.name}".
Creators=${data.creators.length} (${active} active), Employees=${data.employees.length}, Revenue=$${totalRevenue.toFixed(2)}, Done=${completed}, Pending=${pending}
Top: ${data.creators.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 3).map(c => `${c.name}=$${c.revenue || 0}`).join(', ')}
Alerts: ${data.alerts.length}, Goals: ${data.goals.map(g => `${g.metric}: ${g.current_value}/${g.target_value}`).join(', ') || 'None'}

Respond JSON: {"summary":"...","key_metrics":{"total_revenue":N,"active_creators":N,"pending_tasks":N,"completed_tasks":N},"alerts":[{"type":"...","message":"...","severity":"info|warning|critical"}],"recommendations":[{"title":"...","description":"...","priority":"low|medium|high"}]}`;
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
    return `${name}: recent=$${recentAvg.toFixed(0)}, prior=$${olderAvg.toFixed(0)}, change=${change}%`;
  }).join('\n');

  return `Revenue recovery for "${data.agency?.name}".

TRENDS:
${trends || 'No data'}

CONTENT PIPELINE:
${data.contentPlans.slice(0, 8).map(p => `"${p.title}" for ${p.creators?.name} (${p.board_column})`).join('\n') || 'None'}

Respond JSON array:
[{"action":"create_alert","severity":"warning|critical","title":"...","message":"...","alert_type":"revenue_drop"},
{"action":"create_task","title":"...","description":"...","priority":"Urgent|High"}]
If no drops, return [].`;
}

// ─── Workflow: Content Gap ─────────────────────────────────────────
function buildContentGapPrompt(data: AgencyData): string {
  const activeCreators = data.creators.filter(c => normalize(c.status) === 'active');
  const plansByCreator: Record<string, number> = {};
  for (const p of data.contentPlans) {
    const name = p.creators?.name || 'Unknown';
    plansByCreator[name] = (plansByCreator[name] || 0) + 1;
  }

  return `Content gap detection for "${data.agency?.name}".

CREATORS & PLANS:
${activeCreators.map(c => `${c.name}: ${plansByCreator[c.name] || 0} plans`).join('\n') || 'None'}

OVERDUE TASKS:
${data.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && normalize(t.status) !== 'done').slice(0, 8).map(t => `"${t.title}" due ${t.due_date}`).join('\n') || 'None'}

Respond JSON array:
[{"action":"create_alert","severity":"warning","title":"...","message":"...","alert_type":"content_gap"},
{"action":"create_task","title":"...","description":"...","priority":"High"}]
If pipeline healthy, return [].`;
}

// ─── Workflow: Shift Optimization ──────────────────────────────────
function buildShiftOptimizationPrompt(data: AgencyData): string {
  const today = new Date().toISOString().split('T')[0];
  const todayShifts = data.shifts.filter(s => s.shift_start?.startsWith(today));
  const coverage = { night: 0, day: 0, evening: 0 };
  for (const s of todayShifts) {
    const h = new Date(s.shift_start).getHours();
    if (h < 8) coverage.night++; else if (h < 16) coverage.day++; else coverage.evening++;
  }

  return `Shift optimization for "${data.agency?.name}".
TODAY: Night=${coverage.night}, Day=${coverage.day}, Evening=${coverage.evening}
CHATTERS: ${[...new Set(data.shifts.map(s => s.chatters?.name))].filter(Boolean).join(', ') || 'None'}

Respond JSON array:
[{"action":"create_alert","severity":"warning","title":"...","message":"...","alert_type":"shift_gap"}]
If coverage adequate, return [].`;
}

// ─── Workflow: Fan Re-engagement ───────────────────────────────────
function buildFanReengagementPrompt(data: AgencyData): string {
  const byCreator: Record<string, any[]> = {};
  for (const e of data.earnings) {
    const name = e.creators?.name || 'Unknown';
    if (!byCreator[name]) byCreator[name] = [];
    byCreator[name].push(e);
  }

  const analysis = Object.entries(byCreator).map(([name, records]) => {
    const tips = records.slice(0, 3).map(r => r.tips || 0);
    const msgs = records.slice(0, 3).map(r => r.messages_revenue || 0);
    return `${name}: tips=[${tips}], msgs=[${msgs}], subs=$${records[0]?.subscriptions || 0}`;
  }).join('\n');

  return `Fan re-engagement for "${data.agency?.name}".

REVENUE (last 3 periods):
${analysis || 'No data'}

Respond JSON array:
[{"action":"create_alert","severity":"info","title":"...","message":"...","alert_type":"fan_reengagement"},
{"action":"create_task","title":"...","description":"...","priority":"Medium"}]
If healthy, return [].`;
}

// ─── Action Executors ──────────────────────────────────────────────
async function executeActions(supabase: any, agencyId: string, runId: string, actions: any[], existingAlertTitles: Set<string>): Promise<number> {
  // Auto-dismiss stale alerts (> 7 days)
  await supabase.from('ai_performance_alerts').update({ is_dismissed: true })
    .eq('agency_id', agencyId).eq('is_dismissed', false)
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  let count = 0;
  for (const action of actions) {
    try {
      // Deduplication: skip alerts with same title as existing
      if (action.action === 'create_alert' && existingAlertTitles.has(action.title?.toLowerCase())) {
        console.log(`Skipping duplicate alert: "${action.title}"`);
        continue;
      }

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
    // Briefings are recorded as agent actions; the previous felix_briefings table is deprecated.
    await supabase.from('agent_actions').insert({
      run_id: runId, agency_id: agencyId, action_type: 'generate_briefing',
      parameters: {
        briefing_date: new Date().toISOString().split('T')[0],
        summary: briefing.summary || 'Daily briefing.',
        key_metrics: briefing.key_metrics || {},
        alerts: briefing.alerts || [],
        recommendations: briefing.recommendations || [],
      },
      outcome: 'success',
    });
    return 1;
  } catch (err) { console.error('Briefing error:', err); return 0; }
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

        // Skip agencies with no meaningful data
        if (data.creators.length === 0 && data.employees.length === 0 && data.tasks.length === 0) {
          await supabase.from('agent_runs').update({
            status: 'completed', actions_taken: 0, duration_ms: Date.now() - startTime,
            completed_at: new Date().toISOString(),
            data_snapshot: { skipped: true, reason: 'no_data' },
          }).eq('id', run.id);
          results.push({ agency: agency.name, status: 'skipped', reason: 'no_data' });
          continue;
        }

        const prompt = WORKFLOWS[agentType](data);
        const parsed = await aiJSON(
          'You are an AI operations agent. Respond with ONLY valid JSON.',
          prompt,
          { model: 'google/gemini-2.5-flash', temperature: 0.3 }
        );

        // Build existing alert titles for deduplication
        const existingAlertTitles = new Set((data.alerts || []).map((a: any) => (a.title || '').toLowerCase()));

        let actionsCount = 0;
        if (agentType === 'briefing') {
          actionsCount = await executeBriefing(supabase, agency.id, run.id, parsed);
        } else {
          const actions = Array.isArray(parsed) ? parsed : [];
          actionsCount = await executeActions(supabase, agency.id, run.id, actions, existingAlertTitles);
        }

        const duration = Date.now() - startTime;
        await supabase.from('agent_runs').update({
          status: 'completed', actions_taken: actionsCount, duration_ms: duration,
          completed_at: new Date().toISOString(),
          data_snapshot: { creators: data.creators.length, employees: data.employees.length, earnings: data.earnings.length },
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
