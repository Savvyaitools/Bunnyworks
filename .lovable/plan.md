

# Mobile View Optimization

## Overview
Multiple pages and components across the SaaS have layout, spacing, and usability issues on mobile devices. This plan addresses each problem area systematically across all three portals (Agency, Employee, Creator).

---

## Problems Identified

1. **Messages page** -- Conversation sidebar is fixed at `w-80` with no mobile alternative. On phones, the chat panel is completely hidden or crushed.
2. **Tasks page** -- Uses a 4-column Kanban grid that doesn't collapse to a usable single-column view on mobile.
3. **Creator Detail page** -- 9 tabs (`TabsList`) overflow horizontally on mobile with no scroll indicator or wrapping.
4. **Dashboard charts** -- Revenue charts and grids use `xl:grid-cols-3` which stacks fine, but chart containers have fixed heights (e.g. `h-[350px]`) that may be too tall on small screens.
5. **Settings page** -- Tab navigation uses a horizontal row that likely overflows on mobile.
6. **Chatters page** -- Chatter cards with multiple data points may overflow or feel cramped.
7. **Global CSS overrides** -- Aggressive `!important` font-size rules on `h1`/`h2` and spacing reduction (`space-y-6 > * + *`) affect all pages unpredictably.
8. **Business tab** -- `lg:grid-cols-3` layout with `h-[350px]` fixed chart height is too tall on mobile.

---

## Implementation Plan

### 1. Messages Page -- Mobile Conversation/Chat Toggle

Convert the Messages page to a mobile-responsive layout:
- On mobile, show only the conversation list initially
- When a conversation is tapped, slide in the full chat view with a back button
- Hide the sidebar when chat is active on mobile
- Use the existing `useIsMobile` hook to toggle between views

**File**: `src/pages/Messages.tsx`

### 2. Tasks Page -- Mobile List View

Replace the 4-column Kanban grid with a stacked list view on mobile:
- Show tasks grouped by status in collapsible sections
- Each section shows the status header with count badge
- Tasks render as compact cards in a single column
- Keep the Kanban board for desktop (`lg:` breakpoint and up)

**File**: `src/pages/Tasks.tsx`

### 3. Creator Detail -- Scrollable Tabs

Fix the 9-tab overflow:
- Add `overflow-x-auto` and `scrollbar-hide` to the `TabsList`
- Use `flex-nowrap` instead of `flex-wrap` to enable horizontal scrolling
- Add `whitespace-nowrap` to each `TabsTrigger` so labels don't break
- Consider shortening tab labels on mobile (e.g., "Requests" instead of "Custom Requests")

**File**: `src/pages/CreatorDetail.tsx`

### 4. Dashboard -- Responsive Chart Heights

Fix chart containers for mobile:
- Change `h-[350px]` to `h-[250px] lg:h-[350px]` for chart containers
- Ensure sparkline cards stack properly in single column on mobile
- Reduce padding on glass-card components inside dashboard grids

**File**: `src/pages/Index.tsx`

### 5. Settings Page -- Mobile Tab Navigation

Convert the horizontal tab row to a vertical list or dropdown on mobile:
- On mobile, show tabs as a vertical stack or use a `Select` dropdown
- Keep the horizontal tab bar on desktop

**File**: `src/pages/Settings.tsx`

### 6. Global CSS Cleanup

Remove or soften the aggressive mobile overrides that break layouts:
- Remove `!important` from `h1` and `h2` font-size overrides -- these conflict with page-specific sizing
- Remove the global `space-y-6` and `space-y-8` spacing reduction -- it creates unpredictable layout shifts
- Remove the global `table { display: block }` override -- it breaks table layouts; apply only where needed
- Keep the touch target (44px min), scrollbar, and safe-area rules

**File**: `src/index.css`

### 7. Chatters Page -- Compact Mobile Cards

Adjust the chatter card layout for mobile:
- Reduce padding and font sizes on mobile
- Stack action buttons vertically or use a single menu button
- Ensure skill badges and assignment lists wrap properly

**File**: `src/pages/Chatters.tsx`

### 8. Dialog Sizing

Ensure all `DialogContent` components respect mobile widths:
- Add `max-w-[calc(100vw-2rem)]` to dialog content
- Ensure form fields inside dialogs don't overflow

**File**: `src/components/ui/dialog.tsx` (if not already handled)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Messages.tsx` | Mobile conversation/chat toggle view |
| `src/pages/Tasks.tsx` | Collapsible list view on mobile |
| `src/pages/CreatorDetail.tsx` | Scrollable tab list |
| `src/pages/Index.tsx` | Responsive chart heights |
| `src/pages/Settings.tsx` | Mobile-friendly tab navigation |
| `src/pages/Chatters.tsx` | Compact mobile cards |
| `src/index.css` | Remove aggressive global overrides |

---

## What Will NOT Change

- Bottom navigation (already well-implemented)
- Portal and Employee layouts (already responsive)
- Authentication pages (already mobile-friendly)
- Landing page (separate concern)

