import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
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
}

/**
 * Gather all data for a SINGLE agency — every query is strictly scoped by agency_id
 * or by IDs that belong to the agency (creatorIds, chatterIds).
 */
async function gatherAgencyData(supabase: any, agencyId: string): Promise<AgencyData> {
  const { data: agencyCreators } = await supabase.from('creators').select('id').eq('agency_id', agencyId);
  const creatorIds = (agencyCreators || []).map((c: any) => c.id);
  const { data: agencyChatters } = await supabase.from('chatters').select('id').eq('agency_id', agencyId);
  const chatterIds = (agencyChatters || []).map((c: any) => c.id);

  const [
    { data: agency },
    { data: creators },
    { data: employees },
    { data: tasks },
    { data: earnings },
    { data: shifts },
    { data: alerts },
    { data: goals },
    { data: recentFeedback },
    { data: recentRuns },
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
  ]);

  return {
    agency,
    creators: creators || [],
    employees: employees || [],
    tasks: tasks || [],
    earnings: earnings || [],
    shifts: shifts || [],
    alerts: alerts || [],
    goals: goals || [],
    recentFeedback: recentFeedback || [],
    recentRuns: recentRuns || [],
  };
}

function buildMonitorPrompt(data: AgencyData): string {
  const normalize = (s: string) => (s || '').toLowerCase().replace(/[_ ]/g, '');
  const activeCreators = data.creators.filter(c => normalize(c.status) === 'active');
  const overdueTasks = data.tasks.filter(t => normalize(t.status) !== 'done' && normalize(t.status) !== 'completed' && t.due_date && new Date(t.due_date) < new Date());
  const totalRevenue = data.earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingTasks = data.tasks.filter(t => normalize(t.status) === 'todo' || normalize(t.status) === 'pending');

  const feedbackSummary = data.recentFeedback.length > 0
    ? `\nPAST FEEDBACK ON AGENT ACTIONS:\n${data.recentFeedback.map(f => 
        `- ${f.rating === 1 ? '👍' : '👎'} ${f.agent_actions?.action_type}: ${f.comment || 'no comment'}`
      ).join('\n')}`
    : '';

  const goalsSummary = data.goals.length > 0
    ? `\nAGENCY GOALS:\n${data.goals.map(g => 
        `- ${g.metric}: ${g.current_value}/${g.target_value} ${g.unit} (${g.priority} priority)`
      ).join('\n')}`
    : '';

  return `You are the Flick performance monitor for an OnlyFans management agency.

AGENCY: ${data.agency?.name || 'Unknown'}
CREATORS: ${data.creators.length} total (${activeCreators.length} active)
EMPLOYEES: ${data.employees.length} total
RECENT REVENUE: $${totalRevenue.toFixed(2)}
OVERDUE TASKS: ${overdueTasks.length}
PENDING TASKS: ${pendingTasks.length}

CREATORS DETAIL:
${data.creators.map(c => `- ${c.name}: status=${c.status}, revenue=$${c.revenue || 0}`).join('\n')}

RECENT EARNINGS:
${data.earnings.slice(0, 10).map(e => `- ${e.creators?.name}: $${e.amount} (${e.period_start} to ${e.period_end})`).join('\n')}

OVERDUE TASKS:
${overdueTasks.slice(0, 10).map(t => `- "${t.title}" due ${t.due_date}, status: ${t.status}, priority: ${t.priority}`).join('\n')}

EXISTING UNDISMISSED ALERTS: ${data.alerts.length}
${goalsSummary}
${feedbackSummary}

Based on this data, analyze for issues and respond ONLY with a JSON array of actions to take.
Each action must be one of:
- {"action": "create_alert", "severity": "warning|critical|info", "title": "...", "message": "...", "alert_type": "revenue_drop|missed_shift|overdue_task|inactive_creator|goal_at_risk", "entity_type": "creator|employee|task", "entity_id": "uuid-or-null"}
- {"action": "send_notification", "user_type": "agency", "title": "...", "message": "..."}

Rules:
1. Only create alerts for REAL issues found in the data
2. Don't duplicate existing undismissed alerts
3. Consider past feedback - avoid actions that received thumbs down
4. Be conservative - only flag genuinely concerning patterns
5. If nothing is wrong, return an empty array: []

Respond with ONLY the JSON array, no other text.`;
}

