

## Problem

The Fan Analytics creator filter is broken due to a **data type mismatch**:

- The dropdown sends the **creator UUID** (e.g. `0d4f17bd-35be-4a79-982d-dede7ec87786`)
- The `of_fans` table stores **platform account IDs** in `of_account_id` (e.g. `acct_109b8f228a6d4a5cb908cc9e8535ff16`)
- These never match, so per-creator filtering always returns empty results

The same issue affects `of_chats` filtering and `tracking_links` (which uses `creator_id` correctly).

There is no direct mapping table between `creators.id` and `of_account_id` in the current schema. The `of_fans` table has no `creator_id` column.

## Solution

**Add a `creator_id` column to `of_fans` and `of_chats`** (if not already present), or look up the mapping at query time. The cleanest approach:

1. **Database migration**: Add a `creator_id UUID` column to `of_fans` and `of_chats` tables, with a foreign key to `creators.id`. Backfill existing rows if a mapping exists.

2. **Update `FanAnalytics.tsx`**: Change the creator filter to use `creator_id` instead of `of_account_id` for all three queries (fans, chats, tracking links).

Alternatively, if we want to avoid schema changes, we can:
- First fetch the creator's linked `of_account_id` values from a mapping source
- Then filter `of_fans`/`of_chats` using those account IDs

Since `of_fans` already has `of_account_id` values but no direct `creator_id`, the quickest fix is to **resolve the mapping in the query** by:
1. Looking up which `of_account_id` values belong to each creator (via `creator_session_links` or another mapping)
2. Filtering by those account IDs when a creator is selected

### Changes

**`src/pages/FanAnalytics.tsx`**:
- When a creator is selected, first resolve their `of_account_id` values from `creator_session_links` or the data itself
- Use those resolved IDs in the `.in("of_account_id", accountIds)` filter for fans and chats queries
- Keep `tracking_links` filter as-is (it correctly uses `creator_id`)

### Technical detail

We need a lookup step. Options:
- **Option A**: Query `creator_session_links` to get the mapping (but it doesn't store `of_account_id` in that format)
- **Option B**: Add a `creator_id` column to `of_fans` and `of_chats` via migration, then update the filter

Option B (migration + code fix) is the cleanest long-term solution. We'll:
1. Add `creator_id` column to `of_fans` and `of_chats`
2. Update the fan/chat ingestion code to populate `creator_id`
3. Update `FanAnalytics.tsx` to filter on `creator_id`

