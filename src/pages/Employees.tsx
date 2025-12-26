import { useState } from "react";
import { Search, Plus, Mail, MoreVertical, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEmployees, Employee, CreateEmployeeInput } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";

const roleColors: Record<string, string> = {
  Admin: "bg-primary/20 text-primary border-primary/30",
  "Account Manager": "bg-accent/20 text-accent border-accent/30",
  Manager: "bg-accent/20 text-accent border-accent/30",
  "Video Editor": "bg-warning/20 text-warning border-warning/30",
  "Social Media Manager": "bg-success/20 text-success border-success/30",
  "Content Strategist": "bg-primary/20 text-primary border-primary/30",
  VA: "bg-warning/20 text-warning border-warning/30",
  Chatter: "bg-success/20 text-success border-success/30",
};

const statusColors: Record<string, string> = {
  Active: "badge-active",
  "On Leave": "badge-onboarding",
  Inactive: "badge-paused",
};

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateEmployeeInput>>({
    name: "",
    email: "",
    role: "",
    department: "",
    status: "Active",
    assigned_creators: 0,
  });

  const { employees, loading, stats, createEmployee, updateEmployee, deleteEmployee } = useEmployees();

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return;

    await createEmployee({
      name: formData.name,
      email: formData.email,
      phone: null,
      avatar_seed: formData.name.toLowerCase().split(" ")[0],
      role: formData.role,
      department: formData.department || null,
      status: formData.status as "Active" | "On Leave" | "Inactive",
      hire_date: null,
      assigned_creators: formData.assigned_creators || 0,
    });

    setFormData({ name: "", email: "", role: "", department: "", status: "Active", assigned_creators: 0 });
    setIsAddDialogOpen(false);
  };

  const handleStatusChange = async (employee: Employee, newStatus: "Active" | "On Leave" | "Inactive") => {
    await updateEmployee(employee.id, { status: newStatus });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading..." : `${stats.total} employees • ${stats.active} active`}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Employee name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="employee@agency.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v) => setFormData({ ...formData, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Account Manager">Account Manager</SelectItem>
                        <SelectItem value="Video Editor">Video Editor</SelectItem>
                        <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
                        <SelectItem value="Content Strategist">Content Strategist</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={(v) => setFormData({ ...formData, department: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select dept" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Strategy">Strategy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  Add Employee
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border focus:border-primary input-glow"
          />
        </div>

        {/* Employees Table */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "150ms" }}>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Employee</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Department</TableHead>
                <TableHead className="text-muted-foreground">Assigned Creators</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filteredEmployees.map((employee, index) => (
                  <TableRow 
                    key={employee.id} 
                    className="table-row-hover border-border animate-fade-in"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-border">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.avatar_seed || employee.name}`} />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {employee.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{employee.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs border", roleColors[employee.role] || "bg-muted text-muted-foreground")}>
                        {employee.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.department || "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground font-medium">{employee.assigned_creators}</span>
                      <span className="text-muted-foreground"> creators</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", statusColors[employee.status])}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleStatusChange(employee, "Active")}>
                            Set Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(employee, "On Leave")}>
                            Set On Leave
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(employee, "Inactive")}>
                            Set Inactive
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteEmployee(employee.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No employees found matching your search.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
