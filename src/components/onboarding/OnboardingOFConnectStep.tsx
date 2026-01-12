import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Shield, Loader2, SkipForward, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingOFConnectStepProps {
  creatorId: string | null;
  creatorName: string;
  onComplete: (connected: boolean) => void;
  onSkip: () => void;
}

export function OnboardingOFConnectStep({ 
  creatorId, 
  creatorName, 
  onComplete, 
  onSkip 
}: OnboardingOFConnectStepProps) {
  const [username, setUsername] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!username.trim()) {
      toast.error("Please enter the OnlyFans username");
      return;
    }

    if (!creatorId) {
      toast.error("No creator selected");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create social account record
      const { error: insertError } = await supabase
        .from("creator_social_accounts")
        .insert({
          creator_id: creatorId,
          platform: "onlyfans",
          username: username.trim(),
          profile_url: `https://onlyfans.com/${username.trim()}`,
          account_type: "creator",
          of_connection_status: "pending",
        });

      if (insertError) throw insertError;

      // Update creator with OnlyFans URL
      await supabase
        .from("creators")
        .update({ onlyfans_url: `https://onlyfans.com/${username.trim()}` })
        .eq("id", creatorId);

      setIsConnected(true);
      toast.success("OnlyFans account linked!");
      setTimeout(() => onComplete(true), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to connect account");
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Account Linked!</h3>
        <p className="text-muted-foreground">@{username} is now connected</p>
      </motion.div>
    );
  }

  if (!creatorId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Link2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Creator to Connect</h3>
        <p className="text-muted-foreground text-sm mb-6">
          You skipped adding a creator. You can connect OnlyFans accounts later from the Creator Detail page.
        </p>
        <Button onClick={() => onSkip()}>
          Continue to Next Step
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Link2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Connect OnlyFans</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Link {creatorName}'s OnlyFans account to sync earnings and messages
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Secure Connection</p>
            <p className="text-muted-foreground">
              We use industry-standard encryption. Your login credentials are never stored.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="of-username">OnlyFans Username</Label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 text-muted-foreground text-sm">
              onlyfans.com/
            </span>
            <Input
              id="of-username"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-l-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Connect Later
          </Button>
          <Button 
            onClick={handleConnect} 
            className="flex-1" 
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Account"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