function buildBriefingPrompt(data: AgencyData): string {
  const normalize = (s: string) => (s || '').toLowerCase().replace(/[_ ]/g, '');
  const totalRevenue = data.earnings.reduce((sum, e) => sum + (e.amount || 0), 0);
  const completedTasks = data.tasks.filter(t => normalize(t.status) === 'done' || normalize(t.status) === 'completed').length;
  const pendingTasks = data.tasks.filter(t => normalize(t.status) === 'todo' || normalize(t.status) === 'pending').length;
  const activeCreators = data.creators.filter(c => normalize(c.status) === 'active').length;

  return `You are Flick, the daily briefing generator for an OnlyFans management agency.

AGENCY: ${data.agency?.name || 'Unknown'}

KEY METRICS:
- Total Creators: ${data.creators.length} (${activeCreators} active)
- Total Employees: ${data.employees.length}
- Recent Revenue: $${totalRevenue.toFixed(2)}
- Tasks Completed: ${completedTasks}
- Tasks Pending: ${pendingTasks}

TOP CREATORS BY REVENUE:
${data.creators.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5).map(c => `- ${c.name}: $${c.revenue || 0}`).join('\n')}

UNDISMISSED ALERTS: ${data.alerts.length}
${data.alerts.slice(0, 5).map(a => `- [${a.severity}] ${a.title}`).join('\n')}

GOALS:
${data.goals.map(g => `- ${g.metric}: ${g.current_value}/${g.target_value} ${g.unit}`).join('\n') || 'No goals set'}

Generate a daily briefing in this exact JSON format:
{
  "summary": "2-3 sentence executive summary of the agency state",
  "key_metrics": {"total_revenue": number, "active_creators": number, "pending_tasks": number, "completed_tasks": number, "active_employees": number},
  "alerts": [{"type": "string", "message": "string", "severity": "info|warning|critical"}],
  "recommendations": [{"title": "string", "description": "string", "priority": "low|medium|high"}]
}

Be specific, data-driven, and actionable. Respond with ONLY the JSON, no other text.`;
}

