import { useCallback, useEffect, useRef, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BunnyWorks Ops Room — 3D dashboard.
 *
 * The scene comes from /public/ops-room/bundle.js, which mounts a React tree
 * of its own onto `#opsroom-root` via `createRoot`. We treat the bundle as a
 * one-shot side-effect: load the script + font once per page lifetime, never
 * re-execute it (re-executing causes React error #299 because `createRoot`
 * gets called twice on the same node), and just leave the DOM intact across
 * route transitions on this page.
 */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&family=JetBrains+Mono:wght@500;600;700;800&display=swap";
const BUNDLE_VERSION = "bunny-room-v2";
const BUNDLE_SRC = `/ops-room/bundle.js?v=${BUNDLE_VERSION}`;
const BUNDLE_SCRIPT_SELECTOR = 'script[data-opsroom="1"]';

function injectOpsRoomBundle(force = false) {
  const existing = document.querySelector<HTMLScriptElement>(BUNDLE_SCRIPT_SELECTOR);
  if (existing && !force) return;
  existing?.remove();

  const script = document.createElement("script");
  script.type = "module";
  script.src = force ? `${BUNDLE_SRC}&remount=${Date.now()}` : BUNDLE_SRC;
  script.dataset.opsroom = "1";
  script.onload = () => {
    script.dataset.loaded = "1";
  };
  document.body.appendChild(script);
}

function ensureOpsRoomAssets() {
  if (!document.querySelector(`link[data-opsroom="1"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    link.dataset.opsroom = "1";
    document.head.appendChild(link);
  }
  injectOpsRoomBundle();
}

export default function Index() {
  const { data: stats } = useDashboardStats();
  const { agency } = useAgency();

  // Real revenue (sum of creator earnings, current month).
  const { data: revenue } = useQuery({
    queryKey: ["ops-room-revenue", agency?.id],
    enabled: Boolean(agency?.id),
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data: creators } = await supabase
        .from("creators")
        .select("id")
        .eq("agency_id", agency!.id);
      const ids = (creators ?? []).map((c: { id: string }) => c.id);
      if (ids.length === 0) return { net: 0, agency: 0 };
      const { data: earnings } = await supabase
        .from("creator_earnings")
        .select("amount")
        .in("creator_id", ids)
        .gte("period_start", start.toISOString().slice(0, 10));
      const net = (earnings ?? []).reduce(
        (s: number, r: { amount: number | string | null }) =>
          s + Number(r.amount ?? 0),
        0,
      );
      return { net, agency: net * 0.5 };
    },
  });

  // Inject the bundle once per page-lifetime — no cleanup, since the bundle
  // itself owns its own React root and tearing it down mid-flight throws #299.
  useEffect(() => {
    ensureOpsRoomAssets();

    const verifyMount = window.setTimeout(() => {
      const root = document.getElementById("opsroom-root");
      if (root && root.childElementCount === 0) {
        injectOpsRoomBundle(true);
      }
    }, 600);

    return () => window.clearTimeout(verifyMount);
  }, []);

  // Patch dummy values inside the rendered Ops Room with real data.
  // Uses MutationObserver instead of setInterval so we react exactly when
  // the bundle finishes painting, not on a fixed timer.
  const revenueRef = useRef(revenue);
  const statsRef = useRef(stats);
  revenueRef.current = revenue;
  statsRef.current = stats;

  const applyReal = useCallback(() => {
    const root = document.getElementById("opsroom-root");
    if (!root) return;
    const rev = revenueRef.current;
    const st = statsRef.current;
    if (!rev && !st) return;

    const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = node as Text;
      const v = text.nodeValue;
      if (!v) continue;
      if (rev) {
        if (v === "$28,961") text.nodeValue = fmt(rev.net);
        else if (v === "$14,481") text.nodeValue = fmt(rev.agency);
      }
      if (st && (v === "5" || v === "4")) {
        const labelText = text.parentElement?.parentElement?.textContent ?? "";
        if (v === "5" && /ACTIVE CREATORS/i.test(labelText)) {
          text.nodeValue = String(st.activeCreators);
        } else if (v === "4" && /TEAM MEMBERS/i.test(labelText)) {
          text.nodeValue = String(st.activeEmployees);
        }
      }
    }
  }, []);

  useEffect(() => {
    const root = document.getElementById("opsroom-root");
    if (!root) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(applyReal);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });

    // Stop observing after 10s — the bundle is fully settled by then.
    const stop = window.setTimeout(() => observer.disconnect(), 10_000);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(stop);
    };
  }, [applyReal, stats, revenue]);

  return (
    <DashboardLayout>
      <div
        className="-m-5 lg:-m-8 xl:-mx-10"
        style={{
          position: "relative",
          height: "calc(100dvh - 2rem)",
          width: "auto",
          overflow: "hidden",
          backgroundColor: "#08040c",
          backgroundImage: `url('/ops-room/background.jpg?v=${BUNDLE_VERSION}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div
          id="opsroom-root"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: "transparent",
          }}
        />
      </div>
      <CarouselNav />
      {/* Override the bundle's hard-coded 100vw/100vh on its root container
          so the 3D scene fills the available area inside the sidebar layout
          instead of overflowing to the right and leaving a black gap. */}
      <style>{`
        #opsroom-root > div {
          width: 100% !important;
          height: 100% !important;
          background: transparent !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }
        #opsroom-root canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
      `}</style>
    </DashboardLayout>
  );
}

/**
 * The Ops Room renders three independently positioned panels (AI Agents,
 * Dashboard, Leaderboard). The bundle does not expose a carousel API, so the
 * external nav finds the panel shells by their text content and moves them
 * into left/center/right visual slots. This is more reliable than depending on
 * the bundle's hard-coded inline `left` / `right` values.
 */
type SlotKey = "left" | "center" | "right";

function findPanels(): Record<SlotKey, HTMLElement | null> {
  const root = document.getElementById("opsroom-root");
  if (!root) return { left: null, center: null, right: null };
  const panelShells = Array.from(root.querySelectorAll<HTMLElement>("div"))
    .filter((el) => {
      const style = el.getAttribute("style") || "";
      const box = el.getBoundingClientRect();
      return (
        /position:\s*absolute/.test(style) &&
        /pointer-events:\s*auto/.test(style) &&
        /aspect-ratio|width:\s*clamp/.test(style) &&
        box.width > 280 &&
        box.height > 160
      );
    })
    .sort((a, b) => {
      const aBox = a.getBoundingClientRect();
      const bBox = b.getBoundingClientRect();
      return bBox.width * bBox.height - aBox.width * aBox.height;
    });

  const byText = (pattern: RegExp) =>
    panelShells.find((el) => pattern.test(el.textContent ?? "")) ?? null;

  return {
    left: byText(/AI\s*Agents/i),
    center: byText(/\bDashboard\b/i),
    right: byText(/Creator\s*Leaderboard|Agency\s*cut|Addison\s*Weems/i),
  };
}

let activeSlot: SlotKey = "center";
const slotListeners = new Set<(s: SlotKey) => void>();
let reapplyTimer: number | null = null;

function applySlotStyles(target: SlotKey) {
  const panels = findPanels();
  if (!panels.left || !panels.center || !panels.right) return;

  const order: SlotKey[] = ["left", "center", "right"];
  const visualSlotFor = (panel: SlotKey): SlotKey => {
    const relative = (order.indexOf(panel) - order.indexOf(target) + order.length) % order.length;
    return relative === 0 ? "center" : relative === 1 ? "right" : "left";
  };

  const place = (el: HTMLElement, slot: SlotKey) => {
    el.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1), left 420ms, right 420ms, top 420ms, width 420ms";
    el.style.bottom = "auto";
    el.style.pointerEvents = "auto";

    if (slot === "center") {
      el.style.zIndex = "24";
      el.style.left = "50%";
      el.style.right = "auto";
      el.style.top = "50%";
      el.style.setProperty("width", "clamp(520px, 40vw, 780px)", "important");
      el.style.setProperty("transform", "translate(-50%, -50%)", "important");
    } else {
      el.style.zIndex = "12";
      el.style.left = slot === "left" ? "1.5%" : "auto";
      el.style.right = slot === "right" ? "1.5%" : "auto";
      el.style.top = "53%";
      el.style.setProperty("width", "clamp(360px, 32vw, 680px)", "important");
      el.style.setProperty("transform", "translateY(-50%)", "important");
    }

    const inner = el.firstElementChild as HTMLElement | null;
    if (inner) {
      inner.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1)";
      const tilt = slot === "left" ? 22 : slot === "right" ? -22 : 0;
      inner.style.setProperty("transform", `rotateY(${tilt}deg)`, "important");
    }
  };

  order.forEach((panel) => {
    place(panels[panel]!, visualSlotFor(panel));
  });
}

function focusSlot(target: SlotKey) {
  activeSlot = target;
  slotListeners.forEach((fn) => fn(target));
  applySlotStyles(target);
  // Re-apply for ~2s in case the bundle re-renders panels and clobbers our inline styles.
  if (reapplyTimer) window.clearInterval(reapplyTimer);
  let ticks = 0;
  reapplyTimer = window.setInterval(() => {
    applySlotStyles(activeSlot);
    if (++ticks > 20) {
      window.clearInterval(reapplyTimer!);
      reapplyTimer = null;
    }
  }, 100);
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
  const [current, setCurrent] = useState<SlotKey>(activeSlot);
  useEffect(() => {
    const fn = (s: SlotKey) => setCurrent(s);
    slotListeners.add(fn);
    return () => {
      slotListeners.delete(fn);
    };
  }, []);
  return (
    <div
      className="pointer-events-none fixed bottom-6 z-[60] flex items-center justify-center gap-2"
      style={{ left: "var(--sidebar-width, 16rem)", right: 0 }}
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
            className={cn(
              "px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded-full transition",
              current === slot
                ? "bg-white/15 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10",
            )}
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
