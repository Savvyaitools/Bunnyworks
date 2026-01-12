import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Mail, Briefcase, Check, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";

interface OnboardingEmployeeStepProps {
  onComplete: (employeeId: string | null, role: string) => void;
  onSkip: () => void;
}

const roleOptions = [
  { value: "Chatter", label: "Chatter", description: "Handles fan messaging & engagement" },
  { value: "Manager", label: "Manager", description: "Oversees creators & team" },
  { value: "VA", label: "Virtual Assistant", description: "Administrative support" },
  { value: "Content Manager", label: "Content Manager", description: "Manages content scheduling" },
];

export function OnboardingEmployeeStep({ onComplete, onSkip }: OnboardingEmployeeStepProps) {
  const { createEmployee } = useEmployees();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Chatter",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Please fill in name and email");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createEmployee({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: "Active",
        is_chatter: formData.role === "Chatter",
      } as any);

      if (result?.id) {
        setIsSuccess(true);
        toast.success("Team member added successfully!");
        setTimeout(() => onComplete(result.id, formData.role), 1500);
      }
    } catch (error) {
      toast.error("Failed to add team member");
      setIsSubmitting(false);
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
        <h3 className="text-xl font-semibold mb-2">Team Member Added!</h3>
        <p className="text-muted-foreground">
          {formData.name} ({formData.role}) is ready
        </p>
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
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Add Your First Team Member</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Invite a chatter, manager, or assistant to help run your agency
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emp-name">Full Name</Label>
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="emp-name"
              placeholder="Enter team member's name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emp-email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="emp-email"
              type="email"
              placeholder="employee@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.role === "Chatter" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm"
          >
            <p className="text-muted-foreground">
              <strong className="text-foreground">Chatter selected:</strong> This team member will 
              be able to message fans on behalf of creators (with proper permissions).
            </p>
          </motion.div>
        )}

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
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Team Member"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
