import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ComfyUI() {
  return (
    <DashboardLayout>
      <PageHeader title="ComfyUI" subtitle="Node-based AI image & video workflow editor" />
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden relative" style={{ height: "calc(100vh - 140px)", minHeight: "600px" }}>
        <iframe
          src="https://savvyaiagency-comfyui-ruoxinzhi-v2.hf.space"
          frameBorder="0"
          className="w-full h-full border-0"
          allow="clipboard-write"
          title="ComfyUI"
        />
      </div>
    </DashboardLayout>
  );
}
