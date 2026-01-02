import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Building2, Palette, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAgency } from "@/hooks/useAgency";
import { useAgencyLogo } from "@/hooks/useAgencyLogo";
import { LogoUpload } from "@/components/shared/LogoUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const steps = [
  { id: 1, title: "Welcome", icon: Rocket },
  { id: 2, title: "Agency Details", icon: Building2 },
  { id: 3, title: "Branding", icon: Palette },
  { id: 4, title: "Complete", icon: Check },
];

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

  // Set global handler for LogoUpload
  useEffect(() => {
    (window as any).__logoUploadHandler = uploadLogo;
    return () => {
      delete (window as any).__logoUploadHandler;
    };
  }, [uploadLogo]);

  // Initialize form with existing agency data
  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || "",
        website: agency.website || "",
        commissionRate: (agency.commission_rate || 0.3) * 100,
      });
    }
  }, [agency]);

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

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("agencies")
        .update({ onboarding_completed: true } as any)
        .eq("id", agencyId);

      if (error) throw error;
      await refetch();
      toast.success("Welcome to Creator OS!");
      navigate("/dashboard");
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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
              <Rocket className="h-10 w-10 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Creator OS</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's set up your agency in just a few steps. This will only take a minute.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
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
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your agency is ready to go. Start by adding your first creator or exploring the dashboard.
              </p>
            </div>

            {(logoUrl || formData.name) && (
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-card border">
                {logoUrl ? (
                  <img src={logoUrl} alt="Agency logo" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="text-left">
                  <p className="font-semibold">{formData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.commissionRate}% commission rate
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-1 rounded transition-colors ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border rounded-2xl p-8 shadow-xl min-h-[400px] flex flex-col">
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

          {/* Navigation */}
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

            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={saving || uploading}>
                {saving ? "Saving..." : "Continue"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={saving}>
                {saving ? "Finishing..." : "Go to Dashboard"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
