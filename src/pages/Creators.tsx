import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { AccountCreationDialog } from "@/components/shared/AccountCreationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CreatorFormValues } from "@/lib/validations";

export default function Creators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

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

    // If password provided, create the auth account via edge function
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
        toast.error(`Creator added, but login account failed: ${error.message}`);
      }
    }

    setIsAddDialogOpen(false);
  };

  const handleOpenAccountDialog = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsAccountDialogOpen(true);
  };

  const handleAccountCreated = async (entityId: string, authUserId: string) => {
    await updateCreator(entityId, { auth_user_id: authUserId });
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

      <AccountCreationDialog
        open={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
        entity={selectedCreator}
        userType="creator"
        agencyId={agencyId}
        onAccountCreated={handleAccountCreated}
      />
    </DashboardLayout>
  );
}
