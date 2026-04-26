import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

/**
 * BunnyWorks Ops Room — 3D dashboard rendered inside the DashboardLayout's main
 * content area (right of the sidebar). The scene from /public/ops-room/bundle.js
 * mounts on #opsroom-root, which fills the available content area without
 * overlapping the sidebar.
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
      {/* Mount inside the layout's padded main; negative margin cancels the
          DashboardLayout container padding so the 3D scene fills the panel
          edge-to-edge, while leaving the sidebar fully visible and clickable. */}
      <div
        id="opsroom-root"
        className="-m-5 lg:-m-8 xl:-mx-10"
        style={{
          height: "calc(100vh - 0px)",
          minHeight: "100vh",
          background: "#08040c",
          position: "relative",
          overflow: "hidden",
        }}
      />
    </DashboardLayout>
  );
}
