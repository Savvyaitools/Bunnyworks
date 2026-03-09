import { useState, useEffect, useCallback } from "react";
import { Plus, Link2, X, ExternalLink, Heart, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlatformAccount {
  id: string;
  platform: string;
  username: string;
  account_type: string;
  profile_url: string | null;
  of_account_id: string | null;
  of_connected_at: string | null;
  creator_id: string;
}

interface CreatorPlatformAccountsProps {
  creatorId: string;
}

const PLATFORM_ACCOUNTS = ["OnlyFans", "Fansly", "Fanvue"];

const platformConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  OnlyFans: { icon: <Heart className="h-5 w-5" />, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  Fansly: { icon: <Sparkles className="h-5 w-5" />, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  Fanvue: { icon: <Star className="h-5 w-5" />, color: "text-purple-400", bgColor: "bg-purple-500/20" },
};

export function CreatorPlatformAccounts({ creatorId }: CreatorPlatformAccountsProps) {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ platform: "", username: "", profile_url: "" });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("creator_social_accounts")
      .select("*")
      .eq("creator_id", creatorId)
      .in("account_type", ["creator_managed"])
      .order("created_at", { ascending: false });
    if (data) setAccounts(data as any as PlatformAccount[]);
    setLoading(false);
  }, [creatorId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const addAccount = async () => {
    if (!formData.platform.trim() || !formData.username.trim()) return;
    const { error } = await supabase.from("creator_social_accounts").insert({
      platform: formData.platform,
      username: formData.username,
      profile_url: formData.profile_url || null,
      creator_id: creatorId,
      account_type: "creator_managed",
    });
    if (error) { toast.error("Failed to add account"); }
    else {
      toast.success("Account added successfully");
      setFormData({ platform: "", username: "", profile_url: "" });
      setIsAddOpen(false);
      fetchAccounts();
    }
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from("creator_social_accounts").delete().eq("id", id);
    if (error) { toast.error("Failed to delete account"); }
    else { toast.success("Account removed"); fetchAccounts(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Platform Accounts</h3>
          <p className="text-sm text-muted-foreground">Manage monetization platform accounts (OnlyFans, Fansly, Fanvue)</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Platform
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20"><Link2 className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20"><Sparkles className="h-4 w-4 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground">API Linked</p>
                <p className="text-xl font-bold text-foreground">{accounts.filter(a => a.of_connected_at).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Link2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No platform accounts connected. Add OnlyFans, Fansly, or Fanvue accounts.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.map((account) => {
            const config = platformConfig[account.platform] || { icon: <Link2 className="h-5 w-5" />, color: "text-muted-foreground", bgColor: "bg-muted" };
            return (
              <Card key={account.id} className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bgColor)}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{account.platform}</h4>
                          {account.of_connected_at && (
                            <Badge variant="outline" className="border-success text-success">API Connected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{account.username}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteAccount(account.id)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {account.profile_url && (
                    <div className="mt-4">
                      <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> View Profile
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Account Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Platform Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
              <SelectTrigger><SelectValue placeholder="Select Platform" /></SelectTrigger>
              <SelectContent>
                {PLATFORM_ACCOUNTS.map((platform) => {
                  const config = platformConfig[platform];
                  return (
                    <SelectItem key={platform} value={platform}>
                      <span className="flex items-center gap-2">
                        <span className={config?.color}>{config?.icon}</span>
                        {platform}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Input placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            <Input placeholder="Profile URL (optional)" value={formData.profile_url} onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })} />
            <Button onClick={addAccount} className="w-full bg-gradient-primary">Add Account</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
