import { useEffect, useRef } from "react";

/**
 * BunnyWorks Ops Room — fullscreen 3D dashboard.
 * Loads the prebuilt bundle from /public/ops-room/bundle.js which mounts
 * a self-contained React tree onto #opsroom-root.
 */
export default function Index() {
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Load Orbitron + JetBrains Mono fonts used by the Ops Room
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&family=JetBrains+Mono:wght@500;600;700;800&display=swap";
    fontLink.dataset.opsroom = "1";
    document.head.appendChild(fontLink);

    // Inject the prebuilt bundle (ESM-style IIFE that mounts on #opsroom-root)
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/ops-room/bundle.js";
    script.dataset.opsroom = "1";
    document.body.appendChild(script);

    // Lock page scroll while Ops Room is mounted
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.querySelectorAll('[data-opsroom="1"]').forEach((n) => n.remove());
      const root = document.getElementById("opsroom-root");
      if (root) root.innerHTML = "";
    };
  }, []);

  return (
    <div
      id="opsroom-root"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "#08040c",
        zIndex: 1,
        overflow: "hidden",
      }}
    />
  );
}
