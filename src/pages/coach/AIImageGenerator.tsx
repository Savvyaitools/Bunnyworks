import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Image } from "lucide-react";

export default function AIImageGenerator() {
  return (
    <DashboardLayout>
      <PageHeader title="AI Image Generator" subtitle="Generate and edit images with AI" />
      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden relative" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <iframe
          src="https://savvyaiagency-qwen-image-edit-rapid-aio-sfw-v23.hf.space"
          frameBorder="0"
          className="w-full absolute inset-0"
          style={{ height: "calc(100% + 36px)", minHeight: "500px" }}
          allow="clipboard-write"
          title="AI Image Generator"
        />
      </div>
    </DashboardLayout>
  );
}
