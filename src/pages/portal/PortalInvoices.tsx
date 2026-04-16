import { useState } from "react";
import { Search, Download, Eye, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useCreatorPortal } from "@/hooks/useCreatorPortal";
import { formatCurrency } from "@/lib/formatters";
import { format, parseISO } from "date-fns";

type InvoiceStatus = "Paid" | "Pending" | "Draft" | "Sent";

const statusConfig: Record<InvoiceStatus, { color: string; icon: React.ElementType }> = {
  Paid: { color: "badge-active", icon: CheckCircle2 },
  Pending: { color: "badge-onboarding", icon: Clock },
  Draft: { color: "badge-paused", icon: Clock },
  Sent: { color: "badge-onboarding", icon: Clock },
};

function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}

export default function PortalInvoices() {
  const { invoices, loading } = useCreatorPortal();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "All">("All");

  const statuses: (InvoiceStatus | "All")[] = ["All", "Paid", "Pending", "Draft"];

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    total: invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
    paid: invoices.filter(i => i.status === "Paid").reduce((sum, inv) => sum + Number(inv.amount), 0),
    pending: invoices.filter(i => i.status === "Pending").reduce((sum, inv) => sum + Number(inv.amount), 0),
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Invoices</h1>
          <p className="text-muted-foreground mt-1">Track your earnings and payment history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
            </div>
            {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.total)}</p>}
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
            {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold text-success">{formatCurrency(totals.paid)}</p>}
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold text-warning">{formatCurrency(totals.pending)}</p>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-accent input-glow"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  selectedStatus === status 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "150ms" }}>
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Invoice #</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Issue Date</TableHead>
                  <TableHead className="text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-muted-foreground w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No invoices found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice, index) => {
                    const config = statusConfig[invoice.status as InvoiceStatus] || statusConfig.Pending;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow 
                        key={invoice.id} 
                        className="table-row-hover border-border animate-fade-in"
                        style={{ animationDelay: `${200 + index * 50}ms` }}
                      >
                        <TableCell className="font-medium text-foreground">{invoice.invoice_number}</TableCell>
                        <TableCell className="font-semibold text-foreground">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs flex items-center gap-1 w-fit", config.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(invoice.issue_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
