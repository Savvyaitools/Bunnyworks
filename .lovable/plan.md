

# Investigation Results: Backend Errors

## Findings

Three categories of issues are generating recurring errors in the database logs:

### 1. Ghost Cron Jobs Calling Missing Functions (ERROR — every few minutes)
Two cron jobs reference database functions that **do not exist**:

| Cron Job (ID) | Schedule | Calls | Status |
|---|---|---|---|
| `mark-overdue-items-incomplete` (#4) | Every 15 min | `public.move_overdue_to_incomplete()` | **MISSING** — errors every 15 min |
| `refresh-dashboard-stats` (#5) | Every 5 min | `public.refresh_dashboard_stats()` | **MISSING** — errors every 5 min |

These are generating **hundreds of Postgres ERROR logs per day**. The dashboard stats hook already has a fallback (individual queries), so no user-facing breakage — but it pollutes logs and wastes resources.

### 2. Ghost Cron Jobs Calling Missing Edge Functions
Two cron jobs call edge functions that **do not exist** in the codebase:

| Cron Job (ID) | Calls | Status |
|---|---|---|
| `auto-retry-stuck-imports` (#1) | `auto-retry-imports` edge function | **NOT DEPLOYED** — runs every minute |
| `sync-onlyfans-earnings-daily` (#2) | `sync-onlyfans-earnings` edge function | **NOT DEPLOYED** — no logs at all |

These silently fail with no visible errors but waste network calls.

### 3. Missing Materialized View
The `agency_dashboard_stats` materialized view doesn't exist. The dashboard hook's fallback fires individual queries every time, which works but is slower than intended.

---

## Plan

### Step 1: Drop the 4 orphaned cron jobs
Create a migration to remove cron jobs #1, #2, #4, and #5 since their targets don't exist:
```sql
SELECT cron.unschedule('auto-retry-stuck-imports');
SELECT cron.unschedule('sync-onlyfans-earnings-daily');
SELECT cron.unschedule('mark-overdue-items-incomplete');
SELECT cron.unschedule('refresh-dashboard-stats');
```

### Step 2: Create the materialized view + refresh function (optional)
If desired, create `agency_dashboard_stats` as a proper materialized view and `refresh_dashboard_stats()` function, then re-enable the cron job. Otherwise, the fallback queries work fine and we just leave it removed.

### Step 3: Verify remaining cron jobs are healthy
The remaining 7 cron jobs (#3, #6-#12) all reference valid targets. No action needed.

**Impact**: Eliminates ~400+ daily Postgres errors and ~1,440 wasted HTTP calls/day from the ghost cron jobs.

