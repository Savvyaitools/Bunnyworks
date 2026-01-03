import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Controller } from "react-hook-form";

const employeeApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().optional(),
  role_preference: z.string().min(1, "Please select a role"),
  department_preference: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),
  bio: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

type EmployeeApplicationForm = z.infer<typeof employeeApplicationSchema>;

const roles = [
  "Chatter",
  "Account Manager",
  "Content Manager",
  "Marketing Manager",
  "Quality Control",
  "Admin",
  "Other",
];

const departments = [
  "Operations",
  "Marketing",
  "Content",
  "Management",
  "Support",
];

export default function EmployeeApplication() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const { submit, isSubmitting } = useSubmitApplication();
  
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EmployeeApplicationForm>({
    resolver: zodResolver(employeeApplicationSchema),
  });

  useEffect(() => {
    async function fetchAgency() {
      if (!agencyId) {
        setError("Invalid application link");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("agencies")
        .select("name, logo_url")
        .eq("id", agencyId)
        .single();

      if (fetchError || !data) {
        setError("Agency not found. This link may be invalid.");
        setLoading(false);
        return;
      }

      setAgencyName(data.name);
      setAgencyLogo(data.logo_url);
      setLoading(false);
    }

    fetchAgency();
  }, [agencyId]);

  const onSubmit = async (data: EmployeeApplicationForm) => {
    if (!agencyId) return;

    try {
      await submit({
        agency_id: agencyId,
        application_type: "employee",
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        role_preference: data.role_preference,
        department_preference: data.department_preference || undefined,
        experience: data.experience || undefined,
        skills: data.skills ? data.skills.split(",").map((s) => s.trim()) : undefined,
        bio: data.bio || undefined,
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
            <CardTitle className="text-2xl">Employee Application</CardTitle>
            <CardDescription>
              Apply to work with {agencyName}
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
                  <Label htmlFor="role_preference">Desired Role *</Label>
                  <Controller
                    name="role_preference"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role_preference && (
                    <p className="text-sm text-destructive">{errors.role_preference.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department_preference">Preferred Department</Label>
                  <Controller
                    name="department_preference"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Textarea
                  id="experience"
                  {...register("experience")}
                  placeholder="Describe your relevant experience..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  {...register("skills")}
                  placeholder="e.g., Customer service, Sales, Social media"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  {...register("bio")}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Anything else you'd like us to know..."
                  rows={3}
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
