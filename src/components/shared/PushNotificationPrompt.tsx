import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("push-prompt-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  if (!isSupported || isSubscribed || dismissed || permission === "denied") return null;

  const handleEnable = async () => {
    setLoading(true);
    const success = await subscribe();
    setLoading(false);
    if (success) {
      toast.success("Push notifications enabled!");
    } else {
      toast.error("Failed to enable notifications");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("push-prompt-dismissed", "true");
  };

  return (
    <div className="glass-card p-4 flex items-center gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
        <Bell className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Enable Push Notifications</p>
        <p className="text-xs text-muted-foreground">Get alerts for new tasks, messages, and updates on your phone</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={handleEnable} disabled={loading} className="gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          {loading ? "..." : "Enable"}
        </Button>
        <button onClick={handleDismiss} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [loading, setLoading] = useState(false);

  if (!isSupported) return null;

  const handleToggle = async () => {
    setLoading(true);
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) toast.success("Push notifications disabled");
    } else {
      const success = await subscribe();
      if (success) toast.success("Push notifications enabled!");
      else toast.error("Failed to enable notifications");
    }
    setLoading(false);
  };

  return (
    <Button 
      variant={isSubscribed ? "outline" : "default"} 
      size="sm" 
      onClick={handleToggle} 
      disabled={loading}
      className="gap-2"
    >
      {isSubscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {loading ? "..." : isSubscribed ? "Disable Push" : "Enable Push"}
    </Button>
  );
}
