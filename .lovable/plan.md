

# AI Agent System for Creator OS

## Overview
Build an autonomous AI agent layer that proactively monitors your agency, detects issues, takes corrective actions, and learns from outcomes -- transforming FELIX and IZZY from reactive chatbots into a self-improving "nervous system" for Creator OS.

## Current State
- **FELIX**: Reactive chatbot -- answers questions when asked, no proactive behavior
- **IZZY**: Suggestion engine -- generates replies on demand, no learning loop
- **Database**: Already has `ai_performance_alerts`, `felix_briefings`, `ai_suggestions_log` tables (unused)
- **pg_cron**: Active with 2 jobs (import retries, earnings sync) -- ready for agent scheduling
- **Lovable AI Gateway**: Already integrated, using Gemini 3 Flash

## What Will Be Built

### Phase 1: Agent Orchestrator (Core Engine)

A new edge function `ai-agent-orchestrator` that runs on a schedule and acts as the central brain. It:
1. Gathers all agency data (revenue, tasks, shifts, KPIs)
2. Compares against historical baselines and goals
3. Sends the data to the AI model with tool-calling to get structured decisions
4. Executes the decisions (create alerts, assign tasks, send notifications)
5. Logs everything for learning

### Phase 2: Database Schema (Agent Memory)

New tables to give agents persistent memory and tracking:

- **`agent_runs`** -- Logs every agent execution (timestamp, agency_id, agent_type, actions_taken, data_snapshot, duration_ms)
- **`agent_actions`** -- Individual actions taken by agents (run_id, action_type, target_entity, parameters, outcome, was_overridden)
- **`agent_goals`** -- Configurable goals per agency (metric, target_value, current_value, priority)
- **`agent_feedback`** -- Owner feedback on agent actions (action_id, rating, comment) for the learning loop

### Phase 3: Three Specialized Agents

Each agent is a mode within the orchestrator edge function:

**Agent 1: Performance Monitor ("Sentinel")**
- Runs every 4 hours via pg_cron
- Detects: revenue drops, missed shifts, overdue tasks, inactive creators
- Actions: Creates `ai_performance_alerts`, sends notifications, auto-assigns urgent tasks
- Writes structured alerts to the existing `ai_performance_alerts` table

**Agent 2: Daily Briefing Generator ("Herald")**
- Runs once daily at 7 AM via pg_cron
- Generates a comprehensive daily briefing using AI
- Stores in the existing `felix_briefings` table
- Surfaces on the dashboard as a dismissible card

**Agent 3: IZZY Learning Loop ("Scholar")**
- Runs nightly via pg_cron
- Analyzes `ai_suggestions_log` data: which suggestions were selected, edited, or led to sales
- Updates the `ai_knowledge_base` with new patterns
- Adjusts confidence scoring weights over time

### Phase 4: Agent Dashboard UI

A new page at `/agent-hub` showing:
- Agent status cards (last run, next run, actions taken today)
- Recent alerts and briefings timeline
- Agent goals with progress bars
- Action log with approve/dismiss/feedback controls
- Toggle to enable/disable individual agents

### Phase 5: Feedback and Learning Loop

- Each agent action appears in the dashboard with thumbs up/down buttons
- Owner feedback is stored in `agent_feedback`
- The orchestrator reads past feedback before making decisions
- Over time, the system learns what the owner considers good vs bad actions

## Architecture

```text
pg_cron (scheduler)
  |
  |--> Every 4hrs --> ai-agent-orchestrator?agent=sentinel
  |--> Daily 7AM  --> ai-agent-orchestrator?agent=herald  
  |--> Nightly    --> ai-agent-orchestrator?agent=scholar
  |
  v
Edge Function: ai-agent-orchestrator
  |
  |--> 1. Load agency data from DB
  |--> 2. Load agent memory (past runs, feedback)
  |--> 3. Call Lovable AI with tool-calling
  |       Tools: create_alert, assign_task, send_notification, update_goal
  |--> 4. Execute returned tool calls against DB
  |--> 5. Log run + actions to agent_runs / agent_actions
  |
  v
Dashboard: /agent-hub
  |
  |--> View alerts, briefings, action log
  |--> Provide feedback (thumbs up/down)
  |--> Configure goals and thresholds
  |--> Enable/disable agents
```

## Implementation Order

1. **Database migration** -- Create `agent_runs`, `agent_actions`, `agent_goals`, `agent_feedback` tables with RLS policies
2. **Edge function** -- Build `ai-agent-orchestrator` with Sentinel agent first
3. **pg_cron job** -- Schedule Sentinel to run every 4 hours
4. **Dashboard page** -- Build `/agent-hub` with alerts feed and action log
5. **Herald agent** -- Add daily briefing generation mode
6. **Briefing widget** -- Add briefing card to the main dashboard
7. **Scholar agent** -- Add IZZY learning loop mode
8. **Feedback system** -- Add thumbs up/down on actions, wire into agent context
9. **Goals UI** -- Let owners set goals that agents optimize toward

## New Files
```text
supabase/functions/ai-agent-orchestrator/index.ts
src/pages/AgentHub.tsx
src/components/agents/AgentStatusCard.tsx
src/components/agents/AlertsFeed.tsx
src/components/agents/ActionLog.tsx
src/components/agents/GoalProgress.tsx
src/components/agents/DailyBriefingCard.tsx
src/hooks/useAgentRuns.ts
src/hooks/useAgentAlerts.ts
src/hooks/useAgentGoals.ts
```

## Modified Files
```text
src/App.tsx                          -- Add /agent-hub route
src/components/layout/AppSidebar.tsx -- Add Agent Hub sidebar link
src/pages/Index.tsx                  -- Add daily briefing card widget
supabase/config.toml                 -- Register ai-agent-orchestrator function
```

## Security
- Agent orchestrator uses service role key (server-side only)
- All agent tables have RLS policies scoped to agency_id
- Agents cannot modify auth, billing, or cross-agency data
- All actions are logged and auditable
- Owner can disable any agent at any time

