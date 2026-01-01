import { useState } from "react";
import { Search, Plus, Mail, MoreVertical, Trash2, UserPlus, MessageSquare } from "lucide-react";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const roleColors: Record<string, string> = {
  Manager: "bg-accent/20 text-accent border-accent/30",
  Marketing: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Quality Controller": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Chatter: "bg-success/20 text-success border-success/30",
  VA: "bg-warning/20 text-warning border-warning/30",
  Recruiter: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Finance: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const statusColors: Record<string, string> = {
  Active: "badge-active",
  "On Leave": "badge-onboarding",
  Inactive: "badge-paused",
};

export default function Employees() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [formData, setFormData] = useState<Partial<CreateEmployeeInput>>({
    name: "",
    email: "",
    role: "",
    department: "",
    status: "Active",
    assigned_creators: 0,
  });

  const { employees, loading, stats, createEmployee, updateEmployee, deleteEmployee, refetch } = useEmployees();

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

  const handleCreateAccount = async () => {
    if (!selectedEmployee || !accountPassword) return;
    
    setCreatingAccount(true);
    try {
      // Create auth user with employee type
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: selectedEmployee.email,
        password: accountPassword,
        email_confirm: true,
        user_metadata: {
          full_name: selectedEmployee.name,
          user_type: "employee",
        },
      });

      if (authError) {
        // Try using signUp as fallback (admin API might not be available)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: selectedEmployee.email,
          password: accountPassword,
          options: {
            data: {
              full_name: selectedEmployee.name,
              user_type: "employee",
            },
          },
        });

        if (signUpError) {
          toast.error("Failed to create account: " + signUpError.message);
          setCreatingAccount(false);
          return;
        }

        // Link employee to auth user
        if (signUpData.user) {
          await supabase
            .from("employees")
            .update({ auth_user_id: signUpData.user.id })
            .eq("id", selectedEmployee.id);
          
          // If Chatter role, also link to chatters table
          if (selectedEmployee.role === "Chatter") {
            // Check if chatter exists with same email
            const { data: chatter } = await supabase
              .from("chatters")
              .select("id")
              .ilike("email", selectedEmployee.email)
              .maybeSingle();
            
            if (chatter) {
              await supabase
                .from("chatters")
                .update({ auth_user_id: signUpData.user.id })
                .eq("id", chatter.id);
            }
          }
        }
      } else if (authData.user) {
        // Link employee to auth user
        await supabase
          .from("employees")
          .update({ auth_user_id: authData.user.id })
          .eq("id", selectedEmployee.id);

        // If Chatter role, also link to chatters table
        if (selectedEmployee.role === "Chatter") {
          const { data: chatter } = await supabase
            .from("chatters")
            .select("id")
            .ilike("email", selectedEmployee.email)
            .maybeSingle();
          
          if (chatter) {
            await supabase
              .from("chatters")
              .update({ auth_user_id: authData.user.id })
              .eq("id", chatter.id);
          }
        }
      }

      toast.success(`Account created for ${selectedEmployee.name}`);
      setIsCreateAccountDialogOpen(false);
      setAccountPassword("");
      setSelectedEmployee(null);
      refetch();
    } catch (error) {
      toast.error("Failed to create account");
    }
    setCreatingAccount(false);
  };

  const openCreateAccountDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setAccountPassword("");
    setIsCreateAccountDialogOpen(true);
  };

  const startMessageWithEmployee = (employee: Employee) => {
    navigate("/internal-messages", { state: { preselectedEmployeeId: employee.id } });
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
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Quality Controller">Quality Controller</SelectItem>
                        <SelectItem value="Chatter">Chatter</SelectItem>
                        <SelectItem value="VA">VA</SelectItem>
                        <SelectItem value="Recruiter">Recruiter</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
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
                          <DropdownMenuItem onClick={() => startMessageWithEmployee(employee)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openCreateAccountDialog(employee)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create Login
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(employee, "Active")}>
                            Set Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(employee, "On Leave")}>
                            Set On Leave
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(employee, "Inactive")}>
                            Set Inactive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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

        {/* Create Account Dialog */}
        <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Employee Login</DialogTitle>
              <DialogDescription>
                Create a login account for {selectedEmployee?.name}. They will be able to access the Employee Portal with their email and this password.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedEmployee?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>
              <Button 
                onClick={handleCreateAccount} 
                className="w-full bg-gradient-primary"
                disabled={!accountPassword || accountPassword.length < 8 || creatingAccount}
              >
                {creatingAccount ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
