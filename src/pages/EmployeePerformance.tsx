import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Users,
  Star,
  Plus,
  Calendar,
  MoreVertical,
  Trash2,
  Calculator,
  ClipboardCheck,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmployees } from "@/hooks/useEmployees";
import { useEmployeePayroll } from "@/hooks/useEmployeePayroll";
import { useEmployeeKPIs } from "@/hooks/useEmployeeKPIs";
import { useEmployeeBonuses } from "@/hooks/useEmployeeBonuses";
import { BonusStructureDialog, BonusLeaderboard } from "@/components/employee-performance";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-success/20 text-success border-success/30",
};

export default function EmployeePerformance() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [isKPIDialogOpen, setIsKPIDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [payrollForm, setPayrollForm] = useState({
    base_salary: 0,
    commission_earned: 0,
    bonus: 0,
    deductions: 0,
  });

  const { employees, loading: employeesLoading } = useEmployees();
  const {
    payrolls,
    loading: payrollLoading,
    stats: payrollStats,
    createPayroll,
    updatePayrollStatus,
    deletePayroll,
    calculateCommission,
  } = useEmployeePayroll();
  const {
    performanceSummaries,
    loading: kpiLoading,
    generateKPIsForEmployee,
  } = useEmployeeKPIs();
  
  const { getCurrentMonthStructure } = useEmployeeBonuses();

  const loading = employeesLoading || payrollLoading || kpiLoading;

  const handleCalculateCommission = async () => {
    if (!selectedEmployeeId || !periodStart || !periodEnd) return;
    const commission = await calculateCommission(selectedEmployeeId, periodStart, periodEnd);
    setPayrollForm((prev) => ({ ...prev, commission_earned: commission }));
  };

  const handleCreatePayroll = async () => {
    if (!selectedEmployeeId || !periodStart || !periodEnd) return;
    await createPayroll({
      employee_id: selectedEmployeeId,
      period_start: periodStart,
      period_end: periodEnd,
      ...payrollForm,
    });
    setIsPayrollDialogOpen(false);
    resetPayrollForm();
  };

  const handleGenerateKPI = async () => {
    if (!selectedEmployeeId || !periodStart || !periodEnd) return;
    await generateKPIsForEmployee(selectedEmployeeId, periodStart, periodEnd);
    setIsKPIDialogOpen(false);
    resetPayrollForm();
  };

  const resetPayrollForm = () => {
    setSelectedEmployeeId("");
    setPeriodStart("");
    setPeriodEnd("");
    setPayrollForm({ base_salary: 0, commission_earned: 0, bonus: 0, deductions: 0 });
  };

  const topPerformers = [...performanceSummaries]
    .sort((a, b) => b.completion_rate - a.completion_rate)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Performance & Payroll
            </h1>
            <p className="text-muted-foreground mt-1">
              Track employee KPIs and manage payroll
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isKPIDialogOpen} onOpenChange={setIsKPIDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Generate KPIs
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Generate KPI Report</DialogTitle>
                  <DialogDescription>
                    Auto-generate KPIs from existing data for an employee.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - {emp.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Period Start</Label>
                      <Input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="[color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Period End</Label>
                      <Input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="[color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateKPI}
                    disabled={!selectedEmployeeId || !periodStart || !periodEnd}
                    className="w-full bg-gradient-primary"
                  >
                    Generate Report
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isPayrollDialogOpen} onOpenChange={setIsPayrollDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Payroll
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Create Payroll Record</DialogTitle>
                  <DialogDescription>Add a new payroll entry for an employee.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} - {emp.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Period Start</Label>
                      <Input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="[color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Period End</Label>
                      <Input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="[color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Salary</Label>
                      <Input
                        type="number"
                        value={payrollForm.base_salary || ""}
                        onChange={(e) =>
                          setPayrollForm({ ...payrollForm, base_salary: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Commission</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={payrollForm.commission_earned || ""}
                          onChange={(e) =>
                            setPayrollForm({
                              ...payrollForm,
                              commission_earned: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleCalculateCommission}
                          disabled={!selectedEmployeeId || !periodStart || !periodEnd}
                          title="Auto-calculate"
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bonus</Label>
                      <Input
                        type="number"
                        value={payrollForm.bonus || ""}
                        onChange={(e) =>
                          setPayrollForm({ ...payrollForm, bonus: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deductions</Label>
                      <Input
                        type="number"
                        value={payrollForm.deductions || ""}
                        onChange={(e) =>
                          setPayrollForm({ ...payrollForm, deductions: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Payout</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(
                        payrollForm.base_salary +
                          payrollForm.commission_earned +
                          payrollForm.bonus -
                          payrollForm.deductions
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={handleCreatePayroll}
                    disabled={!selectedEmployeeId || !periodStart || !periodEnd}
                    className="w-full bg-gradient-primary"
                  >
                    Create Payroll
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payroll</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(payrollStats.totalPending)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/20">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(payrollStats.totalPaid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      employees.filter((e) => e.status === "Active").length
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/20">
                  <Calendar className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Records</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-8 w-16" /> : payrollStats.pendingCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in" style={{ animationDelay: "150ms" }}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chatting">Chatting Bonus</TabsTrigger>
            <TabsTrigger value="marketing">Marketing Bonus</TabsTrigger>
            <TabsTrigger value="payroll">Payroll Records</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary Cards */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Employee Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-2 w-full" />
                        </div>
                      </div>
                    ))
                  ) : performanceSummaries.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No performance data yet. Generate KPI reports to see metrics.
                    </p>
                  ) : (
                    performanceSummaries.slice(0, 5).map((summary) => (
                      <div key={summary.employee_id} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${summary.employee_name}`}
                          />
                          <AvatarFallback>{summary.employee_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-foreground truncate">{summary.employee_name}</p>
                            <span className="text-sm text-muted-foreground">
                              {summary.completion_rate.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={summary.completion_rate} className="h-2" />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-warning" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : topPerformers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No performance data available yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topPerformers.map((performer, index) => (
                        <div
                          key={performer.employee_id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg",
                            index === 0
                              ? "bg-gradient-to-r from-warning/20 to-transparent border border-warning/30"
                              : "bg-muted/30"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                              index === 0
                                ? "bg-warning text-warning-foreground"
                                : index === 1
                                ? "bg-muted-foreground/50 text-foreground"
                                : index === 2
                                ? "bg-orange-500/50 text-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${performer.employee_name}`}
                            />
                            <AvatarFallback>{performer.employee_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{performer.employee_name}</p>
                            <p className="text-sm text-muted-foreground">{performer.employee_role}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              {performer.completion_rate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">completion</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Revenue Generated by Employee */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  Revenue Generated by Employee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
                  ) : performanceSummaries.length === 0 ? (
                    <p className="text-muted-foreground col-span-4 text-center py-8">
                      No revenue data available yet.
                    </p>
                  ) : (
                    performanceSummaries
                      .filter((s) => s.total_revenue_generated > 0)
                      .slice(0, 4)
                      .map((summary) => (
                        <div key={summary.employee_id} className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground truncate">{summary.employee_name}</p>
                          <p className="text-xl font-bold text-foreground mt-1">
                            {formatCurrency(summary.total_revenue_generated)}
                          </p>
                          <p className="text-xs text-muted-foreground">{summary.creators_count} creators</p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatting Bonus Tab */}
          <TabsContent value="chatting" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Chatting Bonus Structure</h2>
                <p className="text-sm text-muted-foreground">
                  Based on earnings, unlock ratio, and response time
                </p>
              </div>
              <BonusStructureDialog />
            </div>
            <BonusLeaderboard 
              department="chatting" 
              structure={getCurrentMonthStructure("chatting")} 
            />
          </TabsContent>

          {/* Marketing Bonus Tab */}
          <TabsContent value="marketing" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Marketing Bonus Structure</h2>
                <p className="text-sm text-muted-foreground">
                  Based on accounts worked, tasks completed, and fans acquired
                </p>
              </div>
              <BonusStructureDialog />
            </div>
            <BonusLeaderboard 
              department="marketing" 
              structure={getCurrentMonthStructure("marketing")} 
            />
          </TabsContent>

          {/* Payroll Records Tab */}
          <TabsContent value="payroll" className="mt-6">
            <Card className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : payrolls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        No payroll records yet. Create your first payroll entry.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrolls.map((payroll) => (
                      <TableRow key={payroll.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payroll.employee?.name}`}
                              />
                              <AvatarFallback>{payroll.employee?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{payroll.employee?.name}</p>
                              <p className="text-xs text-muted-foreground">{payroll.employee?.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(payroll.period_start)} - {formatDate(payroll.period_end)}
                        </TableCell>
                        <TableCell>{formatCurrency(payroll.base_salary)}</TableCell>
                        <TableCell className="text-success">
                          +{formatCurrency(payroll.commission_earned)}
                        </TableCell>
                        <TableCell className="text-primary">+{formatCurrency(payroll.bonus)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payroll.total_payout)}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs border", statusColors[payroll.status])}>
                            {payroll.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              {payroll.status === "pending" && (
                                <DropdownMenuItem onClick={() => updatePayrollStatus(payroll.id, "approved")}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {payroll.status === "approved" && (
                                <DropdownMenuItem onClick={() => updatePayrollStatus(payroll.id, "paid")}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deletePayroll(payroll.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="glass-card">
                    <CardContent className="pt-6">
                      <Skeleton className="h-40 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : performanceSummaries.length === 0 ? (
                <Card className="glass-card col-span-full">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No employee performance data yet. Generate KPI reports to see the leaderboard.
                  </CardContent>
                </Card>
              ) : (
                performanceSummaries.map((summary, index) => (
                  <Card
                    key={summary.employee_id}
                    className={cn(
                      "glass-card overflow-hidden",
                      index === 0 && "ring-2 ring-warning/50"
                    )}
                  >
                    {index === 0 && (
                      <div className="bg-gradient-to-r from-warning/20 to-warning/5 px-4 py-2 text-center">
                        <span className="text-sm font-medium text-warning">🏆 Top Performer</span>
                      </div>
                    )}
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16 ring-2 ring-border">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${summary.employee_name}`}
                          />
                          <AvatarFallback className="text-lg">
                            {summary.employee_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{summary.employee_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {summary.employee_role}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Tasks Done</p>
                          <p className="text-lg font-bold text-foreground">
                            {summary.total_tasks_completed}/{summary.total_tasks_assigned}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Completion</p>
                          <p className="text-lg font-bold text-primary">
                            {summary.completion_rate.toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="text-lg font-bold text-success">
                            {formatCurrency(summary.total_revenue_generated)}
                          </p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground">Creators</p>
                          <p className="text-lg font-bold text-foreground">{summary.creators_count}</p>
                        </div>
                      </div>

                      {summary.avg_rating !== null && (
                        <div className="mt-4 flex items-center gap-2">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span className="font-medium">{summary.avg_rating.toFixed(1)}</span>
                          <span className="text-muted-foreground text-sm">rating</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
