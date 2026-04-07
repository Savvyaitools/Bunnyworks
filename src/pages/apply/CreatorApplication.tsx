import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSubmitApplication } from "@/hooks/usePendingApplications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const creatorApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().optional(),
  platform: z.string().optional(),
  followers: z.string().optional(),
  onlyfans_url: z.string().url().optional().or(z.literal("")),
  instagram_url: z.string().url().optional().or(z.literal("")),
  tiktok_url: z.string().url().optional().or(z.literal("")),
  twitter_url: z.string().url().optional().or(z.literal("")),
  snapchat_url: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type CreatorApplicationForm = z.infer<typeof creatorApplicationSchema>;

export default function CreatorApplication() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const navigate = useNavigate();
  const { submit, isSubmitting } = useSubmitApplication();
  
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatorApplicationForm>({
    resolver: zodResolver(creatorApplicationSchema),
  });

  useEffect(() => {
    async function fetchAgency() {
      if (!agencyId) {
        setError("Invalid application link");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .rpc("get_agency_public_info", { agency_uuid: agencyId });

      if (fetchError || !data || data.length === 0) {
        setError("Agency not found. This link may be invalid.");
        setLoading(false);
        return;
      }

      const agencyData = data[0] as { id: string; name: string; logo_url: string | null };
      setAgencyName(agencyData.name);
      setAgencyLogo(agencyData.logo_url);
      setLoading(false);
    }

    fetchAgency();
  }, [agencyId]);

  const onSubmit = async (data: CreatorApplicationForm) => {
    if (!agencyId) return;

    try {
      await submit({
        agency_id: agencyId,
        application_type: "creator",
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        platform: data.platform || undefined,
        followers: data.followers || undefined,
        onlyfans_url: data.onlyfans_url || undefined,
        instagram_url: data.instagram_url || undefined,
        tiktok_url: data.tiktok_url || undefined,
        twitter_url: data.twitter_url || undefined,
        snapchat_url: data.snapchat_url || undefined,
        notes: data.notes || undefined,
      });
      setSubmitted(true);
    } catch {
      // Error handled by hook
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for applying to {agencyName}. We'll review your application and get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            {agencyLogo && (
              <img
                src={agencyLogo}
                alt={agencyName || "Agency"}
                className="h-16 w-auto mx-auto mb-4 object-contain"
              />
            )}
            <CardTitle className="text-2xl">Creator Application</CardTitle>
            <CardDescription>
              Apply to join {agencyName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Your name"
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
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Primary Platform</Label>
                  <Input
                    id="platform"
                    {...register("platform")}
                    placeholder="e.g., OnlyFans, Instagram"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followers">Followers Count</Label>
                  <Input
                    id="followers"
                    {...register("followers")}
                    placeholder="e.g., 10K, 100K"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Social Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="onlyfans_url">OnlyFans URL</Label>
                    <Input
                      id="onlyfans_url"
                      {...register("onlyfans_url")}
                      placeholder="https://onlyfans.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input
                      id="instagram_url"
                      {...register("instagram_url")}
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok_url">TikTok URL</Label>
                    <Input
                      id="tiktok_url"
                      {...register("tiktok_url")}
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter_url">Twitter/X URL</Label>
                    <Input
                      id="twitter_url"
                      {...register("twitter_url")}
                      placeholder="https://twitter.com/..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="snapchat_url">Snapchat Username</Label>
                    <Input
                      id="snapchat_url"
                      {...register("snapchat_url")}
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Tell us about yourself, your experience, what you're looking for..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
