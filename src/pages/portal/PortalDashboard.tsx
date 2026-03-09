import { TrendingUp, CalendarDays, MessageSquare, FileText } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { useUnreadMessages } from "@/hooks/useMessages";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { StatCard } from "@/components/shared";

export default function PortalDashboard() {
  const { 
    creatorProfile, 
    invoices, 
    loading,
    totalEarnings,
    pendingInvoices,
    pendingInvoiceAmount
  } = useCreatorPortal();
  
  const { totalUnread } = useUnreadMessages("creator");

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Welcome back, <span className="gradient-text">{creatorProfile?.name || "Creator"}</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Here's what's happening with your content</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="Total Earnings"
            value={formatCurrency(totalEarnings)}
            subtitle="All time"
            icon={TrendingUp}
            loading={loading}
          />
          <StatCard
            title="Messages"
            value="0"
            subtitle="From agency team"
            icon={MessageSquare}
            loading={loading}
          />
          <StatCard
            title="Pending Invoices"
            value={pendingInvoices.toString()}
            subtitle={formatCurrency(pendingInvoiceAmount) + " total"}
            icon={FileText}
            loading={loading}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Plans Quick Link */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Content Plans</h2>
              <Badge variant="outline" className="border-accent/30 text-accent">
                <CalendarDays className="h-3 w-3 mr-1" />
                View All
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Check your content plans to see what's due, update your progress, and submit completed work.
            </p>
            <a href="/portal/plans" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors font-medium">
              <CalendarDays className="h-4 w-4" />
              Go to Content Plans →
            </a>
          </div>

          {/* Recent Invoices */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Invoices</h2>
              <Badge variant="outline" className="border-accent/30 text-accent">
                {invoices.length} total
              </Badge>
            </div>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No invoices yet</p>
              ) : (
                invoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{inv.invoice_number}</span>
                      <Badge className={cn(
                        "text-xs",
                        inv.status === "Paid" && "bg-success/20 text-success",
                        inv.status === "Pending" && "bg-warning/20 text-warning"
                      )}>
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatCurrency(inv.amount)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}