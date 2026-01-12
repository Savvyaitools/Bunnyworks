import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Globe, Users, Check, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreators } from "@/hooks/useCreators";
import { toast } from "sonner";

interface OnboardingCreatorStepProps {
  onComplete: (creatorId: string | null) => void;
  onSkip: () => void;
}

const platformOptions = [
  { value: "onlyfans", label: "OnlyFans" },
  { value: "fansly", label: "Fansly" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];

export function OnboardingCreatorStep({ onComplete, onSkip }: OnboardingCreatorStepProps) {
  const { createCreator } = useCreators();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    platform: "onlyfans",
    followers: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error("Please fill in name and email");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCreator({
        name: formData.name,
        email: formData.email,
        platform: formData.platform,
        followers: formData.followers || null,
        status: "Onboarding",
      } as any);

      if (result?.id) {
        setIsSuccess(true);
        toast.success("Creator added successfully!");
        setTimeout(() => onComplete(result.id), 1500);
      }
    } catch (error) {
      toast.error("Failed to add creator");
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
        <h3 className="text-xl font-semibold mb-2">Creator Added!</h3>
        <p className="text-muted-foreground">{formData.name} is ready to go</p>
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
          <User className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Add Your First Creator</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Set up a creator profile to start managing their content and earnings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Creator Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Enter creator's name or alias"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="creator@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Primary Platform</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData({ ...formData, platform: value })}
            >
              <SelectTrigger>
                <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followers">Followers (optional)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="followers"
                placeholder="e.g., 50k"
                value={formData.followers}
                onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
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
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Creator"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
