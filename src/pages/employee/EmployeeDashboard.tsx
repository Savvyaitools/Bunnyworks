import { useNavigate } from "react-router-dom";
import { Clock, Calendar, User, Globe, BarChart3, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { ClockInWidget } from "@/components/shifts/ClockInWidget";
import { useQuery } from "@tanstack/react-query";

export default function EmployeeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: employeeData, isLoading } = useQuery({
    queryKey: ["employee-data", user?.email],
    enabled: Boolean(user?.email),
    queryFn: async () => {
      const { data: empData } = await supabase
        .from("employees")
        .select("*")
        .ilike("email", user!.email!)
        .maybeSingle();
      return empData;
    },
  });

  const { data: chatterData } = useQuery({
    queryKey: ["chatter-data", user?.id],
    enabled: Boolean(user?.id && employeeData?.role === "Chatter"),
    queryFn: async () => {
      const { data } = await supabase
        .from("chatters")
        .select("id, name, skill_grade")
        .eq("auth_user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  if (!employeeData) {
    return (
      <EmployeeLayout>
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Account Not Linked</h2>
          <p className="text-muted-foreground mb-4">
            Your account is not linked to an employee record. Please contact your administrator.
          </p>
          <Button onClick={() => signOut()} variant="outline">
            Sign Out
          </Button>
        </div>
      </EmployeeLayout>
    );
  }

  const isChatter = employeeData.role === "Chatter";

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="glass-card p-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${employeeData.avatar_seed || employeeData.name}`} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                {employeeData.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Welcome, {employeeData.name.split(" ")[0]}!</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {employeeData.role}
                </Badge>
                {employeeData.department && (
                  <span className="text-sm text-muted-foreground">{employeeData.department}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <button 
            onClick={() => navigate("/employee/browser")}
            className="stat-card text-left hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">Browser</p>
                <p className="text-sm text-muted-foreground">Launch Sessions</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => navigate("/employee/performance")}
            className="stat-card text-left hover:border-accent/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">Performance</p>
                <p className="text-sm text-muted-foreground">View Stats</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-accent" />
              </div>
            </div>
          </button>
        </div>

        {/* Clock In Widget for Chatters */}
        {isChatter && chatterData && (
          <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Time Tracking</h2>
            <ClockInWidget chatterId={chatterData.id} chatterName={chatterData.name} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate("/employee/browser")}
            >
              <Globe className="h-5 w-5" />
              <span>Platform Access</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate("/employee/performance")}
            >
              <TrendingUp className="h-5 w-5" />
              <span>My Stats</span>
            </Button>
            {isChatter && (
              <>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate("/employee/shifts")}
                >
                  <Calendar className="h-5 w-5" />
                  <span>My Shifts</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => navigate("/employee/time-logs")}
                >
                  <Clock className="h-5 w-5" />
                  <span>Time Logs</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
