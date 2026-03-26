import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Users, 
  Globe, 
  UserCog, 
  FileText, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Users;
  href: string;
  completed: boolean;
}

export function GettingStartedChecklist() {
  const { agency } = useAgency();
  const agencyId = agency?.id;
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem("checklist-dismissed");
    if (d === "true") setDismissed(true);
  }, []);

  const { data: counts } = useQuery({
    queryKey: ["onboarding-checklist", agencyId],
    enabled: Boolean(agencyId),
    queryFn: async () => {
      const [creators, employees, sessions, invoices] = await Promise.all([
        supabase.from("creators").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!),
        supabase.from("employees").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!),
        supabase.from("active_browser_sessions").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!),
        supabase.from("invoices").select("*", { count: "exact", head: true }).eq("agency_id", agencyId!),
      ]);
      return {
        creators: creators.count || 0,
        employees: employees.count || 0,
        sessions: sessions.count || 0,
        invoices: invoices.count || 0,
      };
    },
  });

  if (dismissed) return null;

  const items: ChecklistItem[] = [
    {
      id: "creator",
      label: "Add your first creator",
      description: "Set up a creator profile to manage their content and earnings",
      icon: Users,
      href: "/creators",
      completed: (counts?.creators || 0) > 0,
    },
    {
      id: "employee",
      label: "Invite a team member",
      description: "Add chatters, managers, or VAs to your team",
      icon: UserCog,
      href: "/team",
      completed: (counts?.employees || 0) > 0,
    },
    {
      id: "session",
      label: "Launch a platform session",
      description: "Start managing creator accounts through platform access",
      icon: Globe,
      href: "/browser-sync",
      completed: (counts?.sessions || 0) > 0,
    },
    {
      id: "invoice",
      label: "Create an invoice",
      description: "Generate and track creator invoices",
      icon: FileText,
      href: "/invoices",
      completed: (counts?.invoices || 0) > 0,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;

  // All done — auto-dismiss after showing briefly
  if (completedCount === items.length) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("checklist-dismissed", "true");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden border-primary/20"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Getting Started</h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{items.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24">
            <Progress value={progress} className="h-1.5" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-1">
              {items.map((item, index) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                    item.completed
                      ? "opacity-60"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      item.completed ? "line-through text-muted-foreground" : "text-foreground"
                    }`}>
                      {item.label}
                    </p>
                    {!item.completed && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  {!item.completed && (
                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Start →
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
