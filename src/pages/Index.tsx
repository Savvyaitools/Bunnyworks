import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      >
        {/* Carousel navigation overlay — simulates a horizontal drag on the
            scene canvas so users can rotate panels into the center without
            using a mouse drag. */}
        <CarouselNav />
      </div>
    </DashboardLayout>
  );
}

/**
 * The Ops Room renders three independently positioned panels (left tilted,
 * center flat, right tilted). The bundle does not expose a way to rotate
 * which one sits in the middle, so we override the panel containers' inline
 * `transform` and `aspectRatio` styles to visually swap any side panel into
 * the center slot. We identify panels by their stable inline-style markers
 * (left:1.5%, right:1.5%, and the centered translateX(-50%)).
 */
type SlotKey = "left" | "center" | "right";

function findPanels(): Record<SlotKey, HTMLElement | null> {
  const root = document.getElementById("opsroom-root");
  if (!root) return { left: null, center: null, right: null };
  const all = Array.from(root.querySelectorAll<HTMLElement>("div"));
  let left: HTMLElement | null = null;
  let right: HTMLElement | null = null;
  let center: HTMLElement | null = null;
  for (const el of all) {
    const s = el.getAttribute("style") || "";
    if (!s.includes("position: absolute")) continue;
    if (s.includes("left: 1.5%") && !left) left = el;
    else if (s.includes("right: 1.5%") && !right) right = el;
    else if (s.includes("translateX(-50%)") && s.includes("bottom: 32%") && !center)
      center = el;
  }
  return { left, center, right };
}

let activeSlot: SlotKey = "center";

function focusSlot(target: SlotKey) {
  const { left, center, right } = findPanels();
  if (!left || !center || !right) return;
  activeSlot = target;
  // Reset all to their natural slot styles
  const apply = (el: HTMLElement, role: SlotKey, isActive: boolean) => {
    if (isActive) {
      // Bring to center: flat, larger, in front
      el.style.zIndex = "20";
      el.style.transform = "translate(-50%, -50%)";
      el.style.left = "50%";
      el.style.right = "auto";
      el.style.top = "50%";
      el.style.bottom = "auto";
      el.style.width = "clamp(520px, 46vw, 900px)";
      el.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1), left 420ms, top 420ms, width 420ms";
      // Flatten any inner rotateY tilt on the immediate child
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1)";
        inner.style.transform = "rotateY(0deg)";
      }
    } else {
      // Send to its native side slot
      el.style.zIndex = "12";
      el.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1), left 420ms, top 420ms, width 420ms";
      if (role === "left") {
        el.style.left = "1.5%";
        el.style.right = "auto";
        el.style.top = "53%";
        el.style.bottom = "auto";
        el.style.width = "clamp(360px, 28vw, 560px)";
        el.style.transform = "translateY(-50%)";
      } else if (role === "right") {
        el.style.left = "auto";
        el.style.right = "1.5%";
        el.style.top = "53%";
        el.style.bottom = "auto";
        el.style.width = "clamp(360px, 28vw, 560px)";
        el.style.transform = "translateY(-50%)";
      } else {
        // The original center panel demoted to a side; put it on the side opposite the active one
        const sendRight = target === "left";
        el.style.left = sendRight ? "auto" : "1.5%";
        el.style.right = sendRight ? "1.5%" : "auto";
        el.style.top = "53%";
        el.style.bottom = "auto";
        el.style.width = "clamp(360px, 28vw, 560px)";
        el.style.transform = "translateY(-50%)";
      }
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1)";
        const tilt = role === "left" ? 22 : role === "right" ? -22 : target === "left" ? -22 : 22;
        inner.style.transform = `rotateY(${tilt}deg)`;
      }
    }
  };
  apply(left, "left", target === "left");
  apply(center, "center", target === "center");
  apply(right, "right", target === "right");
}

function cycleSlot(direction: "prev" | "next") {
  const order: SlotKey[] = ["left", "center", "right"];
  const i = order.indexOf(activeSlot);
  const next =
    direction === "next"
      ? order[(i + 1) % order.length]
      : order[(i - 1 + order.length) % order.length];
  focusSlot(next);
}

function CarouselNav() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-6 z-[60] flex items-center justify-center gap-2"
      style={{ left: 0, right: 0 }}
    >
      <button
        type="button"
        aria-label="Previous panel"
        onClick={() => cycleSlot("prev")}
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:scale-105"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-black/50 px-2 py-1 backdrop-blur-md">
        {(["left", "center", "right"] as const).map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => focusSlot(slot)}
            className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/70 rounded-full transition hover:text-white hover:bg-white/10"
          >
            {slot === "left" ? "AI Agents" : slot === "center" ? "Dashboard" : "Leaderboard"}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Next panel"
        onClick={() => cycleSlot("next")}
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 hover:scale-105"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
