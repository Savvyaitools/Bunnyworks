import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreators, Creator } from "@/hooks/useCreators";
import {
  CreatorOverview,
  CreatorPlatformAccounts,
  CreatorContentPlans,
  CreatorContentVault,
  CreatorMarketing,
  CreatorCustomRequests,
  CreatorEarnings,
  CreatorEmployeePermissions,
} from "@/components/creators";
import { AdminSessionLauncher } from "@/components/browser/AdminSessionLauncher";

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
          <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="platforms">Accounts</TabsTrigger>
            <TabsTrigger value="plans">Content Plans</TabsTrigger>
            <TabsTrigger value="vault">Content Vault</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="requests">Custom Requests</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="team-access">Team Access</TabsTrigger>
            <TabsTrigger value="browser">Browser</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="bg-card rounded-lg border border-border p-6">
            <CreatorOverview creator={creator} onUpdate={handleUpdate} />
          </TabsContent>

          <TabsContent value="platforms" className="bg-card rounded-lg border border-border p-6">
            <CreatorPlatformAccounts creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="plans" className="bg-card rounded-lg border border-border p-6">
            <CreatorContentPlans creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="vault" className="bg-card rounded-lg border border-border p-6">
            <CreatorContentVault creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="marketing" className="bg-card rounded-lg border border-border p-6">
            <CreatorMarketing creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="requests" className="bg-card rounded-lg border border-border p-6">
            <CreatorCustomRequests creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="earnings" className="bg-card rounded-lg border border-border p-6">
            <CreatorEarnings creatorId={creator.id} creatorCommissionRate={creator.commission_rate} />
          </TabsContent>

          <TabsContent value="team-access" className="bg-card rounded-lg border border-border p-6">
            <CreatorEmployeePermissions creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="browser" className="bg-card rounded-lg border border-border p-6">
            <AdminSessionLauncher preselectedCreatorId={creator.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
