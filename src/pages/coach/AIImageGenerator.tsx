import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AIImageGenerator() {
  return (
    <DashboardLayout>
      <PageHeader title="Naked Savvy" subtitle="AI image generation & editing" />
      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden relative" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <iframe
          src="https://savvyaiagency-qwen-image-edit-rapid-aio-sfw-v23.hf.space"
          frameBorder="0"
          className="w-full absolute inset-0"
          style={{ height: "calc(100% + 80px)", minHeight: "540px" }}
          allow="clipboard-write"
          title="Naked Savvy"
        />
      </div>
    </DashboardLayout>
  );
}
