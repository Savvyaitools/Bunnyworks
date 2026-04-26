import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

/**
 * BunnyWorks Ops Room — fullscreen 3D dashboard with sidebar/topbar overlay.
 * The 3D scene from /public/ops-room/bundle.js mounts on #opsroom-root and
 * is positioned fixed behind the DashboardLayout chrome (sidebar + topbar).
 */
export default function Index() {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&family=JetBrains+Mono:wght@500;600;700;800&display=swap";
    fontLink.dataset.opsroom = "1";
    document.head.appendChild(fontLink);

    const script = document.createElement("script");
    script.type = "module";
    script.src = "/ops-room/bundle.js";
    script.dataset.opsroom = "1";
    document.body.appendChild(script);

    return () => {
      document.querySelectorAll('[data-opsroom="1"]').forEach((n) => n.remove());
      const root = document.getElementById("opsroom-root");
      if (root) root.innerHTML = "";
    };
  }, []);

  return (
    <DashboardLayout>
      {/* Fullscreen mount point sits BEHIND the sidebar/topbar chrome.
          position:fixed escapes the layout's padded main and fills the viewport.
          pointer-events stays on so users can still click the 3D screens. */}
      <div
        id="opsroom-root"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          background: "#08040c",
          zIndex: 0,
        }}
      />
      {/* Spacer so the layout's padded main area still has measurable height */}
      <div style={{ minHeight: "calc(100vh - 4rem)" }} aria-hidden />
    </DashboardLayout>
  );
}
