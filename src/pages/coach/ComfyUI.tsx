import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ComfyUI() {
  return (
    <DashboardLayout>
      <PageHeader title="ComfyUI" subtitle="Node-based AI image & video workflow editor" />
      <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden relative" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <iframe
          src="https://savvyaiagency-comfyui-ruoxinzhi-v2.hf.space"
          frameBorder="0"
          className="w-full absolute inset-0"
          style={{ height: "calc(100% + 80px)", minHeight: "540px" }}
          allow="clipboard-write"
          title="ComfyUI"
        />
      </div>
    </DashboardLayout>
  );
}
