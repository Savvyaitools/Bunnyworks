

# Lock Platform Access Feature (Whitelist: Testing26@gmail.com)

## What Changes

1. **`src/components/layout/AppSidebar.tsx`** — Add a `locked` flag to the Platform Access nav item. When the logged-in user's email is NOT `testing26@gmail.com` (case-insensitive), show a lock icon instead of the Globe icon, apply disabled styling (opacity, cursor), and prevent navigation (use `onClick` with `e.preventDefault()` + toast "Feature locked").

2. **`src/components/layout/MobileBottomNav.tsx`** — Same lock treatment for the Platform Access item in the mobile hamburger menu.

3. **`src/pages/BrowserSync.tsx`** — Add an access guard at the top of the component: check `useAuth()` profile email. If not `testing26@gmail.com`, render a full-page locked state (lock icon + "This feature is restricted" message) instead of the normal tabs/content.

4. **`src/routes/routeConfig.tsx`** — No route removal needed; the page-level guard in BrowserSync.tsx handles it.

## Technical Details

- Use `useAuth()` hook to get `profile?.email` and `user?.email`
- Whitelist check: `const isUnlocked = profile?.email?.toLowerCase() === 'testing26@gmail.com'`
- Sidebar: modify `NavSection` to accept a `lockedUrls` set; for locked items, swap icon to `Lock`, add `opacity-50 cursor-not-allowed` classes, prevent click
- BrowserSync page: early return with a centered Card showing Lock icon + "Feature Locked" heading + "Contact admin for access" message
- Import `Lock` from `lucide-react` where needed

