import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AIImageGenerator() {
  return (
    <DashboardLayout>
      <PageHeader title="Naked Savvy" subtitle="AI image generation & editing" />
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden relative" style={{ height: "calc(100vh - 140px)", minHeight: "600px" }}>
        <iframe
          src="https://savvyaiagency-qwen-image-edit-rapid-aio-sfw-v23.hf.space"
          frameBorder="0"
          className="w-full h-full border-0"
          allow="clipboard-write"
          title="Naked Savvy"
        />
      </div>
    </DashboardLayout>
  );
}
