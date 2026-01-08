import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema, type EmployeeFormValues } from "@/lib/validations";
import { FormField, FormRow } from "./FormField";
import { FormSubmitButton } from "./FormSubmitButton";

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormValues) => Promise<void>;
  isSubmitting?: boolean;
  defaultValues?: Partial<EmployeeFormValues>;
  submitLabel?: string;
}

export function EmployeeForm({ 
  onSubmit, 
  isSubmitting, 
  defaultValues,
  submitLabel = "Add Employee" 
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      salary: 0,
      commission_rate: 0,
      bio: "",
      experience: "",
      education: "",
      skills: "",
      certifications: "",
      emergency_contact: "",
      address: "",
      skill_grade: "B",
      timezone: "",
      daily_target_messages: 100,
      daily_target_ppv: 20,
      ...defaultValues,
    },
  });

  // Watch the role field to conditionally show chatter fields
  const selectedRole = useWatch({ control, name: "role" });
  const isChatterRole = selectedRole === "Chatter";

  const handleFormSubmit = async (data: EmployeeFormValues) => {
    await onSubmit(data);
    if (!defaultValues) {
      reset();
    }
  };

  const roleOptions = [
    { value: "Manager", label: "Manager" },
    { value: "Marketing", label: "Marketing" },
    { value: "Quality Controller", label: "Quality Controller" },
    { value: "Chatter", label: "Chatter" },
    { value: "VA", label: "VA" },
    { value: "Recruiter", label: "Recruiter" },
    { value: "Finance", label: "Finance" },
  ];

  const departmentOptions = [
    { value: "Management", label: "Management" },
    { value: "Production", label: "Production" },
    { value: "Marketing", label: "Marketing" },
    { value: "Strategy", label: "Strategy" },
  ];

  const skillGradeOptions = [
    { value: "A", label: "Grade A (Expert)" },
    { value: "B", label: "Grade B (Intermediate)" },
    { value: "C", label: "Grade C (Beginner)" },
  ];

  const timezoneOptions = [
    { value: "America/New_York", label: "EST (New York)" },
    { value: "America/Chicago", label: "CST (Chicago)" },
    { value: "America/Denver", label: "MST (Denver)" },
    { value: "America/Los_Angeles", label: "PST (Los Angeles)" },
    { value: "Europe/London", label: "GMT (London)" },
    { value: "Europe/Paris", label: "CET (Paris)" },
    { value: "Asia/Dubai", label: "GST (Dubai)" },
    { value: "Asia/Manila", label: "PHT (Manila)" },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormRow>
        <FormField
          type="text"
          name="name"
          label="Name"
          placeholder="Employee name"
          register={register}
          error={errors.name}
          required
        />
        <FormField
          type="email"
          name="email"
          label="Email"
          placeholder="employee@agency.com"
          register={register}
          error={errors.email}
          required
        />
      </FormRow>

      <FormRow>
        <FormField
          type="text"
          name="phone"
          label="Phone"
          placeholder="+1 234 567 8900"
          register={register}
          error={errors.phone}
        />
        <FormField
          type="text"
          name="address"
          label="Address"
          placeholder="City, Country"
          register={register}
          error={errors.address}
        />
      </FormRow>

      <FormRow>
        <FormField
          type="select"
          name="role"
          label="Role"
          control={control}
          options={roleOptions}
          placeholder="Select role"
          error={errors.role}
          required
        />
        <FormField
          type="select"
          name="department"
          label="Department"
          control={control}
          options={departmentOptions}
          placeholder="Select dept"
        />
      </FormRow>

      {/* Chatter-specific fields - only show when role is Chatter */}
      {isChatterRole && (
        <>
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Chatter Settings</h4>
          </div>
          <FormRow>
            <FormField
              type="select"
              name="skill_grade"
              label="Skill Grade"
              control={control}
              options={skillGradeOptions}
              placeholder="Select grade"
            />
            <FormField
              type="select"
              name="timezone"
              label="Timezone"
              control={control}
              options={timezoneOptions}
              placeholder="Select timezone"
            />
          </FormRow>
          <FormRow>
            <FormField
              type="number"
              name="daily_target_messages"
              label="Daily Message Target"
              placeholder="100"
              register={register}
              error={errors.daily_target_messages}
              valueAsNumber
            />
            <FormField
              type="number"
              name="daily_target_ppv"
              label="Daily PPV Target"
              placeholder="20"
              register={register}
              error={errors.daily_target_ppv}
              valueAsNumber
            />
          </FormRow>
        </>
      )}

      <FormRow>
        <FormField
          type="number"
          name="salary"
          label="Monthly Salary ($)"
          placeholder="5000"
          register={register}
          error={errors.salary}
          valueAsNumber
        />
        <FormField
          type="number"
          name="commission_rate"
          label="Commission Rate (%)"
          placeholder="10"
          register={register}
          error={errors.commission_rate}
          valueAsNumber
        />
      </FormRow>

      <FormField
        type="textarea"
        name="bio"
        label="Bio"
        placeholder="Brief description about the employee..."
        register={register}
        error={errors.bio}
        rows={2}
      />

      <FormRow>
        <FormField
          type="text"
          name="experience"
          label="Experience"
          placeholder="5 years in marketing"
          register={register}
          error={errors.experience}
        />
        <FormField
          type="text"
          name="education"
          label="Education"
          placeholder="MBA from Stanford"
          register={register}
          error={errors.education}
        />
      </FormRow>

      <FormField
        type="text"
        name="skills"
        label="Skills (comma-separated)"
        placeholder="Marketing, Sales, Analytics"
        register={register}
        error={errors.skills}
      />

      <FormField
        type="text"
        name="certifications"
        label="Certifications (comma-separated)"
        placeholder="Google Analytics, HubSpot"
        register={register}
        error={errors.certifications}
      />

      <FormField
        type="text"
        name="emergency_contact"
        label="Emergency Contact"
        placeholder="John Doe - +1 234 567 8900"
        register={register}
        error={errors.emergency_contact}
      />

      <FormSubmitButton
        isSubmitting={isSubmitting}
        label={submitLabel}
        loadingLabel="Saving..."
      />
    </form>
  );
}
