import { useCallback, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgency } from "@/hooks/useAgency";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
const BUNDLE_SRC = "/ops-room/bundle.js";
const BUNDLE_SCRIPT_SELECTOR = 'script[data-opsroom="1"]';

function injectOpsRoomBundle(force = false) {
  const existing = document.querySelector<HTMLScriptElement>(BUNDLE_SCRIPT_SELECTOR);
  if (existing && !force) return;
  existing?.remove();

  const script = document.createElement("script");
  script.type = "module";
  script.src = force ? `${BUNDLE_SRC}?remount=${Date.now()}` : BUNDLE_SRC;
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
          height: "calc(100dvh - 1rem)",
          maxWidth: "100%",
          overflow: "hidden",
          backgroundColor: "#08040c",
          backgroundImage: "url('/ops-room/background.jpg')",
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
