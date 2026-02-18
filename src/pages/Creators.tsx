import { useState } from "react";
import { Search, Plus, Copy, RefreshCw, Eye, EyeOff, Check } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreators, Creator } from "@/hooks/useCreators";
import { useAgency } from "@/hooks/useAgency";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatorCard } from "@/components/creators/CreatorCard";
import { CreatorForm } from "@/components/forms";
import { formatCurrency } from "@/lib/formatters";
import { generatePassword, copyToClipboard } from "@/lib/passwordUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CreatorFormValues } from "@/lib/validations";

export default function Creators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const { creators, loading, stats, createCreator, updateCreator, deleteCreator } = useCreators();
  const { agencyId } = useAgency();

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch = 
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (creator.alias?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const handleSubmit = async (data: CreatorFormValues) => {
    const creatorResult = await createCreator({
      name: data.name,
      email: data.email,
      phone: null,
      avatar_seed: data.name.toLowerCase().split(" ")[0],
      avatar_url: null,
      status: "Active",
      revenue: 0,
      platform: data.platform || null,
      followers: data.followers || null,
      notes: null,
      alias: null,
      online_status: false,
      manager_id: null,
      onlyfans_url: null,
      instagram_url: null,
      tiktok_url: null,
      twitter_url: null,
      snapchat_url: null,
      commission_rate: null,
      auth_user_id: null,
      persona: data.persona || null,
    });

    // If password provided, create the auth account via edge function (prevents session switch)
    if (data.password && data.password.length >= 8 && creatorResult) {
      try {
        const { data: result, error } = await supabase.functions.invoke("create-user-account", {
          body: {
            email: data.email,
            password: data.password,
            fullName: data.name,
            userType: "creator",
            agencyId,
          },
        });

        if (error) throw error;
        if (result?.error) throw new Error(result.error);
        if (result?.user?.id) {
          await updateCreator(creatorResult.id, { auth_user_id: result.user.id });
          toast.success("Creator added with login account!");
        }
      } catch (error: any) {
        // Creator was added but account creation failed
        toast.error(`Creator added, but login account failed: ${error.message}`);
      }
    }

    setIsAddDialogOpen(false);
  };

  const handleOpenAccountDialog = (creator: Creator) => {
    setSelectedCreator(creator);
    setPassword(generatePassword());
    setShowPassword(true);
    setAccountCreated(false);
    setPasswordError("");
    setIsAccountDialogOpen(true);
  };

  const handleGeneratePassword = () => {
    setPassword(generatePassword());
    setPasswordError("");
  };

  const handleCopyPassword = async () => {
    const success = await copyToClipboard(password);
    if (success) {
      toast.success("Password copied to clipboard");
    } else {
      toast.error("Failed to copy password");
    }
  };

  const handleCopyCredentials = async () => {
    if (!selectedCreator) return;
    const credentials = `Email: ${selectedCreator.email}\nPassword: ${password}`;
    const success = await copyToClipboard(credentials);
    if (success) {
      toast.success("Credentials copied to clipboard");
    } else {
      toast.error("Failed to copy credentials");
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedCreator) return;
    
    // Validate password
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setIsCreatingAccount(true);
    try {
      // Create auth account via edge function (prevents session switch)
      const { data: result, error } = await supabase.functions.invoke("create-user-account", {
        body: {
          email: selectedCreator.email,
          password: password,
          fullName: selectedCreator.name,
          userType: "creator",
          agencyId,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      if (!result?.user?.id) throw new Error("Failed to create user account");

      // Link auth account to creator
      await updateCreator(selectedCreator.id, { auth_user_id: result.user.id });

      setAccountCreated(true);
      toast.success("Login account created successfully!");
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast.error("This email is already registered");
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleCloseAccountDialog = () => {
    setIsAccountDialogOpen(false);
    setSelectedCreator(null);
    setPassword("");
    setAccountCreated(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Creators</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading..." : `${stats.total} creators • ${formatCurrency(stats.totalRevenue)} total revenue`}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Creator
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add New Creator</DialogTitle>
              </DialogHeader>
              <CreatorForm onSubmit={handleSubmit} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search creators by name or alias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary input-glow"
            />
          </div>
        </div>

        {/* Creator Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="creator-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-5 w-24 mb-4" />
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCreators.map((creator, index) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onDelete={deleteCreator}
                onCreateAccount={handleOpenAccountDialog}
                index={index}
              />
            ))}
          </div>
        )}

        {!loading && filteredCreators.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <p className="text-muted-foreground">No creators found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Create Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={handleCloseAccountDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {accountCreated ? "Account Created!" : "Create Login Account"}
            </DialogTitle>
            <DialogDescription>
              {accountCreated 
                ? "Share these credentials with the creator so they can log in."
                : `Create login credentials for ${selectedCreator?.name}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={selectedCreator?.email || ""}
                disabled
                className="bg-muted/50"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    disabled={accountCreated}
                    className={cn(
                      "pr-10",
                      passwordError && "border-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!accountCreated && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGeneratePassword}
                    title="Generate new password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>

            {/* Actions */}
            {accountCreated ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCopyCredentials}
                  className="w-full"
                  variant="outline"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All Credentials
                </Button>
                <Button
                  onClick={handleCloseAccountDialog}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleCreateAccount}
                disabled={isCreatingAccount}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {isCreatingAccount ? "Creating..." : "Create Account"}
              </Button>
            )}

            {!accountCreated && (
              <p className="text-xs text-muted-foreground text-center">
                The creator will use these credentials to log in at the Staff Portal.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
