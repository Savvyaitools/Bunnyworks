import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creatorFormSchema, type CreatorFormValues } from "@/lib/validations";
import { FormField, FormRow } from "./FormField";
import { FormSubmitButton } from "./FormSubmitButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Globe, FileText, Link2 } from "lucide-react";

interface CreatorFormProps {
  onSubmit: (data: CreatorFormValues) => Promise<void>;
  isSubmitting?: boolean;
  mode?: "quick" | "full";
}

export function CreatorForm({ onSubmit, isSubmitting, mode = "quick" }: CreatorFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatorFormValues>({
    resolver: zodResolver(creatorFormSchema),
    defaultValues: {
      name: "",
      alias: "",
      email: "",
      phone: "",
      platform: "",
      followers: "",
      persona: "",
      niche: "",
      content_style: "",
      onlyfans_url: "",
      instagram_url: "",
      twitter_url: "",
      tiktok_url: "",
      notes: "",
    },
  });

  const handleFormSubmit = async (data: CreatorFormValues) => {
    await onSubmit(data);
    reset();
  };

  // Quick mode - simplified form for dialogs
  if (mode === "quick") {
    return (
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormRow>
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
            type="text"
            name="alias"
            label="Alias / Stage Name"
            placeholder="@username"
            register={register}
            error={errors.alias}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="email"
            name="email"
            label="Email"
            placeholder="creator@email.com"
            register={register}
            error={errors.email}
            required
          />
          <FormField
            type="tel"
            name="phone"
            label="Phone"
            placeholder="+1 234 567 8900"
            register={register}
            error={errors.phone}
          />
        </FormRow>

        <FormRow>
          <FormField
            type="text"
            name="platform"
            label="Primary Platform"
            placeholder="OnlyFans, Fansly, etc."
            register={register}
            error={errors.platform}
          />
          <FormField
            type="text"
            name="followers"
            label="Followers"
            placeholder="50K, 1.2M"
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

  // Full mode - comprehensive questionnaire
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
            <FormRow>
              <FormField
                type="text"
                name="name"
                label="Full Name"
                placeholder="Creator's full name"
                register={register}
                error={errors.name}
                required
              />
              <FormField
                type="text"
                name="alias"
                label="Alias / Stage Name"
                placeholder="@username or stage name"
                register={register}
                error={errors.alias}
              />
            </FormRow>

            <FormRow>
              <FormField
                type="email"
                name="email"
                label="Email Address"
                placeholder="creator@email.com"
                register={register}
                error={errors.email}
                required
              />
              <FormField
                type="tel"
                name="phone"
                label="Phone Number"
                placeholder="+1 234 567 8900"
                register={register}
                error={errors.phone}
              />
            </FormRow>
          </div>
        </TabsContent>

        {/* Platform Tab */}
        <TabsContent value="platform" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Platform & Audience</h4>
            <FormRow>
              <FormField
                type="text"
                name="platform"
                label="Primary Platform"
                placeholder="OnlyFans, Fansly, Fanvue"
                register={register}
                error={errors.platform}
              />
              <FormField
                type="text"
                name="followers"
                label="Total Followers"
                placeholder="50K, 1.2M, etc."
                register={register}
                error={errors.followers}
              />
            </FormRow>

            <h4 className="text-sm font-medium text-muted-foreground pt-4">Content & Persona</h4>
            <FormField
              type="text"
              name="niche"
              label="Niche / Category"
              placeholder="Fitness, Lifestyle, Cosplay, etc."
              register={register}
              error={errors.niche}
            />
            <FormField
              type="text"
              name="content_style"
              label="Content Style"
              placeholder="Solo, collaborations, themed content, etc."
              register={register}
              error={errors.content_style}
            />
            <FormField
              type="textarea"
              name="persona"
              label="Creator Persona"
              placeholder="Describe the creator's brand, voice, and personality..."
              register={register}
              error={errors.persona}
            />
          </div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Platform Links</h4>
            <FormField
              type="url"
              name="onlyfans_url"
              label="OnlyFans URL"
              placeholder="https://onlyfans.com/username"
              register={register}
              error={errors.onlyfans_url}
            />
            
            <h4 className="text-sm font-medium text-muted-foreground pt-4">Social Media Links</h4>
            <FormRow>
              <FormField
                type="url"
                name="instagram_url"
                label="Instagram"
                placeholder="https://instagram.com/username"
                register={register}
                error={errors.instagram_url}
              />
              <FormField
                type="url"
                name="twitter_url"
                label="Twitter / X"
                placeholder="https://x.com/username"
                register={register}
                error={errors.twitter_url}
              />
            </FormRow>
            <FormField
              type="url"
              name="tiktok_url"
              label="TikTok"
              placeholder="https://tiktok.com/@username"
              register={register}
              error={errors.tiktok_url}
            />
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Internal Notes</h4>
            <FormField
              type="textarea"
              name="notes"
              label="Notes"
              placeholder="Add any internal notes about this creator (contract details, special arrangements, etc.)"
              register={register}
              error={errors.notes}
            />
          </div>
        </TabsContent>
      </Tabs>

      <FormSubmitButton
        isSubmitting={isSubmitting}
        label="Add Creator"
        loadingLabel="Adding..."
      />
    </form>
  );
}
