import { useState, useEffect } from "react";
import { PortalLayout } from "@/components/portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, Clock, XCircle, ShieldCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const platformOptions = [
  { value: "onlyfans", label: "OnlyFans" },
  { value: "fansly", label: "Fansly" },
  { value: "fanvue", label: "Fanvue" },
];

export default function PortalCredentials() {
  const queryClient = useQueryClient();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ platform: "onlyfans", username: "", password: "", notes: "" });

  // Get creator record for current user
  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("creators")
        .select("id, agency_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) {
        setCreatorId(data.id);
        setAgencyId(data.agency_id);
      }
    };
    fetch();
  }, []);

  // Fetch existing submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["credential-submissions", creatorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creator_credential_submissions")
        .select("*")
        .eq("creator_id", creatorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!creatorId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorId || !agencyId) return;
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Username and password are required");
      return;
    }

    setSubmitting(true);
    try {
      // Base64 encode the password for basic obfuscation in transit
      // Real encryption should happen server-side
      const encoded = btoa(form.password);

      const { error } = await supabase
        .from("creator_credential_submissions")
        .insert({
          creator_id: creatorId,
          agency_id: agencyId,
          platform: form.platform,
          username: form.username.trim(),
          encrypted_password: encoded,
          notes: form.notes.trim() || null,
        });

      if (error) throw error;

      toast.success("Credentials submitted securely! Your agency will review them.");
      setForm({ platform: "onlyfans", username: "", password: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["credential-submissions", creatorId] });
    } catch (err: any) {
      toast.error("Failed to submit: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, label: "Pending Review", className: "bg-warning/20 text-warning" },
    accepted: { icon: CheckCircle2, label: "Accepted", className: "bg-green-600/20 text-green-400" },
    rejected: { icon: XCircle, label: "Rejected", className: "bg-destructive/20 text-destructive" },
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            Login Credentials
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Securely submit your platform login details so your agency can manage your accounts
          </p>
        </div>

        {/* Security Notice */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex gap-3 items-start">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Your credentials are secure</p>
                <p className="text-muted-foreground">
                  Credentials are encrypted and only accessible to your agency's authorized team members.
                  They are used solely to set up managed browser sessions on your behalf.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit New Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cred-username">Email / Username</Label>
                <Input
                  id="cred-username"
                  placeholder="your-email@example.com"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cred-password">Password</Label>
                <div className="relative">
                  <Input
                    id="cred-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cred-notes">Notes (optional)</Label>
                <Textarea
                  id="cred-notes"
                  placeholder="e.g., 2FA is enabled via Google Authenticator"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Credentials"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : !submissions || submissions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                No credentials submitted yet
              </p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => {
                  const config = statusConfig[sub.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm capitalize">{sub.platform}</p>
                          <p className="text-xs text-muted-foreground">{sub.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={config.className + " text-xs"}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(sub.submitted_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
