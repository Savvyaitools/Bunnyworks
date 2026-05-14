import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeFormSchema, type EmployeeFormValues } from "@/lib/validations";
import { FormField, FormRow } from "./FormField";
import { FormSubmitButton } from "./FormSubmitButton";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/shared/AvatarUpload";

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormValues, idDocumentUrl?: string, avatarUrl?: string | null) => Promise<void>;
  isSubmitting?: boolean;
  defaultValues?: Partial<EmployeeFormValues>;
  submitLabel?: string;
  existingIdDocumentUrl?: string;
  existingAvatarUrl?: string | null;
}

export function EmployeeForm({ 
  onSubmit, 
  isSubmitting, 
  defaultValues,
  submitLabel = "Add Employee",
  existingIdDocumentUrl,
  existingAvatarUrl,
}: EmployeeFormProps) {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(existingIdDocumentUrl || null);
  const [uploadingId, setUploadingId] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingAvatarUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const removeIdFile = () => {
    setIdFile(null);
    setIdPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadIdDocument = async (): Promise<string | undefined> => {
    if (!idFile) return existingIdDocumentUrl || undefined;
    setUploadingId(true);
    try {
      const ext = idFile.name.split(".").pop();
      const path = `id-documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("employee-documents").upload(path, idFile);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("employee-documents").getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      toast.error("Failed to upload ID document");
      return undefined;
    } finally {
      setUploadingId(false);
    }
  };

  const handleFormSubmit = async (data: EmployeeFormValues) => {
    const idUrl = await uploadIdDocument();
    await onSubmit(data, idUrl, avatarUrl);
    if (!defaultValues) {
      reset();
      removeIdFile();
      setAvatarUrl(null);
    }
  };

  const roleOptions = [
    { value: "Manager", label: "Manager" },
    { value: "Editor", label: "Editor" },
    { value: "Quality Controller", label: "Quality Controller" },
    { value: "Chatter", label: "Chatter" },
    { value: "VA", label: "VA" },
    { value: "Recruiter", label: "Recruiter" },
  ];

  const departmentOptions = [
    { value: "Platform Management", label: "Platform Management" },
    { value: "Marketing", label: "Marketing" },
    { value: "Chatting", label: "Chatting" },
    { value: "Financial", label: "Financial" },
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
      <AvatarUpload
        name={(defaultValues?.name as string) || ""}
        currentUrl={avatarUrl}
        onChange={setAvatarUrl}
      />

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
        name="skills"
        label="Skills (comma-separated)"
        placeholder="Marketing, Sales, Analytics"
        register={register}
        error={errors.skills}
      />

      <FormField
        type="text"
        name="emergency_contact"
        label="Emergency Contact"
        placeholder="John Doe - +1 234 567 8900"
        register={register}
        error={errors.emergency_contact}
      />

      {/* ID Document Upload */}
      <div className="space-y-2 border-t border-border pt-4 mt-4">
        <Label>ID Document</Label>
        <p className="text-xs text-muted-foreground">Upload a photo of their government-issued ID</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleIdFileChange}
          className="hidden"
        />
        {idPreview ? (
          <div className="relative inline-block">
            {idPreview.endsWith(".pdf") ? (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <FileImage className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm truncate max-w-[200px]">{idFile?.name || "ID Document"}</span>
              </div>
            ) : (
              <img src={idPreview} alt="ID preview" className="h-32 rounded-lg object-cover border border-border" />
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={removeIdFile}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 border-dashed"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload ID
          </Button>
        )}
      </div>

      <FormSubmitButton
        isSubmitting={isSubmitting || uploadingId}
        label={submitLabel}
        loadingLabel={uploadingId ? "Uploading..." : "Saving..."}
      />
    </form>
  );
}
