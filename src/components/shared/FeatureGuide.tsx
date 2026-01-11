import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Lightbulb, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface GuideStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeatureGuideProps {
  title: string;
  description?: string;
  steps: GuideStep[];
  tips?: string[];
  storageKey: string;
  className?: string;
}

export function FeatureGuide({
  title,
  description,
  steps,
  tips,
  storageKey,
  className,
}: FeatureGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`guide-dismissed-${storageKey}`);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
    const expanded = localStorage.getItem(`guide-expanded-${storageKey}`);
    if (expanded === "false") {
      setIsExpanded(false);
    }
  }, [storageKey]);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem(`guide-expanded-${storageKey}`, String(newState));
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(`guide-dismissed-${storageKey}`, "true");
  };

  if (isDismissed) return null;

  return (
    <Card className={cn(
      "border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden",
      className
    )}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && !isExpanded && (
              <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <CardContent className="pt-0 pb-4">
              {description && (
                <p className="text-sm text-muted-foreground mb-4">{description}</p>
              )}

              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary shrink-0">
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">Step {index + 1}</span>
                        <span className="font-medium text-foreground">{step.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {tips && tips.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs font-semibold text-warning mb-2">💡 Pro Tips</p>
                  <ul className="space-y-1">
                    {tips.map((tip, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-warning">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
