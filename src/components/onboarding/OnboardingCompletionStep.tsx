import { motion } from "framer-motion";
import { 
  PartyPopper, 
  Building2, 
  User, 
  Link2, 
  UserPlus, 
  ArrowRight,
  Users,
  LayoutDashboard,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  agencyLogo,
  creatorName,
  creatorConnected,
  employeeName,
  employeeRole,
  onComplete,
}: OnboardingCompletionStepProps) {
  const navigate = useNavigate();

  const summaryItems = [
    {
      icon: Building2,
      label: "Agency",
      value: agencyName,
      status: "complete",
    },
    {
      icon: User,
      label: "First Creator",
      value: creatorName || "Not added",
      status: creatorName ? "complete" : "skipped",
    },
    {
      icon: Link2,
      label: "OnlyFans Connection",
      value: creatorConnected ? "Connected" : "Not connected",
      status: creatorConnected ? "complete" : "skipped",
    },
    {
      icon: UserPlus,
      label: "Team Member",
      value: employeeName ? `${employeeName} (${employeeRole})` : "Not added",
      status: employeeName ? "complete" : "skipped",
    },
  ];

  const quickActions = [
    { 
      icon: LayoutDashboard, 
      label: "View Dashboard", 
      path: "/", 
      primary: true,
      description: "See your agency overview"
    },
    { 
      icon: User, 
      label: "Add More Creators", 
      path: "/creators",
      description: "Expand your roster"
    },
    { 
      icon: Users, 
      label: "Invite Team", 
      path: "/team",
      description: "Grow your team"
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: "/settings",
      description: "Customize your agency"
    },
  ];

  const handleAction = (path: string) => {
    onComplete();
    navigate(path);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Celebration Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
          className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-sm"
        >
          <PartyPopper className="h-10 w-10 text-primary" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold gradient-text"
        >
          You're All Set!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mt-2"
        >
          Your agency is ready to go. Here's what you've set up:
        </motion.p>
      </div>

      {/* Setup Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border rounded-lg divide-y"
      >
        {summaryItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className="flex items-center gap-3 p-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              item.status === "complete" 
                ? "bg-primary/10" 
                : "bg-muted"
            }`}>
              <item.icon className={`h-5 w-5 ${
                item.status === "complete" 
                  ? "text-primary" 
                  : "text-muted-foreground"
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`font-medium ${
                item.status === "skipped" ? "text-muted-foreground" : ""
              }`}>
                {item.value}
              </p>
            </div>
            {item.status === "complete" && (
              <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                  className="w-4 h-4 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <motion.path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="space-y-3"
      >
        <p className="text-sm font-medium text-center text-muted-foreground">
          What would you like to do next?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 + index * 0.1 }}
            >
              <Button
                variant={action.primary ? "default" : "outline"}
                className={`w-full h-auto py-3 flex flex-col items-center gap-1 ${
                  action.primary ? "shadow-glow-sm" : ""
                }`}
                onClick={() => handleAction(action.path)}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs opacity-70">{action.description}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="pt-4"
      >
        <Button
          size="lg"
          className="w-full shadow-glow-sm"
          onClick={() => handleAction("/")}
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
