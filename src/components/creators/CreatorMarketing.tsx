import { useState, useEffect, useCallback } from "react";
import { Plus, Link, Users, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MarketingAccount {
  id: string;
  platform: string;
  username: string;
  followers_count: number | null;
  is_connected: boolean | null;
  last_synced_at: string | null;
  creator_id: string;
}

interface CreatorMarketingProps {
  creatorId: string;
}

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-400",
  tiktok: "bg-cyan-500/20 text-cyan-400",
  twitter: "bg-blue-500/20 text-blue-400",
  youtube: "bg-red-500/20 text-red-400",
  onlyfans: "bg-blue-400/20 text-blue-300",
};

export function CreatorMarketing({ creatorId }: CreatorMarketingProps) {
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform: "",
    username: "",
    followers_count: "",
  });

  const fetchAccounts = useCallback(async () => {
    const { data, error } = await supabase
      .from("marketing_accounts")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (data) setAccounts(data as MarketingAccount[]);
  }, [creatorId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async () => {
    if (!formData.platform.trim() || !formData.username.trim()) return;

    const { error } = await supabase
      .from("marketing_accounts")
      .insert({
        platform: formData.platform.toLowerCase(),
        username: formData.username,
        followers_count: formData.followers_count ? parseInt(formData.followers_count) : null,
        creator_id: creatorId,
        is_connected: true,
        last_synced_at: new Date().toISOString(),
      });

    if (error) {
      toast.error("Failed to add account");
    } else {
      toast.success("Account added");
      setFormData({ platform: "", username: "", followers_count: "" });
      setIsAddOpen(false);
      fetchAccounts();
    }
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("marketing_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete account");
    } else {
      toast.success("Account removed");
      fetchAccounts();
    }
  };

  const formatFollowers = (count: number | null) => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Marketing Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Platform (e.g., Instagram, TikTok)"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              />
              <Input
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Followers count"
                value={formData.followers_count}
                onChange={(e) => setFormData({ ...formData, followers_count: e.target.value })}
              />
              <Button onClick={addAccount} className="w-full">Add Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="p-4 rounded-lg border border-border bg-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  platformColors[account.platform] || "bg-muted"
                )}>
                  <Link className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground capitalize">{account.platform}</h4>
                    <Badge
                      variant="outline"
                      className={account.is_connected ? "border-success text-success" : "border-destructive text-destructive"}
                    >
                      {account.is_connected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">@{account.username}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteAccount(account.id)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{formatFollowers(account.followers_count)} followers</span>
              </div>
              {account.last_synced_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  {new Date(account.last_synced_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No marketing accounts connected yet.</p>
        </div>
      )}
    </div>
  );
}
