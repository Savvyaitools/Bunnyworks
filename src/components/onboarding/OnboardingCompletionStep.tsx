import { motion } from "framer-motion";
import { 
  PartyPopper, 
  Building2, 
  User, 
  UserPlus, 
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingCompletionStepProps {
  agencyName: string;
  agencyLogo: string | null;
  creatorName: string | null;
  creatorConnected: boolean;
  employeeName: string | null;
  employeeRole: string | null;
  onComplete: () => void;
}

export function OnboardingCompletionStep({
  agencyName,
  creatorName,
  employeeName,
  employeeRole,
  onComplete,
}: OnboardingCompletionStepProps) {
  const summaryItems = [
    {
      icon: Building2,
      label: "Agency",
      value: agencyName,
      status: "complete",
    },
    {
      icon: User,
      label: "Creator",
      value: creatorName || "Skipped — add later",
      status: creatorName ? "complete" : "skipped",
    },
    {
      icon: UserPlus,
      label: "Team",
      value: employeeName ? `${employeeName} (${employeeRole})` : "Skipped — invite later",
      status: employeeName ? "complete" : "skipped",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Celebration */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
          className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-3 shadow-glow-sm"
        >
          <PartyPopper className="h-8 w-8 text-primary" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold gradient-text"
        >
          You're all set!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-muted-foreground mt-1"
        >
          Your dashboard has a Getting Started guide to help you next
        </motion.p>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border rounded-lg divide-y"
      >
        {summaryItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              item.status === "complete" ? "bg-primary/10" : "bg-muted"
            }`}>
              <item.icon className={`h-4 w-4 ${
                item.status === "complete" ? "text-primary" : "text-muted-foreground"
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-sm font-medium ${
                item.status === "skipped" ? "text-muted-foreground" : ""
              }`}>{item.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Single CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button size="lg" className="w-full shadow-glow-sm" onClick={onComplete}>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Go to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
