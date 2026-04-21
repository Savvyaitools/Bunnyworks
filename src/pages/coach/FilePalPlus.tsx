import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useRef, useState } from "react";

export default function FilePalPlus() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const url = "https://file-pal-plus.lovable.app";

  return (
    <DashboardLayout>
      <div
        className="rounded-xl border border-border bg-card overflow-hidden relative shadow-lg"
        style={{ height: "calc(100vh - 80px)", minHeight: "640px" }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm">Loading Agency Framework…</span>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={() => setLoading(false)}
          className="w-full border-0"
          style={{ height: "calc(100% + 280px)", marginTop: "-140px" }}
          allow="clipboard-write; clipboard-read"
          title="Agency Framework"
        />
        {/* Mask top header (Agency Framework title) */}
        <div className="absolute top-0 left-0 right-0 h-[140px] bg-card pointer-events-none z-[5]" />
        {/* Mask bottom command history bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[140px] bg-card pointer-events-none z-[5]" />
      </div>
    </DashboardLayout>
  );
}