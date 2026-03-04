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
import { useEmployees, Employee } from "@/hooks/useEmployees";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { EmployeeCard } from "@/components/employees";
import { EmployeeForm } from "@/components/forms";
import type { EmployeeFormValues } from "@/lib/validations";
import { useAgency } from "@/hooks/useAgency";
import { AccountCreationDialog } from "@/components/shared/AccountCreationDialog";

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
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editDefaultValues, setEditDefaultValues] = useState<Partial<EmployeeFormValues>>({});

  const { employees, loading, stats, createEmployee, updateEmployee, deleteEmployee, refetch } = useEmployees();
  const { agencyId } = useAgency();

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (data: EmployeeFormValues, idDocumentUrl?: string) => {
    const skills = data.skills?.split(",").map(s => s.trim()).filter(Boolean) || [];
    const certs = data.certifications?.split(",").map(s => s.trim()).filter(Boolean) || [];
    const isChatter = data.role === "Chatter";

    await createEmployee({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      avatar_seed: data.name.toLowerCase().split(" ")[0],
      role: data.role,
      department: data.department || null,
      status: "Active",
      hire_date: new Date().toISOString().split("T")[0],
      assigned_creators: 0,
      salary: data.salary || 0,
      commission_rate: data.commission_rate || 0,
      bio: data.bio || null,
      skills: skills.length > 0 ? skills : null,
      education: data.education || null,
      experience: data.experience || null,
      certifications: certs.length > 0 ? certs : null,
      emergency_contact: data.emergency_contact || null,
      address: data.address || null,
      auth_user_id: null,
      skill_grade: (data.skill_grade || "B") as "A" | "B" | "C",
      is_chatter: isChatter,
      daily_target_messages: data.daily_target_messages || 100,
      daily_target_ppv: data.daily_target_ppv || 20,
      timezone: data.timezone || null,
      id_document_url: idDocumentUrl || null,
    });

    setIsAddDialogOpen(false);
  };

  const handleEditSubmit = async (data: EmployeeFormValues, idDocumentUrl?: string) => {
    if (!selectedEmployee) return;

    const skills = data.skills?.split(",").map(s => s.trim()).filter(Boolean) || [];
    const certs = data.certifications?.split(",").map(s => s.trim()).filter(Boolean) || [];
    const isChatter = data.role === "Chatter";

    await updateEmployee(selectedEmployee.id, {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      department: data.department || null,
      salary: data.salary || 0,
      commission_rate: data.commission_rate || 0,
      bio: data.bio || null,
      skills: skills.length > 0 ? skills : null,
      education: data.education || null,
      experience: data.experience || null,
      certifications: certs.length > 0 ? certs : null,
      emergency_contact: data.emergency_contact || null,
      address: data.address || null,
      skill_grade: data.skill_grade || "B",
      is_chatter: isChatter,
      daily_target_messages: data.daily_target_messages || 100,
      daily_target_ppv: data.daily_target_ppv || 20,
      timezone: data.timezone || null,
      ...(idDocumentUrl !== undefined ? { id_document_url: idDocumentUrl } : {}),
    });

    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleStatusChange = async (employee: Employee, newStatus: "Active" | "On Leave" | "Inactive") => {
    await updateEmployee(employee.id, { status: newStatus });
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditDefaultValues({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || "",
      role: employee.role,
      department: employee.department || "",
      salary: employee.salary || 0,
      commission_rate: employee.commission_rate || 0,
      bio: employee.bio || "",
      education: employee.education || "",
      experience: employee.experience || "",
      skills: employee.skills?.join(", ") || "",
      certifications: employee.certifications?.join(", ") || "",
      emergency_contact: employee.emergency_contact || "",
      address: employee.address || "",
      skill_grade: employee.skill_grade || "B",
      timezone: employee.timezone || "",
      daily_target_messages: employee.daily_target_messages || 100,
      daily_target_ppv: employee.daily_target_ppv || 20,
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenAccountDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsAccountDialogOpen(true);
  };

  const handleAccountCreated = async (entityId: string, authUserId: string) => {
    await updateEmployee(entityId, { auth_user_id: authUserId });
    
    // Also link to chatters table if they're a chatter
    const emp = employees.find(e => e.id === entityId);
    if (emp?.role === "Chatter") {
      const { data: chatter } = await supabase
        .from("chatters")
        .select("id")
        .ilike("email", emp.email)
        .maybeSingle();
      
      if (chatter) {
        await supabase
          .from("chatters")
          .update({ auth_user_id: authUserId })
          .eq("id", chatter.id);
      }
    }
    refetch();
  };

  const startMessageWithEmployee = (employee: Employee) => {
    navigate("/team-chat", { state: { preselectedEmployeeId: employee.id } });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Team</h1>
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
              <EmployeeForm onSubmit={handleSubmit} />
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
                  onCreateAccount={handleOpenAccountDialog}
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
            {isEditDialogOpen && (
              <EmployeeForm 
                onSubmit={handleEditSubmit}
                defaultValues={editDefaultValues}
                submitLabel="Save Changes"
                existingIdDocumentUrl={selectedEmployee?.id_document_url || undefined}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <AccountCreationDialog
        open={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
        entity={selectedEmployee}
        userType="employee"
        agencyId={agencyId}
        onAccountCreated={handleAccountCreated}
      />
    </DashboardLayout>
  );
}
