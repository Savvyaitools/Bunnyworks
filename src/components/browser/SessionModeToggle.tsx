import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

type SessionMode = "shared" | "exclusive";

export function SessionModeToggle() {
  const { agency } = useAgency();
  const queryClient = useQueryClient();

  const { data: currentMode, isLoading } = useQuery({
    queryKey: ["agency-session-mode", agency?.id],
    queryFn: async () => {
      if (!agency?.id) return "shared";
      const { data, error } = await supabase
        .from("agencies")
        .select("browser_session_mode")
        .eq("id", agency.id)
        .single();
      if (error) return "shared";
      return (data?.browser_session_mode as SessionMode) || "shared";
    },
    enabled: !!agency?.id,
  });

  const mutation = useMutation({
    mutationFn: async (mode: SessionMode) => {
      if (!agency?.id) throw new Error("No agency");
      const { error } = await supabase
        .from("agencies")
        .update({ browser_session_mode: mode })
        .eq("id", agency.id);
      if (error) throw error;
    },
    onSuccess: (_, mode) => {
      queryClient.invalidateQueries({ queryKey: ["agency-session-mode", agency?.id] });
      toast.success(`Session mode set to ${mode === "shared" ? "Shared" : "Exclusive"}`);
    },
    onError: () => {
      toast.error("Failed to update session mode");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const modes: { value: SessionMode; label: string; description: string; icon: React.ReactNode; badge: string }[] = [
    {
      value: "shared",
      label: "Shared Sessions",
      description: "Multiple chatters share one browser session per creator. Reduces costs by 67%+ and maintains a single device fingerprint for OnlyFans safety. Chatters see the same browser and can collaborate in real-time.",
      icon: <Users className="h-5 w-5" />,
      badge: "Recommended",
    },
    {
      value: "exclusive",
      label: "Exclusive Sessions",
      description: "Only one chatter can access a creator's browser session at a time. Maximum OnlyFans account safety — zero risk of concurrent device detection. Other chatters see 'In use by [name]' and must wait.",
      icon: <Shield className="h-5 w-5" />,
      badge: "Max Safety",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Access Mode</CardTitle>
        <CardDescription>
          Control how multiple chatters access the same creator's browser session. This affects cost and OnlyFans account safety.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {modes.map((mode) => {
          const isActive = currentMode === mode.value;
          return (
            <div
              key={mode.value}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
              onClick={() => !mutation.isPending && mutation.mutate(mode.value)}
            >
              <div className={`mt-0.5 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {mode.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{mode.label}</span>
                  <Badge variant={isActive ? "default" : "outline"} className="text-xs">
                    {mode.badge}
                  </Badge>
                  {isActive && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{mode.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
