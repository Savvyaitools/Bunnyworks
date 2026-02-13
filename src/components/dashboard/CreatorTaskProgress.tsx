import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface CreatorTaskStats {
  id: string;
  name: string;
  avatar_seed: string | null;
  completed: number;
  total: number;
}

export function CreatorTaskProgress() {
  const { agency } = useAgency();
  const agencyId = agency?.id;

  const { data: creatorStats, isLoading } = useQuery({
    queryKey: ["creator-task-progress", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const { data: creators, error: creatorsError } = await supabase
        .from("creators")
        .select("id, name, avatar_seed")
        .eq("agency_id", agencyId!)
        .eq("status", "Active");

      if (creatorsError) throw creatorsError;

      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("creator_id, status")
        .eq("agency_id", agencyId!)
        .not("creator_id", "is", null);

      if (tasksError) throw tasksError;

      const stats: CreatorTaskStats[] = creators?.map(creator => {
        const creatorTasks = tasks?.filter(t => t.creator_id === creator.id) || [];
        const completed = creatorTasks.filter(t => t.status === "Completed").length;
        return {
          id: creator.id,
          name: creator.name,
          avatar_seed: creator.avatar_seed,
          completed,
          total: creatorTasks.length,
        };
      }).filter(s => s.total > 0) || [];

      return stats.slice(0, 5);
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Creator Task Progress
      </h3>
      
      <div className="space-y-4">
        {creatorStats?.map(creator => {
          const percentage = creator.total > 0 
            ? Math.round((creator.completed / creator.total) * 100) 
            : 0;
          
          return (
            <div key={creator.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar_seed || creator.name}`} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {creator.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{creator.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {creator.completed}/{creator.total} ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            </div>
          );
        })}

        {(!creatorStats || creatorStats.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No creator tasks to display.
          </p>
        )}
      </div>
    </div>
  );
}
