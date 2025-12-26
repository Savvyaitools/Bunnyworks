import { useState } from "react";
import { Search, Plus, Download, Eye, Send, MoreVertical } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

interface Invoice {
  id: string;
  invoiceNumber: string;
  creator: string;
  amount: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    creator: "Emma Rose",
    amount: "$3,450.00",
    status: "Paid",
    issueDate: "Dec 1, 2024",
    dueDate: "Dec 15, 2024",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    creator: "Luna Star",
    amount: "$2,680.00",
    status: "Pending",
    issueDate: "Dec 10, 2024",
    dueDate: "Dec 24, 2024",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    creator: "Mia Chen",
    amount: "$4,560.00",
    status: "Paid",
    issueDate: "Dec 5, 2024",
    dueDate: "Dec 19, 2024",
  },
  {
    id: "4",
    invoiceNumber: "INV-2024-004",
    creator: "Sophie Taylor",
    amount: "$1,890.00",
    status: "Overdue",
    issueDate: "Nov 20, 2024",
    dueDate: "Dec 4, 2024",
  },
  {
    id: "5",
    invoiceNumber: "INV-2024-005",
    creator: "Jessica Blake",
    amount: "$0.00",
    status: "Draft",
    issueDate: "Dec 20, 2024",
    dueDate: "Jan 3, 2025",
  },
  {
    id: "6",
    invoiceNumber: "INV-2024-006",
    creator: "Emma Rose",
    amount: "$3,890.00",
    status: "Pending",
    issueDate: "Dec 15, 2024",
    dueDate: "Dec 29, 2024",
  },
];

const statusColors: Record<InvoiceStatus, string> = {
  Paid: "badge-active",
  Pending: "badge-onboarding",
  Overdue: "badge-offboarded",
  Draft: "badge-paused",
};

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "All">("All");

  const statuses: (InvoiceStatus | "All")[] = ["All", "Paid", "Pending", "Overdue", "Draft"];

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    total: invoices.reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, "")), 0),
    paid: invoices.filter(i => i.status === "Paid").reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, "")), 0),
    pending: invoices.filter(i => i.status === "Pending" || i.status === "Overdue").reduce((sum, inv) => sum + parseFloat(inv.amount.replace(/[$,]/g, "")), 0),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Invoices</h1>
            <p className="text-muted-foreground mt-1">Create and manage creator invoices</p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Invoiced</p>
            <p className="text-2xl font-bold text-foreground">${totals.total.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-success">${totals.paid.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Outstanding</p>
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
              className="pl-10 bg-card border-border focus:border-primary input-glow"
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
                    ? "bg-primary text-primary-foreground" 
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
                <TableHead className="text-muted-foreground">Creator</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Issue Date</TableHead>
                <TableHead className="text-muted-foreground">Due Date</TableHead>
                <TableHead className="text-muted-foreground w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice, index) => (
                <TableRow 
                  key={invoice.id} 
                  className="table-row-hover border-border animate-fade-in"
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                >
                  <TableCell className="font-medium text-foreground">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="text-foreground">{invoice.creator}</TableCell>
                  <TableCell className="font-semibold text-foreground">{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", statusColors[invoice.status])}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{invoice.issueDate}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No invoices found matching your criteria.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
