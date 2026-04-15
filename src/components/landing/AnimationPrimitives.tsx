import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from "framer-motion";
import { ReactNode } from "react";

// Floating particles background
export function FloatingParticles({ count = 30 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() > 0.5 ? 15 : -15, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient divider between sections
export function GradientDivider() {
  return (
    <div className="relative h-px w-full overflow-hidden">
      <motion.div
        className="absolute inset-0 h-full"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(330 100% 64% / 0.5), hsl(280 80% 60% / 0.3), transparent)",
        }}
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="absolute inset-0 h-full bg-border" />
    </div>
  );
}

// Animated counting number
export function AnimatedCounter({ value, suffix = "", prefix = "", duration = 2 }: { value: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplay(Math.round(latest).toLocaleString());
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  );
}

// Infinite marquee for trust/social proof
export function Marquee({ children, speed = 30, direction = "left" }: { children: ReactNode; speed?: number; direction?: "left" | "right" }) {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="inline-flex gap-8"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

// Magnetic hover effect wrapper
export function MagneticHover({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}

// Text reveal animation (word by word)
export function TextReveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: delay + i * 0.04, duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Glowing orb that follows scroll
export function ScrollGlowOrb({ color = "hsl(330 100% 64% / 0.08)" }: { color?: string }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], ["20%", "60%", "30%"]);

  return (
    <motion.div
      className="fixed top-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
      style={{
        y,
        x,
        background: `radial-gradient(ellipse, ${color}, transparent 70%)`,
        filter: "blur(120px)",
      }}
    />
  );
}