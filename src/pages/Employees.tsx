import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useEmployees, Employee, CreateEmployeeInput } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { EmployeeCard } from "@/components/employees";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
    salary: 0,
    commission_rate: 0,
    bio: "",
    skills: [],
    education: "",
    experience: "",
    certifications: [],
    emergency_contact: "",
    address: "",
    phone: "",
  });
  const [skillsInput, setSkillsInput] = useState("");
  const [certsInput, setCertsInput] = useState("");

  const { employees, loading, stats, createEmployee, updateEmployee, deleteEmployee, refetch } = useEmployees();

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "",
      department: "",
      status: "Active",
      assigned_creators: 0,
      salary: 0,
      commission_rate: 0,
      bio: "",
      skills: [],
      education: "",
      experience: "",
      certifications: [],
      emergency_contact: "",
      address: "",
      phone: "",
    });
    setSkillsInput("");
    setCertsInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) return;

    const skills = skillsInput.split(",").map(s => s.trim()).filter(Boolean);
    const certs = certsInput.split(",").map(s => s.trim()).filter(Boolean);

    await createEmployee({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      avatar_seed: formData.name.toLowerCase().split(" ")[0],
      role: formData.role,
      department: formData.department || null,
      status: formData.status as "Active" | "On Leave" | "Inactive",
      hire_date: new Date().toISOString().split("T")[0],
      assigned_creators: formData.assigned_creators || 0,
      salary: formData.salary || 0,
      commission_rate: formData.commission_rate || 0,
      bio: formData.bio || null,
      skills: skills.length > 0 ? skills : null,
      education: formData.education || null,
      experience: formData.experience || null,
      certifications: certs.length > 0 ? certs : null,
      emergency_contact: formData.emergency_contact || null,
      address: formData.address || null,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    const skills = skillsInput.split(",").map(s => s.trim()).filter(Boolean);
    const certs = certsInput.split(",").map(s => s.trim()).filter(Boolean);

    await updateEmployee(selectedEmployee.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || null,
      role: formData.role,
      department: formData.department || null,
      salary: formData.salary || 0,
      commission_rate: formData.commission_rate || 0,
      bio: formData.bio || null,
      skills: skills.length > 0 ? skills : null,
      education: formData.education || null,
      experience: formData.experience || null,
      certifications: certs.length > 0 ? certs : null,
      emergency_contact: formData.emergency_contact || null,
      address: formData.address || null,
    });

    resetForm();
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleStatusChange = async (employee: Employee, newStatus: "Active" | "On Leave" | "Inactive") => {
    await updateEmployee(employee.id, { status: newStatus });
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      role: employee.role,
      department: employee.department || "",
      status: employee.status,
      assigned_creators: employee.assigned_creators,
      salary: employee.salary || 0,
      commission_rate: employee.commission_rate || 0,
      bio: employee.bio || "",
      education: employee.education || "",
      experience: employee.experience || "",
      emergency_contact: employee.emergency_contact || "",
      address: employee.address || "",
    });
    setSkillsInput(employee.skills?.join(", ") || "");
    setCertsInput(employee.certifications?.join(", ") || "");
    setIsEditDialogOpen(true);
  };

  const handleCreateAccount = async () => {
    if (!selectedEmployee || !accountPassword) return;
    
    setCreatingAccount(true);
    try {
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

      if (signUpData.user) {
        await supabase
          .from("employees")
          .update({ auth_user_id: signUpData.user.id })
          .eq("id", selectedEmployee.id);
        
        if (selectedEmployee.role === "Chatter") {
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

  const EmployeeFormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Employee name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="employee@agency.com"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 234 567 8900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address || ""}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="City, Country"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
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
            value={formData.department || ""}
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Monthly Salary ($)</Label>
          <Input
            id="salary"
            type="number"
            value={formData.salary || ""}
            onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
            placeholder="5000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commission">Commission Rate (%)</Label>
          <Input
            id="commission"
            type="number"
            value={formData.commission_rate || ""}
            onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
            placeholder="10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio || ""}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Brief description about the employee..."
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experience">Experience</Label>
          <Input
            id="experience"
            value={formData.experience || ""}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            placeholder="5 years in marketing"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="education">Education</Label>
          <Input
            id="education"
            value={formData.education || ""}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            placeholder="MBA from Stanford"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          value={skillsInput}
          onChange={(e) => setSkillsInput(e.target.value)}
          placeholder="Marketing, Sales, Analytics"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="certifications">Certifications (comma-separated)</Label>
        <Input
          id="certifications"
          value={certsInput}
          onChange={(e) => setCertsInput(e.target.value)}
          placeholder="Google Analytics, HubSpot"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="emergency">Emergency Contact</Label>
        <Input
          id="emergency"
          value={formData.emergency_contact || ""}
          onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
          placeholder="John Doe - +1 234 567 8900"
        />
      </div>
    </>
  );

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
            <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Fill in the employee details below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <EmployeeFormFields />
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

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))
          ) : (
            filteredEmployees.map((employee, index) => (
              <div
                key={employee.id}
                className="animate-fade-in"
                style={{ animationDelay: `${100 + index * 50}ms` }}
              >
                <EmployeeCard
                  employee={employee}
                  onStatusChange={handleStatusChange}
                  onDelete={deleteEmployee}
                  onCreateAccount={openCreateAccountDialog}
                  onSendMessage={startMessageWithEmployee}
                  onEdit={openEditDialog}
                  roleColors={roleColors}
                  statusColors={statusColors}
                />
              </div>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>Update the employee details below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <EmployeeFormFields />
              <Button type="submit" className="w-full bg-gradient-primary">
                Save Changes
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Account Dialog */}
        <Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Login Account</DialogTitle>
              <DialogDescription>
                Create a login account for {selectedEmployee?.name}. They will be able to access the Employee Portal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedEmployee?.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  placeholder="Set a password"
                  required
                />
              </div>
              <Button
                onClick={handleCreateAccount}
                disabled={creatingAccount || !accountPassword}
                className="w-full bg-gradient-primary"
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
