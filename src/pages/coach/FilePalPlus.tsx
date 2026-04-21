import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";

export default function FilePalPlus() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const url = "https://file-pal-plus.lovable.app";

  const reload = () => {
    setLoading(true);
    if (iframeRef.current) iframeRef.current.src = url;
  };

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Workflow" subtitle="File management & automation workflows" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reload}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reload
          </Button>
          <Button variant="default" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" /> Open in new tab
            </a>
          </Button>
        </div>
      </div>
      <div
        className="mt-6 rounded-xl border border-border bg-card overflow-hidden relative shadow-lg"
        style={{ height: "calc(100vh - 180px)", minHeight: "560px" }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm">Loading workflow…</span>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={() => setLoading(false)}
          className="w-full h-full border-0"
          allow="clipboard-write; clipboard-read"
          title="Workflow"
        />
      </div>
    </DashboardLayout>
  );
}