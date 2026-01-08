import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface PermissionGateProps {
  permission: boolean;
  children: ReactNode;
  message?: string;
}

export function PermissionGate({ permission, children, message }: PermissionGateProps) {
  if (!permission) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            {message || "You don't have permission to access this feature."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
