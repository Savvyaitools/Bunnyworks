import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creatorFormSchema, type CreatorFormValues } from "@/lib/validations";
import { FormField, FormRow } from "./FormField";
import { FormSubmitButton } from "./FormSubmitButton";

interface CreatorFormProps {
  onSubmit: (data: CreatorFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreatorForm({ onSubmit, isSubmitting }: CreatorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatorFormValues>({
    resolver: zodResolver(creatorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      platform: "",
      followers: "",
    },
  });

  const handleFormSubmit = async (data: CreatorFormValues) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <FormField
        type="text"
        name="name"
        label="Name"
        placeholder="Creator name"
        register={register}
        error={errors.name}
        required
      />

      <FormField
        type="email"
        name="email"
        label="Email"
        placeholder="creator@email.com"
        register={register}
        error={errors.email}
        required
      />

      <FormRow>
        <FormField
          type="text"
          name="platform"
          label="Platform"
          placeholder="Fansly, etc."
          register={register}
          error={errors.platform}
        />

        <FormField
          type="text"
          name="followers"
          label="Followers"
          placeholder="1.5M"
          register={register}
          error={errors.followers}
        />
      </FormRow>

      <FormSubmitButton
        isSubmitting={isSubmitting}
        label="Add Creator"
        loadingLabel="Adding..."
      />
    </form>
  );
}
