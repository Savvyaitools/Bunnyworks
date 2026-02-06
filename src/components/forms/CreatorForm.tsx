import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { creatorFormSchema, type CreatorFormValues } from "@/lib/validations";
import { FormField, FormRow } from "./FormField";
import { FormSubmitButton } from "./FormSubmitButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Globe, FileText, Link2, Heart, Sparkles, Camera, Eye, EyeOff, RefreshCw, Copy } from "lucide-react";
import { generatePassword, copyToClipboard } from "@/lib/passwordUtils";
import { toast } from "sonner";

interface CreatorFormProps {
  onSubmit: (data: CreatorFormValues) => Promise<void>;
  isSubmitting?: boolean;
  mode?: "quick" | "full";
}

export function CreatorForm({ onSubmit, isSubmitting, mode = "quick" }: CreatorFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreatorFormValues>({
    resolver: zodResolver(creatorFormSchema),
    defaultValues: {
      name: "",
      alias: "",
      email: "",
      phone: "",
      location: "",
      occupation: "",
      hair_color: "",
      eye_color: "",
      body_type: "",
      height: "",
      weight: "",
      bra_size: "",
      favorite_food: "",
      favorite_music: "",
      character_traits: "",
      hobbies: "",
      platform: "",
      followers: "",
      of_livestreams: false,
      niche: "",
      creator_references: "",
      content_types: "",
      fetish_content: "",
      favorite_position: "",
      turn_ons: "",
      attracted_to: "",
      boundaries: "",
      saying_sub_name: false,
      allows_masturbation: false,
      allows_writing_name: false,
      allows_custom_requests: true,
      uses_toys: false,
      allows_toy_bjs: false,
      allows_video_calls: false,
      persona: "",
      onlyfans_url: "",
      instagram_url: "",
      twitter_url: "",
      tiktok_url: "",
      notes: "",
      password: generatePassword(),
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
            label="OF Name"
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
            type="text"
            name="location"
            label="Location"
            placeholder="City, Country"
            register={register}
            error={errors.location}
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

        {/* Login Password */}
        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-sm font-medium">Login Password</Label>
          <p className="text-xs text-muted-foreground">This password will be used for the creator to log into their portal.</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setValue("password", generatePassword())}
              title="Generate new password"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={async () => {
                const pw = getValues("password");
                if (pw) {
                  const ok = await copyToClipboard(pw);
                  toast[ok ? "success" : "error"](ok ? "Password copied" : "Failed to copy");
                }
              }}
              title="Copy password"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <FormSubmitButton
          isSubmitting={isSubmitting}
          label="Add Creator"
          loadingLabel="Adding..."
        />
      </form>
    );
  }

  // Full mode - comprehensive questionnaire based on Notion form
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Personality</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
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
                label="OF Name"
                placeholder="Creator's OF display name"
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

            <FormRow>
              <FormField
                type="text"
                name="location"
                label="Location"
                placeholder="City, Country"
                register={register}
                error={errors.location}
              />
              <FormField
                type="text"
                name="occupation"
                label="Job/Occupation"
                placeholder="Model, Nurse, Student, etc."
                register={register}
                error={errors.occupation}
              />
            </FormRow>

            <h4 className="text-sm font-medium text-muted-foreground pt-4">Platform & Audience</h4>
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

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="of_livestreams" className="text-sm">Does OF Livestreams?</Label>
              <Controller
                name="of_livestreams"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="of_livestreams"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Physical Attributes</h4>
            <FormRow>
              <FormField
                type="text"
                name="hair_color"
                label="Hair Color"
                placeholder="Blonde, Brunette, etc."
                register={register}
                error={errors.hair_color}
              />
              <FormField
                type="text"
                name="eye_color"
                label="Eye Color"
                placeholder="Blue, Green, Brown, etc."
                register={register}
                error={errors.eye_color}
              />
            </FormRow>

            <FormRow>
              <FormField
                type="text"
                name="body_type"
                label="Body Type"
                placeholder="Athletic, Curvy, Slim, etc."
                register={register}
                error={errors.body_type}
              />
              <FormField
                type="text"
                name="bra_size"
                label="Bra Size"
                placeholder="32C, 34D, etc."
                register={register}
                error={errors.bra_size}
              />
            </FormRow>

            <FormRow>
              <FormField
                type="text"
                name="height"
                label="Height"
                placeholder="5'6&quot; or 168cm"
                register={register}
                error={errors.height}
              />
              <FormField
                type="text"
                name="weight"
                label="Weight"
                placeholder="120lbs or 54kg"
                register={register}
                error={errors.weight}
              />
            </FormRow>
          </div>
        </TabsContent>

        {/* Personality & Interests Tab */}
        <TabsContent value="personality" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Favorites</h4>
            <FormRow>
              <FormField
                type="text"
                name="favorite_food"
                label="Favorite Food"
                placeholder="Pizza, Sushi, etc."
                register={register}
                error={errors.favorite_food}
              />
              <FormField
                type="text"
                name="favorite_music"
                label="Favorite Music"
                placeholder="Pop, R&B, EDM, etc."
                register={register}
                error={errors.favorite_music}
              />
            </FormRow>

            <h4 className="text-sm font-medium text-muted-foreground pt-4">Personality</h4>
            <FormField
              type="textarea"
              name="character_traits"
              label="5 Character Traits"
              placeholder="Flirty, Sweetheart, Seductive, Funny, Adventurous..."
              register={register}
              error={errors.character_traits}
            />
            <p className="text-xs text-muted-foreground -mt-2">
              Examples: Flirty, Sweetheart, Seductive, Witty, Dominant, Submissive, Glamorous, Mysterious
            </p>

            <FormField
              type="textarea"
              name="hobbies"
              label="Hobbies/Interests"
              placeholder="Fitness, Gaming, Travel, Fashion, Dancing, Reading..."
              register={register}
              error={errors.hobbies}
            />
            <p className="text-xs text-muted-foreground -mt-2">
              Examples: Fitness, Gaming, Fashion, Music, Travel, Art, Dancing, Foodie, Spirituality
            </p>

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

        {/* Content & Preferences Tab */}
        <TabsContent value="content" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Content & Niche</h4>
            <FormField
              type="textarea"
              name="niche"
              label="Niche Categories"
              placeholder="Fitness, Cosplay, Girl Next Door, MILF, Gamer Girl..."
              register={register}
              error={errors.niche}
            />

            <FormField
              type="textarea"
              name="content_types"
              label="Content Types (Photo/Video)"
              placeholder="Solo photos, B/G videos, Collabs, POV, etc."
              register={register}
              error={errors.content_types}
            />

            <FormField
              type="textarea"
              name="fetish_content"
              label="Fetish Content"
              placeholder="Feet, JOI, Role-play, ASMR, etc."
              register={register}
              error={errors.fetish_content}
            />

            <FormField
              type="textarea"
              name="creator_references"
              label="Creator References (Instagram Inspiration)"
              placeholder="Links to IG profiles of creators whose style/aesthetic inspires you..."
              register={register}
              error={errors.creator_references}
            />

            <h4 className="text-sm font-medium text-muted-foreground pt-4">Preferences</h4>
            <FormField
              type="text"
              name="favorite_position"
              label="Favorite Position"
              placeholder="..."
              register={register}
              error={errors.favorite_position}
            />
            <FormField
              type="textarea"
              name="turn_ons"
              label="What Turns You On?"
              placeholder="..."
              register={register}
              error={errors.turn_ons}
            />
            <FormField
              type="textarea"
              name="attracted_to"
              label="Type of Person You're Attracted To"
              placeholder="..."
              register={register}
              error={errors.attracted_to}
            />

            <h4 className="text-sm font-medium text-muted-foreground pt-4">Boundaries</h4>
            <FormField
              type="textarea"
              name="boundaries"
              label="What You're NOT Comfortable Doing"
              placeholder="List everything you're not comfortable doing in detail..."
              register={register}
              error={errors.boundaries}
            />

            <h4 className="text-sm font-medium text-muted-foreground pt-4">Services Offered</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <Label htmlFor="saying_sub_name" className="text-sm">Saying Sub's Name</Label>
                <Controller
                  name="saying_sub_name"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="saying_sub_name"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <Label htmlFor="allows_masturbation" className="text-sm">Masturbation</Label>
                <Controller
                  name="allows_masturbation"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allows_masturbation"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <Label htmlFor="allows_writing_name" className="text-sm">Writing Name on Body</Label>
                <Controller
                  name="allows_writing_name"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allows_writing_name"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <Label htmlFor="allows_custom_requests" className="text-sm">Custom Requests</Label>
                <Controller
                  name="allows_custom_requests"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allows_custom_requests"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <Label htmlFor="uses_toys" className="text-sm">Uses Toys</Label>
                <Controller
                  name="uses_toys"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="uses_toys"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                <Label htmlFor="allows_toy_bjs" className="text-sm">BJs with Toys</Label>
                <Controller
                  name="allows_toy_bjs"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allows_toy_bjs"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg col-span-2">
                <Label htmlFor="allows_video_calls" className="text-sm">Video Calls</Label>
                <Controller
                  name="allows_video_calls"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="allows_video_calls"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
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

            <h4 className="text-sm font-medium text-muted-foreground pt-4">Internal Notes</h4>
            <FormField
              type="textarea"
              name="notes"
              label="Notes"
              placeholder="Add any internal notes (contract details, special arrangements, etc.)"
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
