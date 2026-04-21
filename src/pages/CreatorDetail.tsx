import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreators, Creator } from "@/hooks/useCreators";
import { CreatorOverview } from "@/components/creators/CreatorOverview";
import { CreatorPlatformAccounts } from "@/components/creators/CreatorPlatformAccounts";
import { CreatorContentPlans } from "@/components/creators/CreatorContentPlans";
import { CreatorContentVault } from "@/components/creators/CreatorContentVault";
import { CreatorMarketing } from "@/components/creators/CreatorMarketing";
import { CreatorCustomRequests } from "@/components/creators/CreatorCustomRequests";
import { CreatorEarnings } from "@/components/creators/CreatorEarnings";
import { CreatorEmployeePermissions } from "@/components/creators/CreatorEmployeePermissions";
import { motion } from "framer-motion";

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
      <div className="space-y-5 max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Button variant="ghost" size="sm" onClick={() => navigate("/creators")} className="text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Creators
          </Button>
        </motion.div>

        <Tabs defaultValue="earnings" className="space-y-5">
          <TabsList className="bg-card/60 border border-border h-auto gap-0.5 p-1 overflow-x-auto flex-nowrap w-full justify-start scrollbar-hide">
          <TabsTrigger value="earnings" className="whitespace-nowrap text-sm px-3 py-1.5">Earnings</TabsTrigger>
            <TabsTrigger value="overview" className="whitespace-nowrap text-sm px-3 py-1.5">Overview</TabsTrigger>
            <TabsTrigger value="plans" className="whitespace-nowrap text-sm px-3 py-1.5">Plans</TabsTrigger>
            <TabsTrigger value="vault" className="whitespace-nowrap text-sm px-3 py-1.5">Vault</TabsTrigger>
            <TabsTrigger value="marketing" className="whitespace-nowrap text-sm px-3 py-1.5">Marketing</TabsTrigger>
            <TabsTrigger value="requests" className="whitespace-nowrap text-sm px-3 py-1.5">Requests</TabsTrigger>
            <TabsTrigger value="team-access" className="whitespace-nowrap text-sm px-3 py-1.5">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="glass-card p-6">
            <CreatorEarnings creatorId={creator.id} creatorCommissionRate={creator.commission_rate} />
          </TabsContent>

          <TabsContent value="overview" className="glass-card p-6">
            <CreatorOverview creator={creator} onUpdate={handleUpdate} />
          </TabsContent>

          <TabsContent value="plans" className="glass-card p-6">
            <CreatorContentPlans creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="vault" className="glass-card p-6">
            <CreatorContentVault creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="marketing" className="glass-card p-6">
            <CreatorMarketing creatorId={creator.id} creatorName={creator.name} />
          </TabsContent>

          <TabsContent value="requests" className="glass-card p-6">
            <CreatorCustomRequests creatorId={creator.id} />
          </TabsContent>

          <TabsContent value="team-access" className="glass-card p-6">
            <CreatorEmployeePermissions creatorId={creator.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
