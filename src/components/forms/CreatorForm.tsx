import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { creatorFormSchema, type CreatorFormValues } from "@/lib/validations";

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
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Creator name"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="creator@email.com"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Input
            id="platform"
            {...register("platform")}
            placeholder="Fansly, etc."
            className={errors.platform ? "border-destructive" : ""}
          />
          {errors.platform && (
            <p className="text-sm text-destructive">{errors.platform.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="followers">Followers</Label>
          <Input
            id="followers"
            {...register("followers")}
            placeholder="1.5M"
            className={errors.followers ? "border-destructive" : ""}
          />
          {errors.followers && (
            <p className="text-sm text-destructive">{errors.followers.message}</p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-primary"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Adding..." : "Add Creator"}
      </Button>
    </form>
  );
}
