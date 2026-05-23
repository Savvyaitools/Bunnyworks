# Fix recurring 7-day error log noise

## What the logs actually show

Three log sources scanned for the last 7 days:

| Source | Errors found | Root cause |
| --- | --- | --- |
| Edge function HTTP logs | 1 entry — `POST /functions/v1/cron-scrape-earnings → 404` | Cron jobs call an edge function that no longer exists |
| Postgres logs | 1 entry — `relation "active_browser_sessions" does not exist` | Cron job queries a dropped table |
| Auth logs | `refresh_token_not_found` (400) and one `bad_jwt` (403) on `/logout` | Benign — stale browser refresh tokens, not a server bug |

The edge-function `cron-of-sync` and `ai-agent-orchestrator` runtime logs are clean (only `info` lines, no errors).

## Root cause

`cron.job` table contains 4 active jobs that point at deleted resources:

- **Job 3** (every 10 min) — `UPDATE active_browser_sessions ...` → table dropped, throws Postgres ERROR every 10 minutes.
- **Job 6** (every 6 h) — POSTs `cron-scrape-earnings` with `{"mode":"enqueue"}` → 404.
- **Job 7** (every 10 min) — POSTs `cron-scrape-earnings` with `{"mode":"work"}` → 404, ~144 times/day.
- **Job 8** (daily 03:00) — POSTs `cron-scrape-earnings` with `{"mode":"cleanup"}` → 404.

The `cron-scrape-earnings` edge function does not exist in `supabase/functions/`. Per the project memory ("Database Maintenance — unscheduled phantom jobs"), these are leftovers from a previous architecture.

## Fix

Single migration that unschedules the 4 phantom jobs. The code can stay; we just stop scheduling work that has nowhere to land.

```sql
SELECT cron.unschedule(3);  -- active_browser_sessions cleanup
SELECT cron.unschedule(6);  -- cron-scrape-earnings enqueue
SELECT cron.unschedule(7);  -- cron-scrape-earnings work
SELECT cron.unschedule(8);  -- cron-scrape-earnings cleanup
```

All other cron jobs (sync-social-stats, ai-agent-orchestrator agents, cron-of-sync) point at functions that exist and return 200 — leave them alone.

## Not fixing (intentional)

- **Auth `refresh_token_not_found` / `bad_jwt`** — these are client-side stale tokens from users who haven't reloaded; `main.tsx` already has unregister logic. No server change needed.
- **`Skipping duplicate alert: ...`** in `ai-agent-orchestrator` — these are `info` logs, not errors; the dedup logic is working as designed.

## Verification

After the migration:
1. Re-query `cron.job_run_details` for the last hour — no new failures for jobids 3/6/7/8.
2. Re-run the edge-log query — no new 404s on `cron-scrape-earnings`.
3. Re-run the postgres-log query — no new `active_browser_sessions does not exist` ERRORs.
