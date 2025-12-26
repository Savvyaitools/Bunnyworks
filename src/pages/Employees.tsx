import { useState } from "react";
import { Search, Plus, Mail, MoreVertical } from "lucide-react";
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
import { cn } from "@/lib/utils";

type EmployeeRole = "Manager" | "VA" | "Chatter" | "Admin";

interface Employee {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: EmployeeRole;
  assignedCreators: number;
  status: "Active" | "Onboarding" | "Inactive";
  joinDate: string;
}

const employees: Employee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "sarah",
    email: "sarah@agency.com",
    role: "Manager",
    assignedCreators: 8,
    status: "Active",
    joinDate: "Jan 2023",
  },
  {
    id: "2",
    name: "Mike Chen",
    avatar: "mike",
    email: "mike@agency.com",
    role: "Manager",
    assignedCreators: 6,
    status: "Active",
    joinDate: "Mar 2023",
  },
  {
    id: "3",
    name: "Alex Rivera",
    avatar: "alex",
    email: "alex@agency.com",
    role: "VA",
    assignedCreators: 4,
    status: "Active",
    joinDate: "Jun 2023",
  },
  {
    id: "4",
    name: "Jordan Lee",
    avatar: "jordan",
    email: "jordan@agency.com",
    role: "Chatter",
    assignedCreators: 5,
    status: "Active",
    joinDate: "Aug 2023",
  },
  {
    id: "5",
    name: "Taylor Swift",
    avatar: "taylor",
    email: "taylor@agency.com",
    role: "VA",
    assignedCreators: 3,
    status: "Onboarding",
    joinDate: "Dec 2024",
  },
  {
    id: "6",
    name: "Chris Parker",
    avatar: "chris",
    email: "chris@agency.com",
    role: "Chatter",
    assignedCreators: 0,
    status: "Inactive",
    joinDate: "Sep 2023",
  },
];

const roleColors: Record<EmployeeRole, string> = {
  Admin: "bg-primary/20 text-primary border-primary/30",
  Manager: "bg-accent/20 text-accent border-accent/30",
  VA: "bg-warning/20 text-warning border-warning/30",
  Chatter: "bg-success/20 text-success border-success/30",
};

const statusColors: Record<string, string> = {
  Active: "badge-active",
  Onboarding: "badge-onboarding",
  Inactive: "badge-paused",
};

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Employees</h1>
            <p className="text-muted-foreground mt-1">Manage your team members and assignments</p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
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
                <TableHead className="text-muted-foreground">Assigned Creators</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee, index) => (
                <TableRow 
                  key={employee.id} 
                  className="table-row-hover border-border animate-fade-in"
                  style={{ animationDelay: `${200 + index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-border">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.avatar}`} />
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
                    <Badge className={cn("text-xs border", roleColors[employee.role])}>
                      {employee.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground font-medium">{employee.assignedCreators}</span>
                    <span className="text-muted-foreground"> creators</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", statusColors[employee.status])}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.joinDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Manage Assignments</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove Employee</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No employees found matching your search.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