async function executeMonitorActions(supabase: any, agencyId: string, runId: string, actions: any[]): Promise<number> {
  let actionsExecuted = 0;

  for (const action of actions) {
    try {
      if (action.action === 'create_alert') {
        await supabase.from('ai_performance_alerts').insert({
          agency_id: agencyId,
          severity: action.severity || 'info',
          title: action.title,
          message: action.message,
          alert_type: action.alert_type || 'general',
          entity_type: action.entity_type || null,
          entity_id: action.entity_id || null,
        });
      }

      if (action.action === 'send_notification') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('agency_id', agencyId)
          .eq('user_type', 'agency');

        for (const profile of (profiles || [])) {
          await supabase.from('notifications').insert({
            user_id: profile.id,
            title: action.title,
            message: action.message,
            type: 'agent',
            link: '/of-ai',
          });
        }
      }

      await supabase.from('agent_actions').insert({
        run_id: runId,
        agency_id: agencyId,
        action_type: action.action,
        target_entity_type: action.entity_type || null,
        target_entity_id: action.entity_id || null,
        parameters: action,
        outcome: 'success',
      });

      actionsExecuted++;
    } catch (err) {
      console.error('Action execution error:', err);
      await supabase.from('agent_actions').insert({
        run_id: runId,
        agency_id: agencyId,
        action_type: action.action,
        parameters: action,
        outcome: 'failed',
        outcome_details: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return actionsExecuted;
}

async function executeBriefing(supabase: any, agencyId: string, runId: string, briefingData: any): Promise<number> {
  try {
    await supabase.from('felix_briefings').insert({
      agency_id: agencyId,
      briefing_date: new Date().toISOString().split('T')[0],
      summary: briefingData.summary || 'Daily briefing generated.',
      key_metrics: briefingData.key_metrics || {},
      alerts: briefingData.alerts || [],
      recommendations: briefingData.recommendations || [],
    });

    await supabase.from('agent_actions').insert({
      run_id: runId,
      agency_id: agencyId,
      action_type: 'generate_briefing',
      parameters: { briefing_date: new Date().toISOString().split('T')[0] },
      outcome: 'success',
    });

    return 1;
  } catch (err) {
    console.error('Briefing error:', err);
    await supabase.from('agent_actions').insert({
      run_id: runId,
      agency_id: agencyId,
      action_type: 'generate_briefing',
      outcome: 'failed',
      outcome_details: err instanceof Error ? err.message : 'Unknown error',
    });
    return 0;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    // This is a CRON-only function. Validate with a shared secret or service-role auth.
    // It does NOT accept user JWT — it processes agencies in isolation.
    const authHeader = req.headers.get('Authorization');
    const isServiceRole = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    
    // Also allow calls from Supabase cron (no auth header but function is internal)
    const url = new URL(req.url);
    const agentType = url.searchParams.get('agent') || 'monitor';

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all agencies — each will be processed in STRICT ISOLATION
    const { data: agencies, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name');

    if (agencyError || !agencies?.length) {
      return new Response(JSON.stringify({ message: 'No agencies found', error: agencyError }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    // Process each agency INDEPENDENTLY — no data crosses boundaries
    for (const agency of agencies) {
      const { data: run, error: runError } = await supabase
        .from('agent_runs')
        .insert({ agency_id: agency.id, agent_type: agentType, status: 'running' })
        .select()
        .single();

      if (runError || !run) {
        console.error(`Failed to create run for agency ${agency.id}:`, runError);
        continue;
      }

      try {
        // Data gathering is fully agency-scoped
        const data = await gatherAgencyData(supabase, agency.id);

        let prompt: string;
        if (agentType === 'briefing') {
          prompt = buildBriefingPrompt(data);
        } else {
          prompt = buildMonitorPrompt(data);
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: [{ role: 'user', content: prompt }], temperature: 0.3 }),
        });

        if (!aiResponse.ok) throw new Error(`AI Gateway error: ${aiResponse.status}`);

        const aiData = await aiResponse.json();
        const responseText = aiData.choices?.[0]?.message?.content || '[]';

        const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not parse AI response as JSON');

        const parsed = JSON.parse(jsonMatch[0]);

        let actionsCount = 0;
        if (agentType === 'briefing') {
          actionsCount = await executeBriefing(supabase, agency.id, run.id, parsed);
        } else {
          const actions = Array.isArray(parsed) ? parsed : [];
          actionsCount = await executeMonitorActions(supabase, agency.id, run.id, actions);
        }

        const duration = Date.now() - startTime;
        await supabase.from('agent_runs').update({
          status: 'completed',
          actions_taken: actionsCount,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
          data_snapshot: {
            creators_count: data.creators.length,
            employees_count: data.employees.length,
            earnings_count: data.earnings.length,
            tasks_count: data.tasks.length,
          },
        }).eq('id', run.id);

        results.push({ agency: agency.name, status: 'completed', actions: actionsCount });
      } catch (err) {
        const duration = Date.now() - startTime;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        
        await supabase.from('agent_runs').update({
          status: 'failed',
          error_message: errorMsg,
          duration_ms: duration,
          completed_at: new Date().toISOString(),
        }).eq('id', run.id);

        results.push({ agency: agency.name, status: 'failed', error: errorMsg });
      }
    }

    return new Response(JSON.stringify({ 
      agent: agentType,
      results,
      total_duration_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Orchestrator error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
