import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useAllAccountsHealth, 
  useOnlyFansSyncLogs, 
  useRetrySync,
  ConnectionStatus 
} from "@/hooks/useOnlyFansConnectionHealth";
import { OFReconnectDialog } from "@/components/employee-of/OFReconnectDialog";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  Activity,
  WifiOff,
  Wifi
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig: Record<ConnectionStatus, {
  icon: typeof CheckCircle;
  label: string;
  className: string;
}> = {
  healthy: {
    icon: CheckCircle,
    label: "Healthy",
    className: "bg-success/10 text-success border-success/30",
  },
  expired: {
    icon: WifiOff,
    label: "Expired",
    className: "bg-warning/10 text-warning border-warning/30",
  },
  error: {
    icon: XCircle,
    label: "Error",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  unknown: {
    icon: Wifi,
    label: "Unknown",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export default function OnlyFansHealth() {
  const { data: accounts, isLoading, refetch } = useAllAccountsHealth();
  const { mutate: retrySync, isPending: isRetrying } = useRetrySync();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [reconnectDialog, setReconnectDialog] = useState<{
    open: boolean;
    accountId: string;
    username: string;
    socialAccountId: string;
  } | null>(null);

  const selectedAccount = accounts?.find(a => a.id === selectedAccountId);
  const { data: syncLogs } = useOnlyFansSyncLogs(selectedAccountId);

  const healthySummary = accounts?.filter(a => a.of_connection_status === "healthy").length || 0;
  const expiredSummary = accounts?.filter(a => a.of_connection_status === "expired").length || 0;
  const errorSummary = accounts?.filter(a => a.of_connection_status === "error").length || 0;

  const handleRetryAll = async () => {
    const errorAccounts = accounts?.filter(a => a.of_connection_status === "error") || [];
    for (const account of errorAccounts) {
      if (account.of_account_id) {
        retrySync(account.of_account_id);
      }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">OnlyFans Health Monitor</h1>
            <p className="text-muted-foreground">
              Monitor and manage all connected OnlyFans accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRetrying}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} />
              Refresh
            </Button>
            {errorSummary > 0 && (
              <Button onClick={handleRetryAll} disabled={isRetrying}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} />
                Retry All Failed ({errorSummary})
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{accounts?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{healthySummary}</p>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{expiredSummary}</p>
                  <p className="text-sm text-muted-foreground">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{errorSummary}</p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Click an account to view sync history and details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {(!accounts || accounts.length === 0) ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No connected OnlyFans accounts</p>
                    </div>
                  ) : (
                    accounts.map((account) => {
                      const status = (account.of_connection_status as ConnectionStatus) || "unknown";
                      const config = statusConfig[status];
                      const Icon = config.icon;
                      const creator = account.creator as { name: string; alias: string | null; avatar_url: string | null } | null;

                      return (
                        <div
                          key={account.id}
                          onClick={() => setSelectedAccountId(account.id)}
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all",
                            selectedAccountId === account.id 
                              ? "border-primary bg-primary/5" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={creator?.avatar_url || undefined} />
                              <AvatarFallback>
                                {creator?.name?.[0] || account.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {creator?.alias || creator?.name || account.username}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("shrink-0", config.className)}
                                >
                                  <Icon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                @{account.username}
                              </p>
                              {account.of_last_synced_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  Last sync: {formatDistanceToNow(new Date(account.of_last_synced_at), { addSuffix: true })}
                                </p>
                              )}
                              {account.of_last_error && status !== "healthy" && (
                                <p className="text-xs text-destructive mt-1 truncate">
                                  {account.of_last_error}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {status === "expired" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReconnectDialog({
                                      open: true,
                                      accountId: account.of_account_id!,
                                      username: account.username,
                                      socialAccountId: account.id,
                                    });
                                  }}
                                >
                                  Reconnect
                                </Button>
                              )}
                              {status === "error" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (account.of_account_id) {
                                      retrySync(account.of_account_id);
                                    }
                                  }}
                                  disabled={isRetrying}
                                >
                                  <RefreshCw className={cn("h-3 w-3 mr-1", isRetrying && "animate-spin")} />
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Sync History Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync History</CardTitle>
              <CardDescription>
                {selectedAccount 
                  ? `Recent syncs for @${selectedAccount.username}`
                  : "Select an account to view history"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                {!selectedAccountId ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select an account to view sync history</p>
                  </div>
                ) : !syncLogs || syncLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sync history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {syncLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {log.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : log.status === "partial" ? (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span className="font-medium capitalize">{log.status}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.sync_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                        {log.items_synced > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.items_synced} items synced
                            {log.duration_ms && ` in ${(log.duration_ms / 1000).toFixed(1)}s`}
                          </p>
                        )}
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-1 truncate">
                            {log.error_message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reconnect Dialog */}
      {reconnectDialog && (
        <OFReconnectDialog
          open={reconnectDialog.open}
          onOpenChange={(open) => {
            if (!open) setReconnectDialog(null);
          }}
          accountId={reconnectDialog.accountId}
          username={reconnectDialog.username}
          socialAccountId={reconnectDialog.socialAccountId}
        />
      )}
    </DashboardLayout>
  );
}
