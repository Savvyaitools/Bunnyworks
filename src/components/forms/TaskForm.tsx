import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskFormSchema, type TaskFormValues } from "@/lib/validations";
import { FormField, FormRow } from "./FormField";
import { FormSubmitButton } from "./FormSubmitButton";
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

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Urgent", label: "Urgent" },
  ];

  const requestTypeOptions = [
    { value: "general", label: "General" },
    { value: "custom", label: "Custom Request" },
  ];

  const employeeOptions = [
    { value: "none", label: "Unassigned" },
    ...employees.map((emp) => ({ value: emp.id, label: emp.name })),
  ];

  const creatorOptions = [
    { value: "none", label: "No creator" },
    ...creators.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField
        type="text"
        name="title"
        label="Title"
        placeholder="Task title"
        register={register}
        error={errors.title}
        required
      />

      <FormField
        type="textarea"
        name="description"
        label="Description"
        placeholder="Task description"
        register={register}
        error={errors.description}
        rows={3}
      />

      <FormRow>
        <FormField
          type="select"
          name="priority"
          label="Priority"
          control={control}
          options={priorityOptions}
          error={errors.priority}
        />

        <FormField
          type="select"
          name="request_type"
          label="Request Type"
          control={control}
          options={requestTypeOptions}
          error={errors.request_type}
        />
      </FormRow>

      <FormField
        type="date"
        name="due_date"
        label="Due Date"
        register={register}
        error={errors.due_date}
      />

      <FormRow>
        <FormField
          type="select"
          name="assignee_id"
          label="Assign To"
          control={control}
          options={employeeOptions}
          placeholder="Select employee"
        />

        <FormField
          type="select"
          name="creator_id"
          label="Creator"
          control={control}
          options={creatorOptions}
          placeholder="Select creator"
        />
      </FormRow>

      <FormSubmitButton
        isSubmitting={isSubmitting}
        label="Create Task"
        loadingLabel="Creating..."
      />
    </form>
  );
}
