import { useState } from "react";
import {
  Mail,
  Phone,
  MoreVertical,
  Trash2,
  UserPlus,
  MessageSquare,
  DollarSign,
  Percent,
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Edit,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Employee } from "@/hooks/useEmployees";
import { formatCurrency } from "@/lib/formatters";

interface EmployeeCardProps {
  employee: Employee;
  onStatusChange: (employee: Employee, status: "Active" | "On Leave" | "Inactive") => void;
  onDelete: (id: string) => void;
  onCreateAccount: (employee: Employee) => void;
  onSendMessage: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  roleColors: Record<string, string>;
  statusColors: Record<string, string>;
}

export default function EmployeeCard({
  employee,
  onStatusChange,
  onDelete,
  onCreateAccount,
  onSendMessage,
  onEdit,
  roleColors,
  statusColors,
}: EmployeeCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <>
      <div className="glass-card p-5 hover:border-primary/30 transition-all duration-300 group">
        {/* Header with Avatar and Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/50 transition-all">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.avatar_seed || employee.name}`}
              />
              <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{employee.name}</h3>
              <Badge className={cn("text-xs border", roleColors[employee.role] || "bg-muted text-muted-foreground")}>
                {employee.role}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={() => onEdit(employee)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSendMessage(employee)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              {!employee.auth_user_id && (
                <DropdownMenuItem onClick={() => onCreateAccount(employee)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Login
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onStatusChange(employee, "Active")}>
                Set Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(employee, "On Leave")}>
                Set On Leave
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(employee, "Inactive")}>
                Set Inactive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(employee.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Employee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{employee.phone}</span>
            </div>
          )}
          {employee.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{employee.address}</span>
            </div>
          )}
        </div>

        {/* Salary & Commission */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Salary
            </div>
            <p className="text-foreground font-semibold">
              {employee.salary ? formatCurrency(employee.salary) : "—"}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Percent className="h-3.5 w-3.5" />
              Commission
            </div>
            <p className="text-foreground font-semibold">
              {employee.commission_rate ? `${employee.commission_rate}%` : "—"}
            </p>
          </div>
        </div>

        {/* Department & Status Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Dept: </span>
            <span className="text-foreground">{employee.department || "—"}</span>
          </div>
          <Badge className={cn("text-xs", statusColors[employee.status])}>
            {employee.status}
          </Badge>
        </div>

        {/* Skills Preview */}
        {employee.skills && employee.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {employee.skills.slice(0, 3).map((skill, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-background/50">
                  {skill}
                </Badge>
              ))}
              {employee.skills.length > 3 && (
                <Badge variant="outline" className="text-xs bg-background/50">
                  +{employee.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Assigned Creators & View Details */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="text-sm">
            <span className="text-foreground font-medium">{employee.assigned_creators}</span>
            <span className="text-muted-foreground"> creators assigned</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary/80"
            onClick={() => setIsDetailsOpen(true)}
          >
            View Details
          </Button>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-border">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.avatar_seed || employee.name}`}
                />
                <AvatarFallback className="bg-muted">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p>{employee.name}</p>
                <Badge className={cn("text-xs border mt-1", roleColors[employee.role])}>
                  {employee.role}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Bio */}
            {employee.bio && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">About</p>
                <p className="text-foreground text-sm">{employee.bio}</p>
              </div>
            )}

            {/* Experience */}
            {employee.experience && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Briefcase className="h-4 w-4" />
                  Experience
                </div>
                <p className="text-foreground text-sm">{employee.experience}</p>
              </div>
            )}

            {/* Education */}
            {employee.education && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <GraduationCap className="h-4 w-4" />
                  Education
                </div>
                <p className="text-foreground text-sm">{employee.education}</p>
              </div>
            )}

            {/* Certifications */}
            {employee.certifications && employee.certifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Award className="h-4 w-4" />
                  Certifications
                </div>
                <div className="flex flex-wrap gap-2">
                  {employee.certifications.map((cert, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {employee.skills && employee.skills.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.map((skill, i) => (
                    <Badge key={i} className="text-xs bg-primary/20 text-primary border-primary/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Compensation */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Salary</p>
                <p className="text-lg font-semibold text-foreground">
                  {employee.salary ? formatCurrency(employee.salary) : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commission Rate</p>
                <p className="text-lg font-semibold text-foreground">
                  {employee.commission_rate ? `${employee.commission_rate}%` : "Not set"}
                </p>
              </div>
            </div>

            {/* Emergency Contact */}
            {employee.emergency_contact && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-xs text-muted-foreground mb-1">Emergency Contact</p>
                <p className="text-foreground text-sm">{employee.emergency_contact}</p>
              </div>
            )}

            {/* Hire Date */}
            {employee.hire_date && (
              <div className="text-sm text-muted-foreground">
                Hired on: {new Date(employee.hire_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
