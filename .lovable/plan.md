

# Remove Live Debug Link + Show Login Status in Saved Sessions

## Changes

### 1. Remove Browserbase "Live" link from the Status column

The `<a>` tag that renders the "Live" link (pointing to `browserbase_live_url`) will be removed from `BrowserSessionsDashboard.tsx`. This eliminates exposure of the Browserbase branding and external URL. Only the status badge will remain in that column.

**Lines affected:** 142-153 in `BrowserSessionsDashboard.tsx` -- delete the entire `{link.browserbase_live_url && (...)}` block.

Also remove the `ExternalLink` icon from the lucide-react import since it will no longer be used.

### 2. Add a "Login Saved" visual indicator

The `session_status` field already tracks whether credentials have been saved (`authenticated`). The existing `statusBadge()` function handles this. Current data shows 4 creators with saved logins:

| Creator | Alias | Platform | Status | Last Saved |
|---------|-------|----------|--------|------------|
| Gisel | Gkortan2 | OnlyFans | Authenticated | Feb 18 |
| Addison Weems | blondebabyadds | OnlyFans | Authenticated | Feb 18 |
| Suni | -- | OnlyFans | Authenticated | Feb 15 |
| Shelby | -- | OnlyFans | Authenticated | Feb 13 |

All 4 creators currently have authenticated (login saved) sessions. The green "Authenticated" badge already indicates this clearly -- no additional UI is needed.

## Technical Details

**File:** `src/components/browser/BrowserSessionsDashboard.tsx`

- Remove lines 142-153 (the `browserbase_live_url` link block)
- Remove `ExternalLink` from the lucide-react import (line 10)
- Keep `statusBadge()` as-is -- it already clearly shows login status

This is a small, safe UI cleanup with no backend changes needed.

