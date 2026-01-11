import { AlertCircle, CheckCircle, Clock, RefreshCw, XCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useOnlyFansConnectionHealth, useRetrySync, ConnectionStatus } from "@/hooks/useOnlyFansConnectionHealth";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface OFConnectionStatusBannerProps {
  accountId: string | null;
  onReconnect?: () => void;
  compact?: boolean;
}

const statusConfig: Record<ConnectionStatus, {
  icon: typeof CheckCircle;
  title: string;
  variant: "default" | "destructive";
  className: string;
}> = {
  healthy: {
    icon: CheckCircle,
    title: "Connected",
    variant: "default",
    className: "border-success/50 bg-success/10 text-success",
  },
  expired: {
    icon: WifiOff,
    title: "Session Expired",
    variant: "destructive",
    className: "border-warning/50 bg-warning/10 text-warning",
  },
  error: {
    icon: XCircle,
    title: "Connection Error",
    variant: "destructive",
    className: "border-destructive/50 bg-destructive/10 text-destructive",
  },
  unknown: {
    icon: Wifi,
    title: "Checking Connection",
    variant: "default",
    className: "border-muted-foreground/50 bg-muted/50 text-muted-foreground",
  },
};

export function OFConnectionStatusBanner({ 
  accountId, 
  onReconnect,
  compact = false 
}: OFConnectionStatusBannerProps) {
  const { data: health, isLoading } = useOnlyFansConnectionHealth(accountId);
  const { mutate: retrySync, isPending: isRetrying } = useRetrySync();

  if (isLoading || !health) {
    return null;
  }

  const status = (health.of_connection_status as ConnectionStatus) || "unknown";
  const config = statusConfig[status];
  const Icon = config.icon;

  // Don't show banner for healthy connections in compact mode
  if (compact && status === "healthy") {
    return null;
  }

  const handleRetry = () => {
    if (accountId) {
      retrySync(accountId);
    }
  };

  const getDescription = () => {
    switch (status) {
      case "healthy":
        return health.of_last_synced_at
          ? `Last synced ${formatDistanceToNow(new Date(health.of_last_synced_at), { addSuffix: true })}`
          : "Connection is active";
      case "expired":
        return "The OnlyFans session has expired. Please reconnect to continue syncing messages and subscribers.";
      case "error":
        if (health.of_last_error?.includes("INSUFFICIENT_CREDIT")) {
          return "OnlyFans API credits are exhausted. Please contact your administrator.";
        }
        if (health.of_sync_retry_count && health.of_sync_retry_count >= 5) {
          return `Sync has failed ${health.of_sync_retry_count} times. Manual intervention required.`;
        }
        if (health.of_next_retry_at) {
          const retryIn = formatDistanceToNow(new Date(health.of_next_retry_at), { addSuffix: true });
          return `Connection error: ${health.of_last_error || "Unknown error"}. Will retry ${retryIn}.`;
        }
        return health.of_last_error || "An error occurred while syncing data.";
      case "unknown":
        return "Checking connection status...";
    }
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
        config.className
      )}>
        <Icon className="h-4 w-4" />
        <span className="font-medium">{config.title}</span>
        {status === "expired" && onReconnect && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onReconnect}
            className="ml-auto h-7"
          >
            Reconnect
          </Button>
        )}
        {status === "error" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-auto h-7"
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", isRetrying && "animate-spin")} />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert className={cn("border", config.className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {config.title}
        {status === "error" && health.of_sync_retry_count && health.of_sync_retry_count > 0 && (
          <span className="text-xs font-normal opacity-75">
            (Retry {health.of_sync_retry_count}/5)
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p className="text-sm opacity-90">{getDescription()}</p>
        
        <div className="flex items-center gap-2">
          {status === "expired" && onReconnect && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onReconnect}
              className="border-current"
            >
              <WifiOff className="h-4 w-4 mr-2" />
              Reconnect Account
            </Button>
          )}
          {(status === "error" || status === "unknown") && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              disabled={isRetrying}
              className="border-current"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} />
              {isRetrying ? "Syncing..." : "Retry Now"}
            </Button>
          )}
          {health.of_last_error_at && (
            <span className="text-xs opacity-75 ml-auto">
              Last error: {formatDistanceToNow(new Date(health.of_last_error_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
