/**
 * Renders all application routes from the declarative route config.
 * Automatically wraps routes with ProtectedRoute and ErrorBoundary as configured.
 */

import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/NotFound";
import { allRoutes, redirectRoutes, type RouteConfig } from "./routeConfig";

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 mt-8" />
      </div>
    </div>
  );
}

const PortalErrorFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center p-8 max-w-md border border-border rounded-xl bg-card">
      <h2 className="text-xl font-semibold text-foreground mb-2">Portal Error</h2>
      <p className="text-muted-foreground mb-4">
        Something went wrong in this section. The rest of the app is unaffected.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
      >
        Refresh
      </button>
    </div>
  </div>
);

function renderRoute(route: RouteConfig) {
  let element = route.element;

  // Wrap with ProtectedRoute if auth is specified
  if (route.auth) {
    element = (
      <ProtectedRoute allowedUserTypes={route.auth}>
        {element}
      </ProtectedRoute>
    );
  }

  // Wrap with scoped ErrorBoundary if specified
  if (route.errorBoundary) {
    element = (
      <ErrorBoundary fallback={<PortalErrorFallback />}>
        {element}
      </ErrorBoundary>
    );
  }

  return <Route key={route.path} path={route.path} element={element} />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* All configured routes */}
        {allRoutes.map(renderRoute)}

        {/* Redirect routes */}
        {redirectRoutes.map(({ from, to }) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
