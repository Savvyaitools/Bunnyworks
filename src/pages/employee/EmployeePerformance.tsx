import { useState, useEffect, useCallback } from "react";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Star,
  Target,
  Trophy,
  BarChart3
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface PerformanceData {
  tasks_completed: number;
  tasks_assigned: number;
  messages_sent: number;
  avg_response_time_minutes: number | null;
  rating: number | null;
  revenue_generated: number;
  creators_managed: number;
}

interface TimeLogSummary {
  total_hours: number;
  days_worked: number;
}

export default function EmployeePerformancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentMonthData, setCurrentMonthData] = useState<PerformanceData | null>(null);
  const [lastMonthData, setLastMonthData] = useState<PerformanceData | null>(null);
  const [timeLogSummary, setTimeLogSummary] = useState<TimeLogSummary | null>(null);
  const [chatterId, setChatterId] = useState<string | null>(null);

  const fetchPerformanceData = useCallback(async () => {
    if (!user?.email) return;

    setLoading(true);

    // Get employee record
    const { data: empData } = await supabase
      .from("employees")
      .select("id")
      .ilike("email", user.email)
      .maybeSingle();

    if (!empData) {
      setLoading(false);
      return;
    }

    setEmployeeId(empData.id);

    // Check if chatter
    const { data: chatterData } = await supabase
      .from("chatters")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (chatterData) {
      setChatterId(chatterData.id);
    }

    const now = new Date();
    const currentMonthStart = startOfMonth(now).toISOString();
    const currentMonthEnd = endOfMonth(now).toISOString();
    const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
    const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

    // Fetch current month KPIs
    const { data: currentKPIs } = await supabase
      .from("employee_kpis")
      .select("*")
      .eq("employee_id", empData.id)
      .gte("period_start", currentMonthStart)
      .lte("period_end", currentMonthEnd);

    // Fetch last month KPIs
    const { data: lastKPIs } = await supabase
      .from("employee_kpis")
      .select("*")
      .eq("employee_id", empData.id)
      .gte("period_start", lastMonthStart)
      .lte("period_end", lastMonthEnd);

    // Aggregate KPIs
    const aggregateKPIs = (kpis: typeof currentKPIs): PerformanceData | null => {
      if (!kpis || kpis.length === 0) return null;
      return {
        tasks_completed: kpis.reduce((sum, k) => sum + k.tasks_completed, 0),
        tasks_assigned: kpis.reduce((sum, k) => sum + k.tasks_assigned, 0),
        messages_sent: kpis.reduce((sum, k) => sum + k.messages_sent, 0),
        avg_response_time_minutes: kpis[0]?.avg_response_time_minutes || null,
        rating: kpis.filter(k => k.rating).length > 0 
          ? kpis.filter(k => k.rating).reduce((sum, k) => sum + (k.rating || 0), 0) / kpis.filter(k => k.rating).length
          : null,
        revenue_generated: kpis.reduce((sum, k) => sum + Number(k.revenue_generated), 0),
        creators_managed: kpis[0]?.creators_managed || 0,
      };
    };

    setCurrentMonthData(aggregateKPIs(currentKPIs));
    setLastMonthData(aggregateKPIs(lastKPIs));

    // Fetch time logs if chatter
    if (chatterData) {
      const { data: timeLogs } = await supabase
        .from("chatter_time_logs")
        .select("clock_in, clock_out, duration_minutes")
        .eq("chatter_id", chatterData.id)
        .gte("clock_in", currentMonthStart)
        .lte("clock_in", currentMonthEnd)
        .not("clock_out", "is", null);

      if (timeLogs && timeLogs.length > 0) {
        const totalMinutes = timeLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
        const uniqueDays = new Set(timeLogs.map(log => format(new Date(log.clock_in), "yyyy-MM-dd"))).size;
        setTimeLogSummary({
          total_hours: Math.round(totalMinutes / 60 * 10) / 10,
          days_worked: uniqueDays,
        });
      }
    }

    setLoading(false);
  }, [user?.email, user?.id]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  const completionRate = currentMonthData && currentMonthData.tasks_assigned > 0
    ? (currentMonthData.tasks_completed / currentMonthData.tasks_assigned) * 100
    : 0;

  const lastMonthCompletionRate = lastMonthData && lastMonthData.tasks_assigned > 0
    ? (lastMonthData.tasks_completed / lastMonthData.tasks_assigned) * 100
    : 0;

  const completionChange = completionRate - lastMonthCompletionRate;

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">My Performance</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "MMMM yyyy")} Overview
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <Card className="stat-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {currentMonthData?.messages_sent || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Messages Sent</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {currentMonthData?.tasks_completed || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Tasks Done</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Tracking (for chatters) */}
        {timeLogSummary && (
          <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Time This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-3xl font-bold text-foreground">{timeLogSummary.total_hours}h</p>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-3xl font-bold text-foreground">{timeLogSummary.days_worked}</p>
                  <p className="text-sm text-muted-foreground">Days Worked</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Completion Rate */}
        <Card className="animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {currentMonthData?.tasks_completed || 0} of {currentMonthData?.tasks_assigned || 0} tasks
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{Math.round(completionRate)}%</span>
                {completionChange !== 0 && (
                  <Badge variant={completionChange > 0 ? "default" : "destructive"} className="text-xs">
                    {completionChange > 0 ? "+" : ""}{Math.round(completionChange)}%
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={completionRate} className="h-3" />
          </CardContent>
        </Card>

        {/* Rating */}
        {currentMonthData?.rating && (
          <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Performance Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-foreground">
                  {currentMonthData.rating.toFixed(1)}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 ${
                        star <= currentMonthData.rating!
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Generated (if applicable) */}
        {currentMonthData && currentMonthData.revenue_generated > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: "250ms" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Revenue Contribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                ${currentMonthData.revenue_generated.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Generated from {currentMonthData.creators_managed} managed creator(s)
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Data State */}
        {!currentMonthData && (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Your performance metrics will appear here as you complete tasks and activities this month.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  );
}
