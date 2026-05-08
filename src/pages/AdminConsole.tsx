import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, CheckCircle2, XCircle, Copy } from "lucide-react";
import { toast } from "sonner";

interface Approval {
  id: string;
  email: string;
  full_name: string;
  agency_name: string;
  notes: string | null;
  status: string;
  created_at: string;
  created_user_id: string | null;
  created_agency_id: string | null;
}

export default function AdminConsole() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin((data?.length ?? 0) > 0));
  }, [user]);

  const loadApprovals = async () => {
    setRefreshing(true);
    const { data, error } = await supabase
      .from("agency_approvals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    else setApprovals((data ?? []) as Approval[]);
    setRefreshing(false);
  };

  useEffect(() => { if (isAdmin) loadApprovals(); }, [isAdmin]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const addPending = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("agency_approvals").insert({
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      agency_name: agencyName.trim(),
      notes: notes.trim() || null,
      status: "pending",
      requested_by: user.id,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Added to queue");
    setEmail(""); setFullName(""); setAgencyName(""); setNotes("");
    loadApprovals();
  };

  const provision = async (a: Approval) => {
    setProvisioningId(a.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-provision-agency", {
        body: {
          approvalId: a.id,
          email: a.email,
          fullName: a.full_name,
          agencyName: a.agency_name,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const pwd = (data as any).tempPassword;
      toast.success("Agency provisioned", {
        description: `Temp password: ${pwd}`,
        duration: 30000,
        action: { label: "Copy", onClick: () => navigator.clipboard.writeText(pwd) },
      });
      loadApprovals();
    } catch (err: any) {
      toast.error(err.message || "Provision failed");
    } finally {
      setProvisioningId(null);
    }
  };

  const reject = async (a: Approval) => {
    const { error } = await supabase.from("agency_approvals").update({ status: "rejected" }).eq("id", a.id);
    if (error) toast.error(error.message); else { toast.success("Rejected"); loadApprovals(); }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Console</h1>
            <p className="text-sm text-muted-foreground">Approve agencies and provision their first owner account.</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Provision new agency</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addPending} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Owner email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label>Owner full name</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><Label>Agency name</Label><Input required value={agencyName} onChange={(e) => setAgencyName(e.target.value)} /></div>
              <div><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} /></div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add to queue</Button>
                <Button type="button" variant="default" disabled={submitting || !email || !fullName || !agencyName}
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("admin-provision-agency", {
                        body: { email: email.trim().toLowerCase(), fullName: fullName.trim(), agencyName: agencyName.trim() },
                      });
                      if (error) throw error;
                      if ((data as any)?.error) throw new Error((data as any).error);
                      const pwd = (data as any).tempPassword;
                      toast.success("Agency provisioned", { description: `Temp password: ${pwd}`, duration: 30000,
                        action: { label: "Copy", onClick: () => navigator.clipboard.writeText(pwd) } });
                      setEmail(""); setFullName(""); setAgencyName(""); setNotes("");
                      loadApprovals();
                    } catch (err: any) { toast.error(err.message || "Failed"); }
                    finally { setSubmitting(false); }
                  }}>Provision now</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Approval queue</CardTitle>
            <Button variant="outline" size="sm" onClick={loadApprovals} disabled={refreshing}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {approvals.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
            <div className="space-y-2">
              {approvals.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{a.agency_name}</span>
                      <Badge variant={a.status === "provisioned" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.full_name} · {a.email}</p>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => provision(a)} disabled={provisioningId === a.id}>
                          {provisioningId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                          Approve & provision
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => reject(a)}><XCircle className="h-4 w-4" /></Button>
                      </>
                    )}
                    {a.status === "provisioned" && a.created_agency_id && (
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(a.created_agency_id!); toast.success("Agency ID copied"); }}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}