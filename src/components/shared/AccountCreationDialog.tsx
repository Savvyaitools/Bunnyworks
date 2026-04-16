import { useState } from "react";
import { Copy, RefreshCw, Eye, EyeOff, Check } from "lucide-react";
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
import { generatePassword, copyToClipboard } from "@/lib/passwordUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AccountCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: { id: string; name: string; email: string; role?: string } | null;
  userType: "creator" | "employee";
  agencyId: string | undefined;
  onAccountCreated: (entityId: string, authUserId: string, password: string) => Promise<void>;
}

export function AccountCreationDialog({
  open,
  onOpenChange,
  entity,
  userType,
  agencyId,
  onAccountCreated,
}: AccountCreationDialogProps) {
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setPassword(generatePassword());
      setShowPassword(true);
      setAccountCreated(false);
      setPasswordError("");
    }, 200);
  };

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(password);
    toast[success ? "success" : "error"](
      success ? "Password copied to clipboard" : "Failed to copy password"
    );
  };

  const loginUrl = `${window.location.origin}/auth`;

  const handleCopyCredentials = async () => {
    if (!entity) return;
    const credentials = `Login URL: ${loginUrl}\nEmail: ${entity.email}\nPassword: ${password}`;
    const success = await copyToClipboard(credentials);
    toast[success ? "success" : "error"](
      success ? "Credentials copied to clipboard" : "Failed to copy credentials"
    );
  };

  const handleCreateAccount = async () => {
    if (!entity) return;

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setIsCreating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("create-user-account", {
        body: {
          email: entity.email,
          password,
          fullName: entity.name,
          userType,
          agencyId,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      if (!result?.user?.id) throw new Error("Failed to create user account");

      await onAccountCreated(entity.id, result.user.id, password);

      setAccountCreated(true);
      toast.success("Login account created successfully!");
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast.error("This email is already registered");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {accountCreated ? "Account Created!" : "Create Login Account"}
          </DialogTitle>
          <DialogDescription>
            {accountCreated
              ? `Share these credentials with the ${userType} so they can log in.`
              : `Create login credentials for ${entity?.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={entity?.email || ""} disabled className="bg-muted/50" />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  disabled={accountCreated}
                  className={cn("pr-10", passwordError && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!accountCreated && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setPassword(generatePassword());
                    setPasswordError("");
                  }}
                  title="Generate new password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                title="Copy password"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
          </div>

          {accountCreated ? (
            <div className="flex flex-col gap-2">
              <Button onClick={handleCopyCredentials} className="w-full" variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copy All Credentials
              </Button>
              <Button onClick={handleClose} className="w-full bg-gradient-primary hover:opacity-90">
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleCreateAccount}
              disabled={isCreating}
              className="w-full bg-gradient-primary hover:opacity-90"
            >
              {isCreating ? "Creating..." : "Create Account"}
            </Button>
          )}

          {!accountCreated && (
            <p className="text-xs text-muted-foreground text-center">
              The {userType} will use these credentials to log in.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
