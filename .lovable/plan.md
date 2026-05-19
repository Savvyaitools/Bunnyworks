## Problem

When connecting a creator account, the `of-connect-account` edge function fails with:

```
TypeError: supabase.auth.getClaims is not a function
```

The installed Supabase JS version (`@supabase/supabase-js@2.45.0`) does not expose `getClaims()` — that API only exists in newer SDK versions (2.50+).

## Fix

Update `supabase/functions/of-connect-account/index.ts` to authenticate using the supported API on the pinned SDK:

- Replace `supabase.auth.getClaims(token)` with `supabase.auth.getUser(token)`.
- Treat `error || !data?.user` as unauthorized.
- Keep the rest of the function (creator lookup, OnlyFansAPI calls, upsert) unchanged.

This restores the auth check using the method that exists in `@supabase/supabase-js@2.45.0`, which is what every other working edge function in this project already uses.

## Verification

- Retry the creator account connection flow from the UI.
- Confirm no `getClaims is not a function` entries in the function logs.
