

## Rename "Browser Sessions" → "Platform Access"

A text-label rename across all UI-facing references. No route or file renaming — just user-visible strings.

### Files to Update

1. **`src/pages/BrowserSync.tsx`** — PageHeader title: "Browser Sessions" → "Platform Access", subtitle update
2. **`src/pages/employee/EmployeeBrowserSessions.tsx`** — Page heading and description text
3. **`src/components/layout/AppSidebar.tsx`** — Sidebar item: "Live Sessions" → "Platform Access"
4. **`src/components/layout/MobileBottomNav.tsx`** — Menu item: "Live Sessions" → "Platform Access"
5. **`src/components/employee/EmployeeLayout.tsx`** — Bottom nav label: "Browser" → "Access"
6. **`src/components/dashboard/GettingStartedChecklist.tsx`** — Checklist item label and description
7. **`src/pages/employee/EmployeeDashboard.tsx`** — Button label "Browser Sessions" → "Platform Access"
8. **`src/components/landing/ScreenshotShowcase.tsx`** — "Cloud Browser Sessions" → "Platform Access"
9. **`src/components/landing/FeaturesSection.tsx`** — Feature title update if applicable
10. **`src/components/landing/HeroSection.tsx`** — Hero description text
11. **`src/components/landing/LandingSections.tsx`** — Pricing card feature list
12. **`src/components/landing/ComparisonSection.tsx`** — Comparison row label
13. **`src/lib/subscriptionTiers.ts`** — Feature strings in tier definitions
14. **`src/components/browser/ActiveSessionBanner.tsx`** — Banner label "Session:" → keep as-is (refers to an active session instance, not the feature name)

Internal code names (variable names, route paths, file names, edge function names) remain unchanged.

