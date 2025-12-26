import { useState } from "react";
import { Search, Download, Eye, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { PortalLayout } from "@/components/portal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type InvoiceStatus = "Paid" | "Pending" | "Processing";

interface Invoice {
  id: string;
  invoiceNumber: string;
  period: string;
  amount: string;
  status: InvoiceStatus;
  issueDate: string;
  paidDate?: string;
}

const creatorInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-ER-012",
    period: "December 2024",
    amount: "$4,250.00",
    status: "Pending",
    issueDate: "Dec 20, 2024",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-ER-011",
    period: "November 2024",
    amount: "$3,890.00",
    status: "Paid",
    issueDate: "Nov 20, 2024",
    paidDate: "Dec 5, 2024",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-ER-010",
    period: "October 2024",
    amount: "$4,120.00",
    status: "Paid",
    issueDate: "Oct 20, 2024",
    paidDate: "Nov 4, 2024",
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-ER-009",
    period: "September 2024",
    amount: "$3,650.00",
    status: "Paid",
    issueDate: "Sep 20, 2024",
    paidDate: "Oct 3, 2024",
  },
  {
    id: "5",
    invoiceNumber: "INV-2024-ER-008",
    period: "August 2024",
    amount: "$3,980.00",
    status: "Paid",
    issueDate: "Aug 20, 2024",
    paidDate: "Sep 5, 2024",
  },
];

const statusConfig: Record<InvoiceStatus, { color: string; icon: React.ElementType }> = {
  Paid: { color: "badge-active", icon: CheckCircle2 },
  Pending: { color: "badge-onboarding", icon: Clock },
  Processing: { color: "badge-paused", icon: Clock },
};

export default function PortalInvoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "All">("All");

  const statuses: (InvoiceStatus | "All")[] = ["All", "Paid", "Pending", "Processing"];

  const filteredInvoices = creatorInvoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.period.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    total: creatorInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, "")), 0),
    paid: creatorInvoices.filter(i => i.status === "Paid").reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, "")), 0),
    pending: creatorInvoices.filter(i => i.status === "Pending").reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, "")), 0),
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
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </div>
            <p className="text-2xl font-bold text-foreground">${totals.total.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Paid</p>
            </div>
            <p className="text-2xl font-bold text-success">${totals.paid.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold text-warning">${totals.pending.toLocaleString()}</p>
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
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Invoice #</TableHead>
                <TableHead className="text-muted-foreground">Period</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Issue Date</TableHead>
                <TableHead className="text-muted-foreground">Paid Date</TableHead>
                <TableHead className="text-muted-foreground w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice, index) => {
                const StatusIcon = statusConfig[invoice.status].icon;
                return (
                  <TableRow 
                    key={invoice.id} 
                    className="table-row-hover border-border animate-fade-in"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-foreground">{invoice.period}</TableCell>
                    <TableCell className="font-semibold text-foreground">{invoice.amount}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs flex items-center gap-1 w-fit", statusConfig[invoice.status].color)}>
                        <StatusIcon className="h-3 w-3" />
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{invoice.issueDate}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.paidDate || "—"}</TableCell>
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
              })}
            </TableBody>
          </Table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No invoices found matching your criteria.</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
