import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { ImageIcon, Lock } from "lucide-react";

export default function AIImageGenerator() {
  return (
    <DashboardLayout>
      <PageHeader title="Naked Savvy" subtitle="AI image generation & editing" />
      <div className="mt-4 rounded-xl border border-border bg-card overflow-hidden relative flex items-center justify-center" style={{ height: "calc(100vh - 140px)", minHeight: "600px" }}>
        <div className="text-center max-w-md px-6 py-12 space-y-4">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20">
            <ImageIcon className="w-10 h-10 text-primary" />
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Coming Soon</h2>
          <p className="text-muted-foreground">
            AI image generation and editing is being fine-tuned for content-ready output. We're locking down quality and safety filters before launch.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs uppercase tracking-wider text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            In development
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
