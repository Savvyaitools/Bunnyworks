import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FelixChat } from "@/components/ai/FelixChat";

export default function CoachPBFPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Coach PBF" subtitle="Your AI strategic coach — revenue insights, performance analysis & agency optimization" />
      <div className="mt-6" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
        <FelixChat className="h-full" />
      </div>
    </DashboardLayout>
  );
}
