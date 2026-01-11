import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface OFReconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  username: string;
  socialAccountId: string;
}

export function OFReconnectDialog({
  open,
  onOpenChange,
  accountId,
  username,
  socialAccountId,
}: OFReconnectDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleReconnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("onlyfans-api", {
        body: {
          action: "authenticate",
          email,
          password,
          code: requires2FA ? twoFactorCode : undefined,
          force_connect: true, // Force reconnect to existing account
        },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data.requires_2fa) {
        setRequires2FA(true);
        toast.info("Please enter your 2FA code");
        return;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.account_id) {
        // Update the social account with the new connection
        const { error: updateError } = await supabase
          .from("creator_social_accounts")
          .update({
            of_account_id: data.account_id,
            of_connected_at: new Date().toISOString(),
            of_connection_status: "healthy",
            of_last_error: null,
            of_last_error_at: null,
            of_sync_retry_count: 0,
            of_next_retry_at: null,
          })
          .eq("id", socialAccountId);

        if (updateError) {
          throw updateError;
        }

        // Trigger a sync
        await supabase.functions.invoke("sync-onlyfans-data");

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["of-connection-health", data.account_id] });
        queryClient.invalidateQueries({ queryKey: ["of-chats", data.account_id] });
        queryClient.invalidateQueries({ queryKey: ["of-fans", data.account_id] });
        queryClient.invalidateQueries({ queryKey: ["of-all-accounts-health"] });

        toast.success("Account reconnected successfully!");
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reconnect account";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setTwoFactorCode("");
    setRequires2FA(false);
    setError(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Reconnect OnlyFans Account
          </DialogTitle>
          <DialogDescription>
            Re-authenticate <strong>@{username}</strong> to restore data syncing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">OnlyFans Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {requires2FA && (
            <div className="space-y-2">
              <Label htmlFor="2fa">Two-Factor Authentication Code</Label>
              <Input
                id="2fa"
                type="text"
                placeholder="123456"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                disabled={isLoading}
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReconnect}
            disabled={isLoading || !email || !password}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {requires2FA ? "Verify & Connect" : "Reconnect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
