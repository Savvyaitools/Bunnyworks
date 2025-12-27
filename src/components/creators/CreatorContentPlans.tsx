import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, CheckCircle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContentPlan {
  id: string;
  title: string;
  description: string | null;
  scheduled_date: string | null;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  platform: string | null;
  creator_id: string;
}

interface CreatorContentPlansProps {
  creatorId: string;
}

const statusStyles: Record<string, string> = {
  planned: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export function CreatorContentPlans({ creatorId }: CreatorContentPlansProps) {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_date: "",
    platform: "",
  });

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from("content_plans")
      .select("*")
      .eq("creator_id", creatorId)
      .order("scheduled_date", { ascending: true });

    if (data) setPlans(data as ContentPlan[]);
  }, [creatorId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const createPlan = async () => {
    if (!formData.title.trim()) return;

    const { error } = await supabase
      .from("content_plans")
      .insert({
        title: formData.title,
        description: formData.description || null,
        scheduled_date: formData.scheduled_date || null,
        platform: formData.platform || null,
        creator_id: creatorId,
        status: "planned",
      });

    if (error) {
      toast.error("Failed to create content plan");
    } else {
      toast.success("Content plan created");
      setFormData({ title: "", description: "", scheduled_date: "", platform: "" });
      setIsAddOpen(false);
      fetchPlans();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("content_plans")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      fetchPlans();
    }
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase
      .from("content_plans")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete plan");
    } else {
      toast.success("Plan deleted");
      fetchPlans();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Content Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
              <Input
                placeholder="Platform (e.g., OnlyFans, Instagram)"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              />
              <Button onClick={createPlan} className="w-full">Create Plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-4 rounded-lg border border-border bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-foreground">{plan.title}</h4>
                  <Badge className={cn("text-xs", statusStyles[plan.status])}>
                    {plan.status.replace("_", " ")}
                  </Badge>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {plan.scheduled_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(plan.scheduled_date).toLocaleDateString()}
                    </span>
                  )}
                  {plan.platform && (
                    <span>{plan.platform}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={plan.status}
                  onValueChange={(value) => updateStatus(plan.id, value)}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => deletePlan(plan.id)}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No content plans yet. Create your first plan.</p>
        </div>
      )}
    </div>
  );
}
