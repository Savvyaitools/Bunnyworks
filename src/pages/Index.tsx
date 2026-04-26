import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";

/**
 * BunnyWorks Ops Room — 3D dashboard rendered inside the DashboardLayout's main
 * content area (right of the sidebar). The scene from /public/ops-room/bundle.js
 * mounts on #opsroom-root, which fills the available content area without
 * overlapping the sidebar.
 */
export default function Index() {
  const mountedRef = useRef(false);
  const { data: stats } = useDashboardStats();
  const { agency } = useAgency();

  // Fetch real revenue (sum of creator earnings, current month)
  const { data: revenue } = useQuery({
    queryKey: ["ops-room-revenue", agency?.id],
    enabled: Boolean(agency?.id),
    staleTime: 60_000 * 5,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agency!.id);
      const ids = (creators || []).map((c: any) => c.id);
      if (ids.length === 0) return { net: 0, agency: 0 };
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount")
        .in("creator_id", ids)
        .gte("period_start", start.toISOString().slice(0, 10));
      const net = (earnings || []).reduce(
        (s: number, r: any) => s + Number(r.amount || 0),
        0,
      );
      return { net, agency: net * 0.5 };
    },
  });

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

  // Swap hardcoded dummy values inside the rendered Ops Room with real data
  useEffect(() => {
    const root = document.getElementById("opsroom-root");
    if (!root) return;
    const fmt = (n: number) =>
      `$${Math.round(n).toLocaleString("en-US")}`;
    const replacements: Array<[string, string]> = [];
    if (revenue) {
      replacements.push(["$28,961", fmt(revenue.net)]);
      replacements.push(["$14,481", fmt(revenue.agency)]);
    }
    if (stats) {
      // Note: "5" and "4" are short and risky to text-replace globally;
      // we target the specific stat-card value text nodes only.
      replacements.push(["__ACTIVE_CREATORS__", String(stats.activeCreators)]);
      replacements.push(["__TEAM_MEMBERS__", String(stats.activeEmployees)]);
    }
    if (replacements.length === 0) return;

    const apply = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let n: Node | null;
      while ((n = walker.nextNode())) nodes.push(n as Text);
      for (const node of nodes) {
        const txt = node.nodeValue || "";
        // Money replacements (safe — unique strings)
        if (revenue) {
          if (txt === "$28,961") node.nodeValue = fmt(revenue.net);
          else if (txt === "$14,481") node.nodeValue = fmt(revenue.agency);
        }
        // Active Creators / Team Members: detect via sibling label text
        if (stats && (txt === "5" || txt === "4")) {
          const parent = node.parentElement?.parentElement;
          const labelText = parent?.textContent || "";
          if (txt === "5" && /ACTIVE CREATORS/i.test(labelText)) {
            node.nodeValue = String(stats.activeCreators);
          } else if (txt === "4" && /TEAM MEMBERS/i.test(labelText)) {
            node.nodeValue = String(stats.activeEmployees);
          }
        }
      }
    };

    // Run repeatedly while bundle mounts/re-renders panels
    const interval = window.setInterval(apply, 600);
    apply();
    const stop = window.setTimeout(() => window.clearInterval(interval), 8000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [stats, revenue]);

  return (
    <DashboardLayout>
      {/* Mount inside the layout's padded main; negative margin cancels the
          DashboardLayout container padding so the 3D scene fills the panel
          edge-to-edge, while leaving the sidebar fully visible and clickable.
          overflow:hidden + max-width prevents the wide carousel panels from
          spilling past the right edge. */}
      <div
        id="opsroom-root"
        className="-m-5 lg:-m-8 xl:-mx-10"
        style={{
          height: "calc(100dvh - 1rem)",
          width: "auto",
          maxWidth: "100%",
          background: "#08040c",
          position: "relative",
          overflow: "hidden",
        }}
      />
    </DashboardLayout>
  );
}
