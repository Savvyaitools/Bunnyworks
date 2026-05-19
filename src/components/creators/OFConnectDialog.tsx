import { useState } from "react";
import { Loader2, Link2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OFConnectDialogProps {
  creatorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: (ofAccountId: string) => void;
}

/**
 * Connects an OnlyFans account through OnlyFansAPI.com.
 * Supports two flows:
 *  - email + password (with optional 2FA)
 *  - existing of_account_id lookup (for accounts already authenticated in OFAPI)
 */
export function OFConnectDialog({ creatorId, open, onOpenChange, onConnected }: OFConnectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [twoFaRequired, setTwoFaRequired] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFa, setTwoFa] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const reset = () => {
    setEmail(""); setPassword(""); setTwoFa(""); setAccountId("");
    setTwoFaRequired(false); setError(null); setLoading(false); setAttemptId(null);
  };

  const callConnect = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("of-connect-account", {
        body: { creator_id: creatorId, ...body },
      });
      if (fnErr) throw fnErr;
      if (data?.two_fa_required) {
        setTwoFaRequired(true);
        if (data?.attempt_id) setAttemptId(data.attempt_id);
        toast.info("2FA code required. Check the OnlyFans app.");
        return;
      }
      if (data?.face_verification_required) {
        const url = data?.face_otp_verification_url;
        setError(
          url
            ? `Face verification required. Open this link on the creator's phone: ${url}`
            : "Face verification required.",
        );
        if (data?.attempt_id) setAttemptId(data.attempt_id);
        return;
      }
      if (!data?.ok) throw new Error(data?.error ?? "Connection failed");
      toast.success(`Connected ${data.of_username ? "@" + data.of_username : "account"} via OnlyFansAPI`);
      onConnected?.(data.of_account_id);
      onOpenChange(false);
      reset();
    } catch (err: any) {
      setError(err?.message ?? "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Connect Account
          </DialogTitle>
          <DialogDescription>
            {"\n"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="credentials">Email + Password</TabsTrigger>
            <TabsTrigger value="lookup">Existing Account ID</TabsTrigger>
          </TabsList>

          <TabsContent value="credentials" className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label>OnlyFans email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {twoFaRequired && (
              <div className="space-y-1.5">
                <Label>2FA code</Label>
                <Input
                  value={twoFa}
                  onChange={(e) => setTwoFa(e.target.value)}
                  placeholder="6-digit code"
                  inputMode="numeric"
                />
              </div>
            )}
            <Alert className="bg-muted/40 border-border/60">
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Credentials are sent over TLS and never stored in our database.
              </AlertDescription>
            </Alert>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              className="w-full bg-gradient-primary"
              disabled={loading || !email || !password || (twoFaRequired && !twoFa)}
              onClick={() =>
                callConnect({
                  mode: "email_password",
                  email,
                  password,
                  two_fa_code: twoFaRequired ? twoFa : undefined,
                  attempt_id: attemptId ?? undefined,
                })
              }
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {twoFaRequired ? "Submit 2FA code" : "Connect"}
            </Button>
          </TabsContent>

          <TabsContent value="lookup" className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label>OnlyFansAPI account_id</Label>
              <Input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="acc_..."
              />
              <p className="text-xs text-muted-foreground">
                Use this if you already authenticated this creator inside OnlyFansAPI.
              </p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              className="w-full"
              variant="outline"
              disabled={loading || !accountId}
              onClick={() => callConnect({ mode: "lookup", of_account_id: accountId.trim() })}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link existing account
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}