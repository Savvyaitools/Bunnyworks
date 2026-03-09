

## Problem

The dashboard revenue query is **failing silently** because `extracted_data.creator_id` does not exist as a column. The query to `extracted_data` throws a 400 error, which causes the entire `revenueData` query to reject -- meaning **all** revenue stats (Total Revenue, Agency Earnings, Creator Breakdown, Revenue Source Breakdown) show as $0.

The `creator_earnings` data is actually returning fine (4 rows with real amounts like $8,711, $1,570, etc.), but the subsequent `extracted_data` error kills the whole Promise chain.

## Root Cause

In `src/pages/Index.tsx` lines 186-193, the code queries `extracted_data` with `.in("creator_id", creatorIds)`, but `extracted_data` table has no `creator_id` column. This throws `{"code":"42703","message":"column extracted_data.creator_id does not exist"}`.

The `if (extractedError) throw extractedError;` on line 192 then aborts the entire `queryFn`.

## Fix

Two changes in `src/pages/Index.tsx`:

1. **Wrap the `extracted_data` query in a try/catch** so it fails gracefully -- the gross data from `extracted_data` is supplementary, not critical. The dashboard should still show net revenue and per-creator breakdowns from `creator_earnings`.

2. **Same fix in `RevenueChart.tsx`** (lines 40-50) which has the identical broken `extracted_data` query with `.filter("creator_id", "in", ...)`.

No database migration needed -- the `extracted_data` table simply doesn't have this column, and the gross revenue calculation already has a fallback path (estimate gross from net using commission rate).

## Scope

- `src/pages/Index.tsx` -- wrap extracted_data query in try/catch, log warning instead of throwing
- `src/components/dashboard/RevenueChart.tsx` -- same fix

