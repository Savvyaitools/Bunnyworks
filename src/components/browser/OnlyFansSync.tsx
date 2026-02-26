/**
 * @deprecated Uses useOnlyFansAPI which requires direct OF API credentials.
 * Earnings are now scraped via CDP in save_and_close. Kept for potential future use.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOnlyFansAPI } from "@/hooks/useOnlyFansAPI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Check, AlertCircle, Clock, Trash2, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConnectedAccount {
  id: string;
  creator_id: string;
  platform: string;
  username: string;
  of_account_id: string | null;
  of_connected_at: string | null;
  of_last_synced_at: string | null;
  creator?: {
    name: string;
  };
}

interface OnlyFansSyncProps {
  accounts: ConnectedAccount[];
  onRefresh: () => void;
}

export function OnlyFansSync({ accounts, onRefresh }: OnlyFansSyncProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { getEarnings, loading: apiLoading } = useOnlyFansAPI();

  const handleSync = async (account: ConnectedAccount) => {
    if (!account.of_account_id) {
      toast.error("No OnlyFans account ID found");
      return;
    }

    setSyncingId(account.id);

    try {
      const earnings = await getEarnings(account.of_account_id);
      
      if (earnings) {
        // Update last synced time
        await supabase
          .from("creator_social_accounts")
          .update({ of_last_synced_at: new Date().toISOString() })
          .eq("id", account.id);

        // Calculate total and insert as earnings record
        const total = earnings.total || 0;
        
        if (total > 0) {
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          
          await supabase.from("creator_earnings").insert({
            creator_id: account.creator_id,
            amount: total,
            period_start: startOfMonth.toISOString(),
            period_end: today.toISOString(),
            platform: "OnlyFans",
            notes: `Auto-synced from OnlyFans API. Tips: $${earnings.tips || 0}, Subs: $${earnings.subscriptions || 0}, Messages: $${earnings.messages || 0}`,
          });
        }

        toast.success(`Synced earnings: $${total.toFixed(2)}`);
        onRefresh();
      }
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Failed to sync earnings");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (account: ConnectedAccount) => {
    if (!confirm("Are you sure you want to disconnect this OnlyFans account?")) {
      return;
    }

    setDeletingId(account.id);

    const { error } = await supabase
      .from("creator_social_accounts")
      .delete()
      .eq("id", account.id);

    setDeletingId(null);

    if (error) {
      toast.error("Failed to disconnect account");
      return;
    }

    toast.success("Account disconnected");
    onRefresh();
  };

  const onlyFansAccounts = accounts.filter(
    (a) => a.platform === "onlyfans" && a.of_account_id
  );

  if (onlyFansAccounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No OnlyFans accounts connected yet.</p>
          <p className="text-sm mt-1">
            Connect an account from a creator's profile to enable earnings sync.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {onlyFansAccounts.map((account) => (
        <Card key={account.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {account.creator?.name || account.username}
                </CardTitle>
                <CardDescription>@{account.username}</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3" />
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {account.of_last_synced_at
                    ? `Synced ${formatDistanceToNow(new Date(account.of_last_synced_at))} ago`
                    : "Never synced"}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(account)}
                  disabled={syncingId === account.id || apiLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncingId === account.id ? "animate-spin" : ""}`} />
                  Sync Now
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(account)}
                  disabled={deletingId === account.id}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
