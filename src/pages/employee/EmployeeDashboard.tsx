import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, MessageSquare, ClipboardList, User, MessageCircle, BarChart3, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { ClockInWidget } from "@/components/shifts/ClockInWidget";
import { cn } from "@/lib/utils";

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  status: string;
  avatar_seed: string | null;
}

interface ChatterData {
  id: string;
  name: string;
  skill_grade: string;
}

export default function EmployeeDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [chatterData, setChatterData] = useState<ChatterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchEmployeeData = useCallback(async () => {
    if (!user?.email) return;

    // Fetch employee record by email
    const { data: empData, error: empError } = await supabase
      .from("employees")
      .select("*")
      .ilike("email", user.email)
      .maybeSingle();

    if (empData) {
      setEmployeeData(empData);

      // If role is Chatter, also fetch chatter data
      if (empData.role === "Chatter") {
        const { data: chatData } = await supabase
          .from("chatters")
          .select("id, name, skill_grade")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        
        if (chatData) {
          setChatterData(chatData);
        }
      }

      // Fetch unread message count
      const { count } = await supabase
        .from("internal_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", empData.id)
        .eq("recipient_type", "employee")
        .eq("read", false);
      
      setUnreadMessages(count || 0);
    }

    setLoading(false);
  }, [user?.email, user?.id]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  if (loading) {
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
            onClick={() => navigate("/employee/onlyfans")}
            className="stat-card text-left hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-foreground">OnlyFans</p>
                <p className="text-sm text-muted-foreground">Chats & Messages</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
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
              onClick={() => navigate("/employee/onlyfans")}
            >
              <MessageCircle className="h-5 w-5" />
              <span>OnlyFans</span>
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