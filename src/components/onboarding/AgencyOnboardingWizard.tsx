import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Building2, 
  Palette, 
  Rocket,
  User,
  Link2,
  UserPlus,
  Shield,
  PartyPopper
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
import { OnboardingOFConnectStep } from "./OnboardingOFConnectStep";
import { OnboardingEmployeeStep } from "./OnboardingEmployeeStep";
import { OnboardingPermissionsStep } from "./OnboardingPermissionsStep";
import { OnboardingCompletionStep } from "./OnboardingCompletionStep";

const steps = [
  { id: 1, title: "Welcome", icon: Rocket },
  { id: 2, title: "Agency Details", icon: Building2 },
  { id: 3, title: "Branding", icon: Palette },
  { id: 4, title: "First Creator", icon: User },
  { id: 5, title: "Connect OF", icon: Link2 },
  { id: 6, title: "Team Member", icon: UserPlus },
  { id: 7, title: "Permissions", icon: Shield },
  { id: 8, title: "Complete", icon: PartyPopper },
];

interface OnboardingState {
  creatorId: string | null;
  creatorName: string;
  ofConnected: boolean;
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
    ofConnected: false,
    employeeId: null,
    employeeName: "",
    employeeRole: "",
  });

  // Set global handler for LogoUpload
  useEffect(() => {
    (window as any).__logoUploadHandler = uploadLogo;
    return () => {
      delete (window as any).__logoUploadHandler;
    };
  }, [uploadLogo]);

  // Initialize form with existing agency data and resume from saved step
  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        website: agency.website || "",
        commissionRate: (agency.commission_rate || 0.3) * 100,
      });
      // Resume from saved step if available
      const savedStep = (agency as any).onboarding_step;
      if (savedStep && savedStep > 1 && savedStep <= 8) {
        setCurrentStep(savedStep);
      }
    }
  }, [agency]);

  // Save progress to database
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

  const handleNext = async () => {
    if (currentStep === 2) {
      // Validate and save agency details
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
    }

    if (currentStep === 3) {
      // Save commission rate
      setSaving(true);
      try {
        const { error } = await supabase
          .from("agencies")
          .update({
            commission_rate: formData.commissionRate / 100,
          })
          .eq("id", agencyId);

        if (error) throw error;
        await refetch();
      } catch (error) {
        console.error("Error saving commission rate:", error);
        toast.error("Failed to save settings");
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    if (currentStep < 8) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      saveProgress(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreatorComplete = (creatorId: string | null) => {
    if (creatorId) {
      setOnboardingState((prev) => ({
        ...prev,
        creatorId,
        creatorName: "Creator", // Will be updated by form
      }));
    }
    const nextStep = 5;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
  };

  const handleCreatorSkip = () => {
    const nextStep = 5;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
  };

  const handleOFComplete = (connected: boolean) => {
    setOnboardingState((prev) => ({ ...prev, ofConnected: connected }));
    const nextStep = 6;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
  };

  const handleOFSkip = () => {
    const nextStep = 6;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
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
    // If we have both creator and employee, go to permissions; otherwise skip to complete
    const nextStep = onboardingState.creatorId && employeeId ? 7 : 8;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
  };

  const handleEmployeeSkip = () => {
    // Skip permissions since no employee, go straight to complete
    const nextStep = 8;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
  };

  const handlePermissionsComplete = () => {
    const nextStep = 8;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
  };

  const handlePermissionsSkip = () => {
    const nextStep = 8;
    setCurrentStep(nextStep);
    saveProgress(nextStep);
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
      toast.success("Welcome to Creator OS!");
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
          <div className="text-center space-y-6">
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto shadow-glow-sm"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
            >
              <Rocket className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold mb-2 gradient-text">Welcome to Creator OS</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's set up your agency in just a few steps. We'll walk you through adding 
                creators, connecting accounts, and building your team.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-4 max-w-md mx-auto">
              {[
                { icon: Building2, label: "Agency" },
                { icon: User, label: "Creator" },
                { icon: Link2, label: "OnlyFans" },
                { icon: UserPlus, label: "Team" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50"
                >
                  <item.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Agency Details</h2>
              <p className="text-muted-foreground">Tell us about your agency</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="agency-name">Agency Name *</Label>
                <Input
                  id="agency-name"
                  placeholder="Enter your agency name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://youragency.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Branding & Settings</h2>
              <p className="text-muted-foreground">Customize your agency</p>
            </div>

            <div className="space-y-8 max-w-md mx-auto">
              <div className="space-y-4">
                <Label>Agency Logo (optional)</Label>
                <LogoUpload
                  currentLogoUrl={logoUrl}
                  agencyName={formData.name || "Agency"}
                  onUploadComplete={() => {}}
                  onDelete={deleteLogo}
                  uploading={uploading}
                  size="lg"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Default Commission Rate</Label>
                  <span className="text-lg font-semibold text-primary">
                    {formData.commissionRate}%
                  </span>
                </div>
                <Slider
                  value={[formData.commissionRate]}
                  onValueChange={(value) => setFormData({ ...formData, commissionRate: value[0] })}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  This is the default commission your agency takes from creator earnings
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <OnboardingCreatorStep
            onComplete={handleCreatorComplete}
            onSkip={handleCreatorSkip}
          />
        );

      case 5:
        return (
          <OnboardingOFConnectStep
            creatorId={onboardingState.creatorId}
            creatorName={onboardingState.creatorName || "your creator"}
            onComplete={handleOFComplete}
            onSkip={handleOFSkip}
          />
        );

      case 6:
        return (
          <OnboardingEmployeeStep
            onComplete={handleEmployeeComplete}
            onSkip={handleEmployeeSkip}
          />
        );

      case 7:
        return (
          <OnboardingPermissionsStep
            employeeId={onboardingState.employeeId}
            employeeName={onboardingState.employeeName}
            employeeRole={onboardingState.employeeRole}
            creatorId={onboardingState.creatorId}
            creatorName={onboardingState.creatorName || "your creator"}
            onComplete={handlePermissionsComplete}
            onSkip={handlePermissionsSkip}
          />
        );

      case 8:
        return (
          <OnboardingCompletionStep
            agencyName={formData.name}
            agencyLogo={logoUrl}
            creatorName={onboardingState.creatorId ? onboardingState.creatorName : null}
            creatorConnected={onboardingState.ofConnected}
            employeeName={onboardingState.employeeId ? onboardingState.employeeName : null}
            employeeRole={onboardingState.employeeRole}
            onComplete={handleComplete}
          />
        );

      default:
        return null;
    }
  };

  // Determine if we should show navigation buttons
  const showNavigation = currentStep >= 1 && currentStep <= 3;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground shadow-glow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                </motion.div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-6 h-1 mx-0.5 rounded transition-colors duration-300 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border rounded-2xl p-8 shadow-xl min-h-[450px] flex flex-col">
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

          {/* Navigation - only show for first 3 steps */}
          {showNavigation && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 || saving}
                className={currentStep === 1 ? "invisible" : ""}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <Button onClick={handleNext} disabled={saving || uploading}>
                {saving ? "Saving..." : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
