import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnlyFansAPI } from "@/hooks/useOnlyFansAPI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Eye, EyeOff } from "lucide-react";

interface OnlyFansAccountConnectProps {
  creatorId: string;
  onSuccess: () => void;
}

export function OnlyFansAccountConnect({ creatorId, onSuccess }: OnlyFansAccountConnectProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { authenticate, loading, error } = useOnlyFansAPI();

  const handleSubmit = async (e: React.FormEvent, forceConnect = false) => {
    e.preventDefault();
    
    const result = await authenticate(email, password, requires2FA ? code : undefined, forceConnect);
    
    if (result.requires2FA) {
      setRequires2FA(true);
      return;
    }

    // If duplicate account, auto-retry with force_connect
    if (result.duplicateAccount && result.accountId) {
      toast.info("Account already connected, reconnecting...");
      setSaving(true);
      
      // Use the existing account ID directly
      const { error: dbError } = await supabase
        .from("creator_social_accounts")
        .insert({
          creator_id: creatorId,
          platform: "onlyfans",
          username: email.split("@")[0],
          account_type: "agency_managed",
          of_account_id: result.accountId,
          of_connected_at: new Date().toISOString(),
        });

      setSaving(false);

      if (dbError) {
        toast.error("Failed to save account connection");
        console.error(dbError);
        return;
      }

      toast.success("OnlyFans account connected successfully!");
      setOpen(false);
      resetForm();
      onSuccess();
      return;
    }

    if (result.accountId) {
      setSaving(true);
      
      // Save the account connection
      const { error: dbError } = await supabase
        .from("creator_social_accounts")
        .insert({
          creator_id: creatorId,
          platform: "onlyfans",
          username: email.split("@")[0],
          account_type: "agency_managed",
          of_account_id: result.accountId,
          of_connected_at: new Date().toISOString(),
        });

      setSaving(false);

      if (dbError) {
        toast.error("Failed to save account connection");
        console.error(dbError);
        return;
      }

      setOpen(false);
      resetForm();
      onSuccess();
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setCode("");
    setRequires2FA(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Connect OnlyFans
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {requires2FA ? "Enter 2FA Code" : "Connect OnlyFans Account"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">OnlyFans Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="creator@email.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 2FA code"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the verification code sent to your email or authenticator app
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            {requires2FA && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setRequires2FA(false)}
              >
                Back
              </Button>
            )}
            <Button type="submit" disabled={loading || saving}>
              {(loading || saving) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {requires2FA ? "Verify" : "Connect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
