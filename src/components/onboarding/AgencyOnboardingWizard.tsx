import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Rocket,
  User,
  UserPlus,
  PartyPopper,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAgency } from "@/hooks/useAgency";
import { useAgencyLogo } from "@/hooks/useAgencyLogo";
import { LogoUpload } from "@/components/shared/LogoUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OnboardingCreatorStep } from "./OnboardingCreatorStep";
import { OnboardingEmployeeStep } from "./OnboardingEmployeeStep";
import { OnboardingCompletionStep } from "./OnboardingCompletionStep";

// Reduced from 8 → 4 steps for faster time-to-value
const steps = [
  { id: 1, title: "Agency Setup", icon: Building2 },
  { id: 2, title: "First Creator", icon: User },
  { id: 3, title: "Team Member", icon: UserPlus },
  { id: 4, title: "Ready!", icon: PartyPopper },
];

interface OnboardingState {
  creatorId: string | null;
  creatorName: string;
  employeeId: string | null;
  employeeName: string;
  employeeRole: string;
}

export function AgencyOnboardingWizard() {
  const navigate = useNavigate();
  const { agency, agencyId, refetch } = useAgency();
  const { uploadLogo, deleteLogo, uploading, logoUrl } = useAgencyLogo();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    commissionRate: 30,
  });

  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    creatorId: null,
    creatorName: "",
    employeeId: null,
    employeeName: "",
    employeeRole: "",
  });

  useEffect(() => {
    (window as any).__logoUploadHandler = uploadLogo;
    return () => {
      delete (window as any).__logoUploadHandler;
    };
  }, [uploadLogo]);

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        website: agency.website || "",
        commissionRate: (agency.commission_rate || 0.3) * 100,
      });
      const savedStep = (agency as any).onboarding_step;
      // Map old steps to new: 1→1, 2-3→1, 4-5→2, 6→3, 7-8→4
      if (savedStep && savedStep > 1) {
        if (savedStep <= 3) setCurrentStep(1);
        else if (savedStep <= 5) setCurrentStep(2);
        else if (savedStep <= 6) setCurrentStep(3);
        else setCurrentStep(4);
      }
    }
  }, [agency]);

  const saveProgress = async (step: number) => {
    if (!agencyId) return;
    try {
      await supabase
        .from("agencies")
        .update({ onboarding_step: step } as any)
        .eq("id", agencyId);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleAgencySetupNext = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your agency name");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("agencies")
        .update({
          name: formData.name.trim(),
          website: formData.website.trim() || null,
          commission_rate: formData.commissionRate / 100,
        })
        .eq("id", agencyId);

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error("Error saving agency details:", error);
      toast.error("Failed to save agency details");
      setSaving(false);
      return;
    }
    setSaving(false);
    setCurrentStep(2);
    saveProgress(4);
  };

  const handleCreatorComplete = (creatorId: string | null) => {
    if (creatorId) {
      setOnboardingState((prev) => ({ ...prev, creatorId, creatorName: "Creator" }));
    }
    setCurrentStep(3);
    saveProgress(6);
  };

  const handleCreatorSkip = () => {
    setCurrentStep(3);
    saveProgress(6);
  };

  const handleEmployeeComplete = (employeeId: string | null, role: string) => {
    if (employeeId) {
      setOnboardingState((prev) => ({
        ...prev,
        employeeId,
        employeeName: "Team Member",
        employeeRole: role,
      }));
    }
    setCurrentStep(4);
    saveProgress(8);
  };

  const handleEmployeeSkip = () => {
    setCurrentStep(4);
    saveProgress(8);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("agencies")
        .update({ 
          onboarding_completed: true,
          onboarding_step: 8,
        } as any)
        .eq("id", agencyId);

      if (error) throw error;
      await refetch();
      toast.success("Welcome to BunnyWorksOS! 🎉");
      navigate("/");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto shadow-glow-sm mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <Rocket className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <h2 className="text-2xl font-bold gradient-text">Set up your agency</h2>
              <p className="text-muted-foreground text-sm mt-1">Takes less than 60 seconds</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="agency-name">Agency Name *</Label>
                <Input
                  id="agency-name"
                  placeholder="Enter your agency name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://youragency.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              {/* Logo + Commission in a compact layout */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Logo <span className="text-muted-foreground">(optional)</span></Label>
                  <LogoUpload
                    currentLogoUrl={logoUrl}
                    agencyName={formData.name || "Agency"}
                    onUploadComplete={() => {}}
                    onDelete={deleteLogo}
                    uploading={uploading}
                    size="md"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Commission</Label>
                    <span className="text-sm font-semibold text-primary">{formData.commissionRate}%</span>
                  </div>
                  <Slider
                    value={[formData.commissionRate]}
                    onValueChange={(value) => setFormData({ ...formData, commissionRate: value[0] })}
                    max={100}
                    step={1}
                    className="w-full mt-3"
                  />
                  <p className="text-[10px] text-muted-foreground">Your agency's cut from earnings</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 max-w-md mx-auto">
              <Button onClick={handleAgencySetupNext} disabled={saving || uploading} className="w-full">
                {saving ? "Saving..." : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <OnboardingCreatorStep
            onComplete={handleCreatorComplete}
            onSkip={handleCreatorSkip}
          />
        );

      case 3:
        return (
          <OnboardingEmployeeStep
            onComplete={handleEmployeeComplete}
            onSkip={handleEmployeeSkip}
          />
        );

      case 4:
        return (
          <OnboardingCompletionStep
            agencyName={formData.name}
            agencyLogo={logoUrl}
            creatorName={onboardingState.creatorId ? onboardingState.creatorName : null}
            creatorConnected={false}
            employeeName={onboardingState.employeeId ? onboardingState.employeeName : null}
            employeeRole={onboardingState.employeeRole}
            onComplete={handleComplete}
          />
        );

      default:
        return null;
    }
  };

  const progress = ((currentStep) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Compact progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-1 text-xs">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentStep > step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground shadow-glow-sm"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <step.icon className="h-3.5 w-3.5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 sm:w-20 h-1 rounded transition-colors duration-300 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Step {currentStep} of {steps.length} · {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Step content */}
        <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-xl min-h-[400px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
