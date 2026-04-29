## Problem

The `/dashboard` page (`src/pages/Index.tsx`) currently renders a 3D "Ops Room" scene loaded from `/public/ops-room/bundle.js`. On top of it sits a custom `CarouselNav` (Prev / `AI Agents | Dashboard | Leaderboard` tabs / Next) that toggles between three side panels by mutating inline styles inside the bundle's DOM. The bundle also injects a circular AI-assistant/avatar element inside the scene.

Reported issues:
1. The bottom carousel navigation does not work properly — its left/right cycling depends on style-injection into a third-party bundle and silently breaks when the bundle re-renders.
2. The round chat / avatar "thing" inside the dashboard is unwanted.

The earlier "black gap on the right" fix patched the 3D bundle's container size but left these two issues.

## Goal

Make `/dashboard` a real, working dashboard that uses the existing app sidebar layout — no 3D bundle, no DOM-mutating carousel, no floating round chat button.

## Scope of changes

**File: `src/pages/Index.tsx`** — full rewrite.

Remove:
- All ops-room bundle injection (`injectOpsRoomBundle`, `ensureOpsRoomAssets`, the `useEffect` that loads `/ops-room/bundle.js` and the Orbitron/JetBrains font link).
- The `MutationObserver` that walks text nodes and rewrites dummy strings.
- The `findPanels` / `focusSlot` / `cycleSlot` / `CarouselNav` block (the broken bottom navigation).
- The `<style>` override for `#opsroom-root`.
- The full-bleed black container (`-m-5 lg:-m-8 xl:-mx-10`, `height: calc(100dvh - 1rem)`, custom background image). This is what created the right-side black gap and forced the carousel.

Keep the data hooks already wired:
- `useDashboardStats()` for active creators / team members / etc.
- `useAgency()` + the existing `creator_earnings` query for current-month net + agency cut.

Replace the page body with a normal in-layout dashboard composed of components that already exist in `src/components/dashboard/`:

```text
DashboardLayout
└── space-y-6
    ├── Header (greeting, agency name, current month)
    ├── KPI row (4x StatCard): Net Revenue MTD · Agency Cut MTD · Active Creators · Team Members
    ├── 2-col grid (lg)
    │   ├── RevenueChart
    │   └── CreatorEarningsBreakdown
    ├── 2-col grid (lg)
    │   ├── DashboardTasks
    │   └── LiveActivityFeed
    └── DashboardAIInsights (full width)
```

Use `StatCard` from `src/components/shared/StatCard.tsx` (same one PortalDashboard uses) with `formatCurrency` from `@/lib/formatters`. All four KPIs read from the existing `stats` and `revenue` query results — no new hooks needed.

The page renders inside `<DashboardLayout>` with the standard `p-5 lg:p-8 xl:px-10` padding (already provided by the layout), so the right-side gap disappears naturally and the sidebar/`MobileBottomNav` keep working.

**Removal of the round chat element**

The circular chat/avatar is rendered by `/public/ops-room/bundle.js`. Once `Index.tsx` stops loading that bundle, the element disappears for free — no other component in the app mounts it (verified: only `CoachPBF.tsx` imports `FelixChat`, which is unrelated and lives on its own route).

No other files need to change. `useDashboardStats`, `useAgency`, `DashboardLayout`, `AppSidebar`, and the `dashboard/*` components are already in place.

## Out of scope

- Keeping the 3D Ops Room as an optional view. If you want it back later as a separate `/ops-room` route we can add it, but it is removed from `/dashboard`.
- Deleting `public/ops-room/*` files from disk (left in place; just no longer referenced).
- Any change to the sidebar, mobile bottom nav, or other routes.

## Acceptance

- Navigating to `/dashboard` shows a normal dashboard inside the existing sidebar layout with no right-side black gap.
- No bottom Prev/Next/tab carousel.
- No round floating chat / avatar element on the dashboard.
- KPIs and charts render with real data from the existing hooks.
