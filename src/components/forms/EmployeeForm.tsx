import { useForm } from "react-hook-form";
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
      ...defaultValues,
    },
  });

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
