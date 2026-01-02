import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskFormSchema, type TaskFormValues } from "@/lib/validations";
import type { Creator } from "@/hooks/useCreators";
import type { Employee } from "@/hooks/useEmployees";

interface TaskFormProps {
  onSubmit: (data: TaskFormValues) => Promise<void>;
  isSubmitting?: boolean;
  creators: Creator[];
  employees: Employee[];
}

export function TaskForm({ onSubmit, isSubmitting, creators, employees }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "Medium",
      request_type: "general",
      due_date: "",
      assignee_id: "none",
      creator_id: "none",
    },
  });

  const handleFormSubmit = async (data: TaskFormValues) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Task title"
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Task description"
          rows={3}
          className={errors.description ? "border-destructive" : ""}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={errors.priority ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Request Type</Label>
          <Controller
            name="request_type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={errors.request_type ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="custom">Custom Request</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.request_type && (
            <p className="text-sm text-destructive">{errors.request_type.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Due Date</Label>
        <Input
          type="date"
          {...register("due_date")}
          className={errors.due_date ? "border-destructive" : ""}
        />
        {errors.due_date && (
          <p className="text-sm text-destructive">{errors.due_date.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Assign To</Label>
          <Controller
            name="assignee_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value || "none"} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Creator</Label>
          <Controller
            name="creator_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value || "none"} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No creator</SelectItem>
                  {creators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating..." : "Create Task"}
      </Button>
    </form>
  );
}
