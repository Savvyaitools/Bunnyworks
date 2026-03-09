import { useState } from "react";
import {
  Search, Plus, Download, Eye, Send, Trash2, FileText, DollarSign,
  TrendingUp, TrendingDown, Clock, CheckCircle2, X, Receipt, CreditCard,
  Megaphone, Monitor, MoreHorizontal,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useInvoices, generateInvoiceNumber } from "@/hooks/useInvoices";
import { useExpenditures, getCategoryLabel } from "@/hooks/useExpenditures";
import { useCreators } from "@/hooks/useCreators";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/shared/PageHeader";
import { Separator } from "@/components/ui/separator";
import type { Invoice } from "@/hooks/useInvoices";

type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

const statusColors: Record<InvoiceStatus, string> = {
  Paid: "bg-success/20 text-success border-success/30",
  Pending: "bg-warning/20 text-warning border-warning/30",
  Overdue: "bg-destructive/20 text-destructive border-destructive/30",
  Draft: "bg-muted text-muted-foreground border-border",
};

const categoryIcons: Record<string, React.ElementType> = {
  salary: DollarSign,
  promotion: Megaphone,
  ads: TrendingUp,
  subscription: CreditCard,
  software: Monitor,
  other: MoreHorizontal,
};

function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}

// ─── Invoice Detail Dialog ───────────────────────────────────────────────────
function InvoiceDetailDialog({ invoice }: { invoice: Invoice }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Invoice {invoice.invoice_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {/* Status banner */}
          <div className={cn(
            "px-4 py-3 rounded-lg border flex items-center justify-between",
            statusColors[invoice.status as InvoiceStatus] || statusColors.Draft
          )}>
            <div className="flex items-center gap-2">
              {invoice.status === "Paid" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span className="font-medium text-sm">{invoice.status}</span>
            </div>
            <span className="text-2xl font-bold">{formatCurrency(invoice.amount)}</span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Creator</p>
              <p className="font-medium text-foreground">{invoice.creator?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Invoice #</p>
              <p className="font-medium text-foreground">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Issue Date</p>
              <p className="font-medium text-foreground">{formatDate(invoice.issue_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Due Date</p>
              <p className="font-medium text-foreground">{formatDate(invoice.due_date)}</p>
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator className="bg-border" />
              <div>
                <p className="text-muted-foreground text-sm mb-1">Notes</p>
                <p className="text-foreground text-sm">{invoice.notes}</p>
              </div>
            </>
          )}

          {/* Line items placeholder */}
          <Separator className="bg-border" />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Line Items</p>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
              <span className="text-sm text-foreground">Creator Payout — {invoice.creator?.name || "Creator"}</span>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</span>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between py-2 px-3">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(invoice.amount)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Financials Page ────────────────────────────────────────────────────
export default function Financials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | "All">("All");
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    creator_id: "", amount: "", status: "Draft" as InvoiceStatus, due_days: "14", notes: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    category: "salary", description: "", amount: "", frequency: "monthly", date: format(new Date(), "yyyy-MM-dd"), notes: "",
  });

  const { invoices, loading: invLoading, stats, createInvoice, deleteInvoice } = useInvoices();
  const { expenditures, loading: expLoading, totalExpenses, byCategory, createExpenditure, deleteExpenditure } = useExpenditures();
  const { creators } = useCreators();

  const statuses: (InvoiceStatus | "All")[] = ["All", "Paid", "Pending", "Overdue", "Draft"];
  const revenue = stats.paid;
  const profit = revenue - totalExpenses;

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.creator?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = selectedStatus === "All" || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.creator_id || !invoiceForm.amount) return;
    const dueDate = addDays(new Date(), parseInt(invoiceForm.due_days));
    await createInvoice({
      invoice_number: generateInvoiceNumber(),
      creator_id: invoiceForm.creator_id,
      amount: parseFloat(invoiceForm.amount),
      status: invoiceForm.status,
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(dueDate, "yyyy-MM-dd"),
      notes: invoiceForm.notes || null,
    });
    setInvoiceForm({ creator_id: "", amount: "", status: "Draft", due_days: "14", notes: "" });
    setIsAddInvoiceOpen(false);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    await createExpenditure({
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      frequency: expenseForm.frequency,
      date: expenseForm.date,
      notes: expenseForm.notes || null,
    });
    setExpenseForm({ category: "salary", description: "", amount: "", frequency: "monthly", date: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setIsAddExpenseOpen(false);
  };

  const loading = invLoading || expLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1400px]">
        <PageHeader title="Financials" subtitle="Track profitability, invoices and expenditures" />

        {/* Profitability Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-success/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-xs text-muted-foreground">Revenue (Paid)</p>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-success">{formatCurrency(revenue)}</p>
            )}
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            )}
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", profit >= 0 ? "bg-success/20" : "bg-destructive/20")}>
                <DollarSign className={cn("h-4 w-4", profit >= 0 ? "text-success" : "text-destructive")} />
              </div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className={cn("text-2xl font-bold", profit >= 0 ? "text-success" : "text-destructive")}>
                {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
              </p>
            )}
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-warning/20 flex items-center justify-center">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <p className="text-2xl font-bold text-warning">{formatCurrency(stats.pending)}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="invoices" className="data-[state=active]:bg-card">
              <Receipt className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="expenditures" className="data-[state=active]:bg-card">
              <CreditCard className="h-4 w-4 mr-2" />
              Expenditures
            </TabsTrigger>
          </TabsList>

          {/* ─── INVOICES TAB ─────────────────────────────────────────────── */}
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border focus:border-primary input-glow"
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
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
                <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Create New Invoice</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateInvoice} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Creator</Label>
                        <Select value={invoiceForm.creator_id} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, creator_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select creator" /></SelectTrigger>
                          <SelectContent>
                            {creators.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount ($)</Label>
                        <Input type="number" step="0.01" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} placeholder="0.00" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={invoiceForm.status} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, status: v as InvoiceStatus })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Draft">Draft</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Due In</Label>
                          <Select value={invoiceForm.due_days} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, due_days: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-primary">Create Invoice</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="glass-card overflow-hidden animate-fade-in">
              {invLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No invoices yet</p>
                  <p className="text-sm text-muted-foreground/70">Create your first invoice to get started</p>
                </div>
              ) : (
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
                      <TableRow key={invoice.id} className="table-row-hover border-border animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <TableCell className="font-medium text-foreground">{invoice.invoice_number}</TableCell>
                        <TableCell className="text-foreground">{invoice.creator?.name || "—"}</TableCell>
                        <TableCell className="font-semibold text-foreground">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs border", statusColors[invoice.status as InvoiceStatus] || statusColors.Draft)}>
                            {invoice.status === "Paid" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(invoice.issue_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <InvoiceDetailDialog invoice={invoice} />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteInvoice(invoice.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {!invLoading && filteredInvoices.length === 0 && invoices.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No invoices match your criteria.</p>
              </div>
            )}
          </TabsContent>

          {/* ─── EXPENDITURES TAB ─────────────────────────────────────────── */}
          <TabsContent value="expenditures" className="space-y-6">
            {/* Category breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {(["salary", "promotion", "ads", "subscription", "software", "other"] as const).map((cat) => {
                const Icon = categoryIcons[cat] || MoreHorizontal;
                const catTotal = byCategory[cat] || 0;
                return (
                  <div key={cat} className="stat-card text-center">
                    <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{getCategoryLabel(cat)}</p>
                    {loading ? <Skeleton className="h-6 w-16 mx-auto" /> : (
                      <p className="text-lg font-bold text-foreground">{formatCurrency(catTotal)}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add expense + table */}
            <div className="flex justify-end">
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Add Expenditure</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateExpense} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salary">Employee Salaries</SelectItem>
                            <SelectItem value="promotion">Promotion / GGs</SelectItem>
                            <SelectItem value="ads">Advertising</SelectItem>
                            <SelectItem value="subscription">Subscriptions</SelectItem>
                            <SelectItem value="software">Software & Tools</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select value={expenseForm.frequency} onValueChange={(v) => setExpenseForm({ ...expenseForm, frequency: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one-time">One-time</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="e.g. George's monthly salary" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount ($)</Label>
                        <Input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-primary">Add Expense</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="glass-card overflow-hidden animate-fade-in">
              {expLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : expenditures.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No expenditures recorded</p>
                  <p className="text-sm text-muted-foreground/70">Start tracking your agency costs</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Description</TableHead>
                      <TableHead className="text-muted-foreground">Category</TableHead>
                      <TableHead className="text-muted-foreground">Amount</TableHead>
                      <TableHead className="text-muted-foreground">Frequency</TableHead>
                      <TableHead className="text-muted-foreground">Date</TableHead>
                      <TableHead className="text-muted-foreground w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenditures.map((exp, index) => {
                      const Icon = categoryIcons[exp.category] || MoreHorizontal;
                      return (
                        <TableRow key={exp.id} className="table-row-hover border-border animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{exp.description}</p>
                              {exp.notes && <p className="text-xs text-muted-foreground mt-0.5">{exp.notes}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs border-border gap-1">
                              <Icon className="h-3 w-3" />
                              {getCategoryLabel(exp.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-destructive">{formatCurrency(exp.amount)}</TableCell>
                          <TableCell className="text-muted-foreground capitalize">{exp.frequency}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(exp.date)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteExpenditure(exp.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
