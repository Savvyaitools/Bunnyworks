import { useState, useEffect, useCallback } from "react";
import { Target, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Goal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  goal_type: string;
  start_date: string;
  end_date: string | null;
}

export function GoalProgress() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    target_value: "100",
  });

  const fetchGoals = useCallback(async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (data) setGoals(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async () => {
    if (!formData.title || !formData.target_value) return;

    const { error } = await supabase
      .from("goals")
      .insert({
        title: formData.title,
        target_value: parseInt(formData.target_value),
        current_value: 0,
        goal_type: "custom",
      });

    if (error) {
      toast.error("Failed to create goal");
    } else {
      toast.success("Goal created");
      setFormData({ title: "", target_value: "100" });
      setIsAddOpen(false);
      fetchGoals();
    }
  };

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    const { error } = await supabase
      .from("goals")
      .update({ current_value: newValue })
      .eq("id", goalId);

    if (!error) {
      fetchGoals();
    }
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (!error) {
      toast.success("Goal deleted");
      fetchGoals();
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Goals
        </h3>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Goal title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Target value"
                value={formData.target_value}
                onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
              />
              <Button onClick={createGoal} className="w-full">Create Goal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const percentage = Math.min((goal.current_value / goal.target_value) * 100, 100);
          return (
            <div key={goal.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{goal.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {goal.current_value}/{goal.target_value}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={percentage} className="flex-1 h-2" />
                <Input
                  type="number"
                  className="w-16 h-7 text-xs"
                  value={goal.current_value}
                  onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No goals set. Create one to track progress.
          </p>
        )}
      </div>
    </div>
  );
}
