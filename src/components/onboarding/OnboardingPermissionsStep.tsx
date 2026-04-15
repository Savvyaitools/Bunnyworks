import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, MessageSquare, Eye, DollarSign, Users, Loader2, SkipForward, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { toast } from "sonner";

interface OnboardingPermissionsStepProps {
  employeeId: string | null;
  employeeName: string;
  employeeRole: string;
  creatorId: string | null;
  creatorName: string;
  onComplete: () => void;
  onSkip: () => void;
}

const permissionOptions = [
  { key: "can_view_chats", label: "View Messages", icon: Eye, description: "See fan conversations" },
  { key: "can_send_messages", label: "Send Messages", icon: MessageSquare, description: "Reply to fans" },
  { key: "can_view_fans", label: "View Fans", icon: Users, description: "Access fan list & CRM" },
  { key: "can_view_earnings", label: "View Earnings", icon: DollarSign, description: "See revenue data" },
];

export function OnboardingPermissionsStep({
  employeeId,
  employeeName,
  employeeRole,
  creatorId,
  creatorName,
  onComplete,
  onSkip,
}: OnboardingPermissionsStepProps) {
  const { agencyId } = useAgency();
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [permissions, setPermissions] = useState({
    can_view_chats: true,
    can_send_messages: employeeRole === "Chatter",
    can_view_fans: true,
    can_view_earnings: employeeRole === "Manager",
  });

  const handleToggle = (key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    if (!employeeId || !creatorId || !agencyId) {
      toast.error("Missing required data");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("employee_of_permissions").insert({
        employee_id: employeeId,
        creator_id: creatorId,
        agency_id: agencyId,
        ...permissions,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Permissions configured!");
      setTimeout(onComplete, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to save permissions");
      setIsSaving(false);
    }
  };

  if (isSuccess) {
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
          <Check className="h-10 w-10 text-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Permissions Set!</h3>
        <p className="text-muted-foreground">
          {employeeName} can now work with {creatorName}
        </p>
      </motion.div>
    );
  }

  // If no employee or creator was added, skip this step
  if (!employeeId || !creatorId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Permissions Needed</h3>
        <p className="text-muted-foreground text-sm mb-6">
          {!employeeId && !creatorId
            ? "You haven't added a creator or team member yet."
            : !employeeId
            ? "You haven't added a team member to assign permissions."
            : "You haven't added a creator to manage."}
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          You can configure team permissions later from the Creator Detail page.
        </p>
        <Button onClick={onSkip}>Continue to Finish</Button>
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
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Set Team Permissions</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Configure what {employeeName} can access for {creatorName}
        </p>
      </div>

      <div className="bg-card border rounded-lg divide-y">
        {permissionOptions.map((perm, index) => (
          <motion.div
            key={perm.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <perm.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="font-medium">{perm.label}</Label>
                <p className="text-xs text-muted-foreground">{perm.description}</p>
              </div>
            </div>
            <Switch
              checked={permissions[perm.key as keyof typeof permissions]}
              onCheckedChange={() => handleToggle(perm.key)}
            />
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> You can always adjust these 
          permissions later from the Creator's "Team Access" tab.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          className="flex-1"
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Skip for now
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Permissions"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
