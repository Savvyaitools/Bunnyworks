import { useState, useEffect, useCallback } from "react";
import { Plus, Link2, DollarSign, Users, RefreshCw, X, ExternalLink, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface PlatformAccount {
  id: string;
  platform: string;
  username: string;
  account_type: string;
  profile_url: string | null;
  of_account_id: string | null;
  of_connected_at: string | null;
  of_last_synced_at: string | null;
  creator_id: string;
}

interface CreatorPlatformAccountsProps {
  creatorId: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  OnlyFans: <Heart className="h-5 w-5" />,
  Fansly: <Sparkles className="h-5 w-5" />,
};

const platformColors: Record<string, string> = {
  OnlyFans: "bg-blue-500/20 text-blue-400",
  Fansly: "bg-cyan-500/20 text-cyan-400",
};

export function CreatorPlatformAccounts({ creatorId }: CreatorPlatformAccountsProps) {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    platform: "",
    username: "",
    profile_url: "",
  });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("creator_social_accounts")
      .select("*")
      .eq("creator_id", creatorId)
      .in("platform", ["OnlyFans", "Fansly"])
      .order("created_at", { ascending: false });

    if (data) setAccounts(data as PlatformAccount[]);
    setLoading(false);
  }, [creatorId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async () => {
    if (!formData.platform.trim() || !formData.username.trim()) return;

    const { error } = await supabase
      .from("creator_social_accounts")
      .insert({
        platform: formData.platform,
        username: formData.username,
        profile_url: formData.profile_url || null,
        creator_id: creatorId,
        account_type: "creator_managed",
      });

    if (error) {
      toast.error("Failed to add account");
    } else {
      toast.success("Platform account added");
      setFormData({ platform: "", username: "", profile_url: "" });
      setIsAddOpen(false);
      fetchAccounts();
    }
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase
      .from("creator_social_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete account");
    } else {
      toast.success("Account removed");
      fetchAccounts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Platform Accounts</h3>
          <p className="text-sm text-muted-foreground">
            OnlyFans, Fansly and other monetization platforms
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Platform Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData({ ...formData, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OnlyFans">
                    <span className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-blue-400" />
                      OnlyFans
                    </span>
                  </SelectItem>
                  <SelectItem value="Fansly">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                      Fansly
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <Input
                placeholder="Profile URL (optional)"
                value={formData.profile_url}
                onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              />
              <Button onClick={addAccount} className="w-full">Add Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected Accounts</p>
                <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Heart className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">OnlyFans</p>
                <p className="text-2xl font-bold text-foreground">
                  {accounts.filter(a => a.platform === "OnlyFans").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fansly</p>
                <p className="text-2xl font-bold text-foreground">
                  {accounts.filter(a => a.platform === "Fansly").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No platform accounts connected yet.</p>
          <p className="text-sm mt-1">Add OnlyFans or Fansly accounts to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      platformColors[account.platform] || "bg-muted"
                    )}>
                      {platformIcons[account.platform] || <Link2 className="h-6 w-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{account.platform}</h4>
                        <Badge
                          variant="outline"
                          className={account.of_connected_at ? "border-success text-success" : "border-muted text-muted-foreground"}
                        >
                          {account.of_connected_at ? "API Connected" : "Manual"}
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
                  {account.profile_url && (
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Profile
                    </a>
                  )}
                  {account.of_last_synced_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3" />
                      Last synced: {new Date(account.of_last_synced_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
