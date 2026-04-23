import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AIVoiceGenerator() {
  return (
    <DashboardLayout>
      <PageHeader title="Only Voice" subtitle="Generate realistic AI voice clones for text-to-speech" />
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden relative" style={{ height: "calc(100vh - 140px)", minHeight: "600px" }}>
        <iframe
          src="https://savvyaiagency-higgs-audio-v2.hf.space"
          frameBorder="0"
          className="w-full h-full border-0"
          allow="clipboard-write"
          title="Only Voice"
        />
      </div>
    </DashboardLayout>
  );
}
