import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";

export default function FilePalPlus() {
  return (
    <DashboardLayout>
      <PageHeader title="Workflow" subtitle="File management & automation workflows" />
      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden relative" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <iframe
          src="https://file-pal-plus.lovable.app"
          frameBorder="0"
          className="w-full absolute inset-0"
          style={{ height: "calc(100% + 80px)", minHeight: "540px" }}
          allow="clipboard-write"
          title="Workflow"
        />
      </div>
    </DashboardLayout>
  );
}