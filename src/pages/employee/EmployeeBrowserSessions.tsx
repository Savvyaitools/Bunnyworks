import { useState, useEffect } from "react";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { ChatterSessionLauncher } from "@/components/browser/ChatterSessionLauncher";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeBrowserSessions() {
  const [chatterId, setChatterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatterId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("chatters")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (data) setChatterId(data.id);
      setLoading(false);
    };
    fetchChatterId();
  }, []);

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px]" />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Browser Sessions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Launch pre-authenticated browser sessions for your assigned creators
          </p>
        </div>

        {chatterId ? (
          <ChatterSessionLauncher chatterId={chatterId} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Info className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Chatter Profile Found</h2>
              <p className="text-muted-foreground max-w-md text-sm">
                Your account isn't linked to a chatter profile yet. Contact your manager to get set up.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="flex gap-3 items-start">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How it works</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your manager authenticates creator accounts via admin sessions</li>
                  <li>You can launch pre-authenticated sessions without needing credentials</li>
                  <li>Sessions are cloud-based — no downloads or extensions needed</li>
                  <li>All sessions are monitored and recorded for quality assurance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
}
