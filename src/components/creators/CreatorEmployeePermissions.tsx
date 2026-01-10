import { useState } from "react";
import { Users, Shield, ShieldCheck, ShieldX, RefreshCw, MessageSquare, DollarSign, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEmployees } from "@/hooks/useEmployees";
import { useOFPermissionsManagement, PERMISSION_PRESETS } from "@/hooks/useEmployeeOFPermissions";
import { useCreatorSocialAccounts } from "@/hooks/useCreatorSocialAccounts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreatorEmployeePermissionsProps {
  creatorId: string;
}

type PresetKey = "chatter" | "manager" | "none";

export function CreatorEmployeePermissions({ creatorId }: CreatorEmployeePermissionsProps) {
  const { employees, loading: employeesLoading } = useEmployees();
  const { permissions, isLoading: permissionsLoading, applyPreset, revokePermission } = useOFPermissionsManagement(creatorId);
  const { accounts, loading: accountsLoading } = useCreatorSocialAccounts(creatorId);
  const [syncing, setSyncing] = useState(false);

  // Find connected OnlyFans account
  const ofAccount = accounts.find(
    (a) => a.platform.toLowerCase() === "onlyfans" && a.of_account_id
  );

  // Get current permission level for an employee
  const getEmployeePermissionLevel = (employeeId: string): PresetKey => {
    const perm = permissions.find((p) => p.employee_id === employeeId);
    if (!perm) return "none";
    
    // Check if matches manager preset
    if (perm.can_view_earnings && perm.can_send_mass_messages && perm.can_create_posts) {
      return "manager";
    }
    // Check if matches chatter preset
    if (perm.can_view_chats && perm.can_send_messages && !perm.can_view_earnings) {
      return "chatter";
    }
    // If has any permission but doesn't match presets, treat as chatter
    if (perm.can_view_chats || perm.can_send_messages) {
      return "chatter";
    }
    return "none";
  };

  const handlePermissionChange = async (employeeId: string, preset: PresetKey) => {
    if (preset === "none") {
      await revokePermission.mutateAsync({ employeeId, creatorId });
    } else {
      await applyPreset.mutateAsync({ employeeId, creatorId, preset });
    }
  };

  const handleSync = async () => {
    if (!ofAccount?.of_account_id) return;
    
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-onlyfans-data", {
        body: { accountId: ofAccount.of_account_id },
      });
      
      if (error) throw error;
      toast.success("OnlyFans data synced successfully!");
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const loading = employeesLoading || permissionsLoading || accountsLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* OnlyFans Connection Status */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            OnlyFans Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ofAccount ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="bg-green-600 text-white">
                  Connected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  @{ofAccount.username}
                </span>
                {ofAccount.of_last_synced_at && (
                  <span className="text-xs text-muted-foreground">
                    Last synced: {new Date(ofAccount.of_last_synced_at).toLocaleString()}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                Sync Now
              </Button>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No OnlyFans account connected. Go to the <strong>Platform Accounts</strong> tab to connect an OnlyFans account before granting team access.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Permission Presets Legend */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Permission Levels</CardTitle>
          <CardDescription>
            Choose what each team member can access for this creator's OnlyFans account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Chatter</p>
                <p className="text-xs text-muted-foreground">
                  View & reply to DMs, view subscribers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Manager</p>
                <p className="text-xs text-muted-foreground">
                  Full access: earnings, posts, mass DMs
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">None</p>
                <p className="text-xs text-muted-foreground">
                  No access to this creator's account
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Members
          </CardTitle>
          <CardDescription>
            Assign OnlyFans access to your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No employees found. Add employees first to grant them access.
            </p>
          ) : (
            <div className="space-y-3">
              {employees
                .filter((e) => e.status === "Active")
                .map((employee) => {
                  const currentLevel = getEmployeePermissionLevel(employee.id);
                  const isPending = applyPreset.isPending || revokePermission.isPending;

                  return (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {employee.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.role}
                            {employee.is_chatter && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Chatter
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {currentLevel !== "none" && (
                          <Badge
                            variant={currentLevel === "manager" ? "default" : "secondary"}
                            className="hidden sm:flex"
                          >
                            {currentLevel === "manager" ? (
                              <ShieldCheck className="h-3 w-3 mr-1" />
                            ) : (
                              <MessageSquare className="h-3 w-3 mr-1" />
                            )}
                            {currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1)}
                          </Badge>
                        )}
                        
                        <Select
                          value={currentLevel}
                          onValueChange={(value) => handlePermissionChange(employee.id, value as PresetKey)}
                          disabled={!ofAccount || isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="flex items-center gap-2">
                                <ShieldX className="h-4 w-4 text-muted-foreground" />
                                None
                              </span>
                            </SelectItem>
                            <SelectItem value="chatter">
                              <span className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                Chatter
                              </span>
                            </SelectItem>
                            <SelectItem value="manager">
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                Manager
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
