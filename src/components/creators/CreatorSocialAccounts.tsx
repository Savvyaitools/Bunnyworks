import { useState } from "react";
import { Plus, ExternalLink, Trash2, Instagram, Youtube } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatorSocialAccounts } from "@/hooks/useCreatorSocialAccounts";
import { cn } from "@/lib/utils";

interface CreatorSocialAccountsProps {
  creatorId: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
};

const platformColors: Record<string, string> = {
  instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
  tiktok: "bg-black",
  twitter: "bg-blue-400",
  x: "bg-black",
  onlyfans: "bg-blue-500",
  youtube: "bg-red-600",
  snapchat: "bg-yellow-400",
  fansly: "bg-blue-600",
  twitch: "bg-purple-600",
};

const platforms = [
  "Instagram",
  "TikTok",
  "Twitter",
  "OnlyFans",
  "YouTube",
  "Snapchat",
  "Fansly",
  "Twitch",
];

export function CreatorSocialAccounts({ creatorId }: CreatorSocialAccountsProps) {
  const { accounts, loading, createAccount, deleteAccount, getPlatformUrl } = useCreatorSocialAccounts(creatorId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform: "",
    username: "",
    account_type: "creator_managed" as "agency_managed" | "creator_managed",
  });

  const handleSubmit = async () => {
    if (!formData.platform || !formData.username) return;
    
    const success = await createAccount({
      creator_id: creatorId,
      platform: formData.platform,
      username: formData.username,
      account_type: formData.account_type,
    });

    if (success) {
      setFormData({ platform: "", username: "", account_type: "creator_managed" });
      setIsAddOpen(false);
    }
  };

  const openPlatform = (url: string | null) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="h-20 bg-muted rounded-lg" />
      </div>
    );
  }

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
              <DialogTitle>Add Social Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select
                value={formData.platform}
                onValueChange={(v) => setFormData({ ...formData, platform: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p) => (
                    <SelectItem key={p} value={p.toLowerCase()}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Username (without @)"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <Select
                value={formData.account_type}
                onValueChange={(v: "agency_managed" | "creator_managed") => 
                  setFormData({ ...formData, account_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator_managed">Creator Managed</SelectItem>
                  <SelectItem value="agency_managed">Agency Managed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSubmit} className="w-full">Add Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                platformColors[account.platform] || "bg-muted"
              )}>
                {platformIcons[account.platform] || (
                  <span className="text-xs font-bold uppercase">
                    {account.platform.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">{account.platform}</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      account.account_type === "agency_managed" 
                        ? "border-primary text-primary" 
                        : "border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {account.account_type === "agency_managed" ? "Agency" : "Creator"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">@{account.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openPlatform(account.profile_url || getPlatformUrl(account.platform, account.username))}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteAccount(account.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Instagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No social accounts linked yet.</p>
        </div>
      )}
    </div>
  );
}
