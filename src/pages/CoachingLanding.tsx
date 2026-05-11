import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Clock,
  Users,
  CheckCircle2,
  Star,
  Quote,
  Lock,
  Zap,
  Target,
  TrendingUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import bunnyWorksLogo from "@/assets/bunnyworks-logo.png";

const FRAMEWORK_VIDEO_URL =
  "https://bmore2112.github.io/Coaching-Landing-Page/assets/framework-video.mp4";
const TESTI_VIDEO_URL =
  "https://bmore2112.github.io/Coaching-Landing-Page/assets/testi-agency-result.mp4";

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function VSLPlayer({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => {
      setTime(v.currentTime);
      setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    };
    const onLoaded = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  const togglePlay = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  };

  const toggleMute = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      <video
        ref={ref}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onClick={togglePlay}
        className="absolute inset-0 w-full h-full object-cover cursor-pointer"
      />
      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div
          onClick={seek}
          className="relative h-1.5 rounded-full bg-white/15 cursor-pointer group/bar mb-2.5"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary shadow-glow opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-3 text-white">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <span className="text-[11px] font-mono tabular-nums text-white/80">
            {formatTime(time)} / {formatTime(duration)}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

const stats = [
  { value: "24+", label: "Verified reviews" },
  { value: "5.0", label: "Average rating" },
  { value: "100%", label: "Recommend booking" },
  { value: "7-Fig", label: "Operator results" },
];

const pillars = [
  {
    icon: Target,
    title: "Niche & Positioning",
    body: "Lock in the exact creator persona, offer ladder, and content angles that actually convert in 2026.",
  },
  {
    icon: TrendingUp,
    title: "Traffic Engine",
    body: "Instagram, Reddit and outbound DM systems that compound — built around what's working right now.",
  },
  {
    icon: Zap,
    title: "Chat & Monetization",
    body: "PPV cadence, sales scripts and chatter SOPs that take models past the $70K plateau.",
  },
  {
    icon: ShieldCheck,
    title: "Operational Backbone",
    body: "Roles, KPIs, payroll and compliance — the boring stuff that turns hustle into a real agency.",
  },
];

const testimonials = [
  {
    initials: "RK",
    name: "Riley Kirchoff",
    tag: "Strategy Call",
    quote:
      "Just hopped off the call — absolutely epic. We went deep on content, came up with a game plan with examples, and locked in the best strategy for my model. 10,000% worth it. He overdelivered like the killer he is.",
  },
  {
    initials: "D",
    name: "Daffy",
    tag: "Coaching",
    quote:
      "I'm not usually a guy who vouches, but PBF is a 10/10 and more than just a coach. He took me from making hundreds to thousands. A genuine goat who knows what he's doing.",
  },
  {
    initials: "I",
    name: "ING",
    tag: "Results",
    quote:
      "Was struggling to break the 70k barrier. Booked a call, threw ideas around, took them on board. The results speak for themselves.",
  },
  {
    initials: "Z",
    name: "Z.",
    tag: "Agency Owner",
    quote:
      "Multiple 7-figure revenue chatting agency turned OFM recently. Learning from the best here. Fast, helpful, and would 100% recommend booking.",
  },
  {
    initials: "VA",
    name: "Vancity Agency",
    tag: "Agency Strategy",
    quote:
      "Hooked up invaluable information and resources. After the model review he suggested great niche and content ideas. The insights only come with experience.",
  },
  {
    initials: "F",
    name: "Francis",
    tag: "Instagram Strategy",
    quote:
      "Ridiculously valuable. Almost every single thing we touched on was information I'd consider critical to know. And we are not beginners.",
  },
  {
    initials: "GP",
    name: "Grecia",
    tag: "Strategy Call",
    quote:
      "He's a really good strategist, always updated on what's new. If you can't see the horizon — call him. Thank you PBF.",
  },
  {
    initials: "OJ",
    name: "Orfeas J.M.",
    tag: "Industry Insights",
    quote:
      "Shared extremely valuable info on IG and other parts of the industry. Gave me a much better vision on how to move and what to implement.",
  },
  {
    initials: "CK",
    name: "Cuddly Models",
    tag: "Model Growth",
    quote:
      "Literally answered all my problems and gave me great ideas to boost my models. Didn't even notice the hour was already up.",
  },
];

const steps = [
  {
    n: "01",
    title: "Apply",
    body: "5-minute application reviewed personally. No automation, no spam.",
  },
  {
    n: "02",
    title: "Strategy Call",
    body: "Deep audit of your creator, traffic, chat and ops. You leave with a plan.",
  },
  {
    n: "03",
    title: "Build & Scale",
    body: "Implement the framework with direct support until the numbers move.",
  },
];

export default function CoachingLanding() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 500px at 50% -10%, hsl(330 100% 64% / 0.18), transparent 60%), radial-gradient(700px 400px at 90% 20%, hsl(280 80% 60% / 0.12), transparent 60%), hsl(0 0% 3%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(330 100% 64% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(330 100% 64% / 0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl transition-colors ${
          scrolled ? "bg-background/80 border-b border-border" : "bg-background/40"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={bunnyWorksLogo} alt="BunnyWorks" className="h-7 sm:h-8 w-auto" />
            <span className="text-sm sm:text-base font-bold tracking-tight">
              BunnyWorks <span className="text-primary">PBF Coaching</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#framework" className="hover:text-foreground transition-colors">Framework</a>
            <a href="#results" className="hover:text-foreground transition-colors">Results</a>
            <a href="#reviews" className="hover:text-foreground transition-colors">Reviews</a>
            <a href="#apply" className="hover:text-foreground transition-colors">Apply</a>
          </div>
          <a href="#apply">
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 px-4 sm:px-5 shadow-glow-sm">
              Apply Now <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-widest">
              Now Accepting Applications
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[0.95]"
          >
            You're one step away from{" "}
            <span className="gradient-text italic">changing everything</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            The PBF coaching framework — built inside BunnyWorks — for OFM agency owners
            ready to stop guessing and start scaling. Watch the breakdown, then apply in under 5 minutes.
          </motion.p>

          {/* Video frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 sm:mt-14 relative mx-auto max-w-3xl"
          >
            <div className="absolute -inset-4 sm:-inset-6 rounded-3xl bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-2xl" />
            <div className="relative aspect-video rounded-2xl border border-primary/30 bg-card overflow-hidden shadow-glow">
              <VSLPlayer src={FRAMEWORK_VIDEO_URL} />
              {/* corner brackets */}
              {[
                "top-3 left-3 border-t-2 border-l-2",
                "top-3 right-3 border-t-2 border-r-2",
                "bottom-3 left-3 border-b-2 border-l-2",
                "bottom-3 right-3 border-b-2 border-r-2",
              ].map((c) => (
                <div key={c} className={`absolute h-5 w-5 border-primary/60 pointer-events-none z-10 ${c}`} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <a href="#apply">
              <Button
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 px-8 py-6 text-sm sm:text-base font-semibold shadow-glow group"
              >
                Apply Now
                <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Private & Confidential</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Watch at your own pace</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Limited spots available</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {stats.map((s) => (
            <div key={s.label} className="bg-card/60 backdrop-blur p-6 sm:p-8 text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
              <div className="mt-1.5 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Framework / pillars */}
      <section id="framework" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-primary font-medium">The Framework</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
              Four pillars. <span className="gradient-text">One operating system.</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
              The same playbook that took operators from chaotic 5-figure months to predictable
              7-figure agencies — distilled, sequenced, and coached 1-on-1.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative rounded-2xl border border-border bg-card/50 backdrop-blur p-6 hover:border-primary/40 hover:bg-card transition-all"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-5">
                    <p.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Real results highlight cards */}
      <section id="results" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-widest text-primary font-medium">Real Results</span>
              <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
                Hear it from <span className="gradient-text italic">inside the program</span>
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base">
              What creators and agency owners are saying after going through the framework.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { tag: "Agency owner result", title: "0 → consistent 6-fig months", body: "From zero to predictable monthly revenue using the framework.", video: TESTI_VIDEO_URL },
              { tag: "Client experience", title: "What it actually felt like", body: "Inside the coaching process — calls, plans, and direct support.", video: null as string | null },
              { tag: "Operator feedback", title: "Solo → full team agency", body: "Scaling from a one-person setup to a team-operated machine.", video: null as string | null },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative rounded-2xl border border-border bg-card/60 backdrop-blur overflow-hidden group"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  {c.video ? (
                    <VSLPlayer src={c.video} />
                  ) : (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 3%)), radial-gradient(circle at 50% 50%, hsl(330 100% 64% / 0.2), transparent 60%)",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/15 backdrop-blur border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <PlayCircle className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                    </>
                  )}
                  <span className="absolute top-4 left-4 text-[10px] font-mono text-primary/80 z-10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="p-6">
                  <span className="text-[10px] uppercase tracking-widest text-primary">{c.tag}</span>
                  <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-primary font-medium">How it works</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
              Three steps to the <span className="gradient-text">other side</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-border bg-card/50 p-7 hover:border-primary/40 transition-colors"
              >
                <div className="text-5xl font-bold text-primary/20 font-mono">{s.n}</div>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 h-5 w-5 text-primary/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <span className="text-xs uppercase tracking-widest text-primary font-medium">Results & Reviews</span>
              <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
                What people are <span className="gradient-text">saying</span>
              </h2>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="font-bold text-lg">24+</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Verified</div>
              </div>
              <div>
                <div className="font-bold text-lg flex items-center gap-1">
                  5.0 <Star className="h-4 w-4 fill-primary text-primary" />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Rating</div>
              </div>
              <div>
                <div className="font-bold text-lg">100%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Recommend</div>
              </div>
            </div>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-5 [column-fill:_balance]">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 6) * 0.04 }}
                className="mb-5 break-inside-avoid rounded-2xl border border-border bg-card/60 backdrop-blur p-6 hover:border-primary/40 transition-colors"
              >
                <Quote className="h-5 w-5 text-primary/50 mb-3" />
                <p className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3 pt-4 border-t border-border">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground uppercase tracking-widest">{t.tag}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section id="apply" className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl border border-primary/30 overflow-hidden p-8 sm:p-14 text-center">
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(600px 300px at 50% 0%, hsl(330 100% 64% / 0.25), transparent 70%), linear-gradient(180deg, hsl(0 0% 6%), hsl(0 0% 3%))",
              }}
            />
            <span className="text-xs uppercase tracking-widest text-primary font-medium">Apply Now</span>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">
              Start your agency <span className="gradient-text italic">application</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              5 minutes. Reviewed personally. Response within 48 hours if you're the right fit.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="rounded-full bg-primary hover:bg-primary/90 px-10 py-6 text-base font-semibold shadow-glow group"
                >
                  Begin application
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Reviewed personally</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Response within 48 hrs</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> No spam, ever</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-10 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={bunnyWorksLogo} alt="BunnyWorks" className="h-6 w-auto" />
            <span className="text-sm font-semibold">BunnyWorks · PBF Coaching</span>
          </div>
          <div className="text-xs text-muted-foreground">
            © 2026 BunnyWorksOS. All applications reviewed personally.
          </div>
        </div>
      </footer>
    </div>
  );
}
