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
import { employeeFormSchema, type EmployeeFormValues } from "@/lib/validations";

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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Employee name"
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="employee@agency.com"
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="+1 234 567 8900"
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            {...register("address")}
            placeholder="City, Country"
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Quality Controller">Quality Controller</SelectItem>
                  <SelectItem value="Chatter">Chatter</SelectItem>
                  <SelectItem value="VA">VA</SelectItem>
                  <SelectItem value="Recruiter">Recruiter</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Strategy">Strategy</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Monthly Salary ($)</Label>
          <Input
            id="salary"
            type="number"
            {...register("salary", { valueAsNumber: true })}
            placeholder="5000"
            className={errors.salary ? "border-destructive" : ""}
          />
          {errors.salary && (
            <p className="text-sm text-destructive">{errors.salary.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="commission_rate">Commission Rate (%)</Label>
          <Input
            id="commission_rate"
            type="number"
            {...register("commission_rate", { valueAsNumber: true })}
            placeholder="10"
            className={errors.commission_rate ? "border-destructive" : ""}
          />
          {errors.commission_rate && (
            <p className="text-sm text-destructive">{errors.commission_rate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          placeholder="Brief description about the employee..."
          rows={2}
          className={errors.bio ? "border-destructive" : ""}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experience">Experience</Label>
          <Input
            id="experience"
            {...register("experience")}
            placeholder="5 years in marketing"
            className={errors.experience ? "border-destructive" : ""}
          />
          {errors.experience && (
            <p className="text-sm text-destructive">{errors.experience.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="education">Education</Label>
          <Input
            id="education"
            {...register("education")}
            placeholder="MBA from Stanford"
            className={errors.education ? "border-destructive" : ""}
          />
          {errors.education && (
            <p className="text-sm text-destructive">{errors.education.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Input
          id="skills"
          {...register("skills")}
          placeholder="Marketing, Sales, Analytics"
          className={errors.skills ? "border-destructive" : ""}
        />
        {errors.skills && (
          <p className="text-sm text-destructive">{errors.skills.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="certifications">Certifications (comma-separated)</Label>
        <Input
          id="certifications"
          {...register("certifications")}
          placeholder="Google Analytics, HubSpot"
          className={errors.certifications ? "border-destructive" : ""}
        />
        {errors.certifications && (
          <p className="text-sm text-destructive">{errors.certifications.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergency_contact">Emergency Contact</Label>
        <Input
          id="emergency_contact"
          {...register("emergency_contact")}
          placeholder="John Doe - +1 234 567 8900"
          className={errors.emergency_contact ? "border-destructive" : ""}
        />
        {errors.emergency_contact && (
          <p className="text-sm text-destructive">{errors.emergency_contact.message}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
