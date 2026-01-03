import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreators, Creator } from "@/hooks/useCreators";
import {
  CreatorOverview,
  CreatorContentVault,
  CreatorContentPlans,
  CreatorMarketing,
  CreatorEarnings,
  CreatorSocialAccounts,
} from "@/components/creators";

export default function CreatorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCreatorById, updateCreator } = useCreators();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreator = async () => {
      if (!id) return;
      const data = await getCreatorById(id);
      setCreator(data);
      setLoading(false);
    };
    fetchCreator();
  }, [id, getCreatorById]);

  const handleUpdate = async (input: Parameters<typeof updateCreator>[1]) => {
    if (!id) return null;
    const updated = await updateCreator(id, input);
    if (updated) setCreator(updated);
    return updated;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Creator not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/creators")}>
            Back to Creators
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/creators")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creators
        </Button>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vault">Content Vault</TabsTrigger>
            <TabsTrigger value="plans">Content Plans</TabsTrigger>
            <TabsTrigger value="social">Social Accounts</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="bg-card rounded-lg border border-border p-6">
            <CreatorOverview creator={creator} onUpdate={handleUpdate} />
          </TabsContent>

          <TabsContent value="vault" className="bg-card rounded-lg border border-border p-6">
            <CreatorContentVault creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="plans" className="bg-card rounded-lg border border-border p-6">
            <CreatorContentPlans creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="social" className="bg-card rounded-lg border border-border p-6">
            <CreatorSocialAccounts creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="marketing" className="bg-card rounded-lg border border-border p-6">
            <CreatorMarketing creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="earnings" className="bg-card rounded-lg border border-border p-6">
            <CreatorEarnings creatorId={creator.id} creatorCommissionRate={creator.commission_rate} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}