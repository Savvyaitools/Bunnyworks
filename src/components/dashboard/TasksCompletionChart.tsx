import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

export function TasksCompletionChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["tasks-completion-chart"],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 13); // Last 14 days

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("updated_at, status")
        .eq("status", "Completed")
        .gte("updated_at", startOfDay(startDate).toISOString());

      if (error) throw error;

      // Generate all days in range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Count tasks per day
      const countByDay: Record<string, number> = {};
      days.forEach(day => {
        countByDay[format(day, "yyyy-MM-dd")] = 0;
      });

      tasks?.forEach(task => {
        const dayKey = format(new Date(task.updated_at), "yyyy-MM-dd");
        if (countByDay[dayKey] !== undefined) {
          countByDay[dayKey]++;
        }
      });

      return days.map(day => ({
        date: format(day, "MMM d"),
        completed: countByDay[format(day, "yyyy-MM-dd")],
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Tasks Completed (Last 14 Days)</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area 
              type="monotone" 
              dataKey="completed" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#tasksGradient)"
              name="Completed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
