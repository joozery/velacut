"use client";

/**
 * Motion primitives (framer-motion) — ใช้ได้จาก server component โดยห่อ children
 * - ใช้ LazyMotion + `m` เพื่อลดขนาด bundle
 * - เคารพ prefers-reduced-motion ผ่าน MotionConfig reducedMotion="user"
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import { LazyMotion, MotionConfig, domAnimation, m, type Variants } from "framer-motion";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease: EASE_OUT }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

type Tag = "div" | "section" | "ul" | "ol" | "li" | "dl" | "p" | "span";

const viewport = { once: true, margin: "0px 0px -80px 0px" } as const;

/** ค่อยๆ เลื่อนขึ้นมาเมื่อเลื่อนถึง */
export function Reveal({
  as = "div",
  children,
  className,
  delay = 0,
  y = 24,
  scale,
}: {
  as?: Tag;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
}) {
  const C = m[as];
  return (
    <C
      className={className}
      initial={{ opacity: 0, y, scale: scale ?? 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={viewport}
      transition={{ duration: 0.6, ease: EASE_OUT, delay }}
    >
      {children}
    </C>
  );
}

const staggerParent = (gap: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

/** container ที่ให้ลูก (StaggerItem) โผล่ทีละตัว */
export function Stagger({
  as = "div",
  children,
  className,
  gap = 0.08,
  delay = 0,
  onMount,
  "aria-label": ariaLabel,
}: {
  as?: Tag;
  children: React.ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  /** true = เล่นทันทีตอนโหลด (ใช้กับ hero) แทนการรอเลื่อนถึง */
  onMount?: boolean;
  "aria-label"?: string;
}) {
  const C = m[as];
  const trigger = onMount ? { animate: "show" } : { whileInView: "show", viewport };
  return (
    <C className={className} aria-label={ariaLabel} initial="hidden" variants={staggerParent(gap, delay)} {...trigger}>
      {children}
    </C>
  );
}

export function StaggerItem({ as = "div", children, className }: { as?: Tag; children: React.ReactNode; className?: string }) {
  const C = m[as];
  return (
    <C className={className} variants={fadeUpItem}>
      {children}
    </C>
  );
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const thNumber = new Intl.NumberFormat("th-TH");
const format = (n: number) => thNumber.format(Math.round(n));

/** ตัวเลขนับขึ้นเมื่อเลื่อนถึง (HTML จาก server มีค่าจริงเสมอ เพื่อ SEO / ไม่มี JS) */
export function CountUp({ value, className, duration = 1.4 }: { value: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
    let raf = 0;
    el.textContent = format(0);

    const run = () => {
      // ใช้เวลาของเฟรมแรกเป็นจุดเริ่ม (timestamp ของ rAF อาจน้อยกว่า performance.now() ได้ → ค่าติดลบ)
      let start: number | undefined;
      const tick = (now: number) => {
        start ??= now;
        const t = Math.min(1, Math.max(0, (now - start) / (duration * 1000)));
        el.textContent = format(value * easeOut(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = format(value);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

/** ลอยขึ้นลงช้าๆ (ใช้กับภาพตัวอย่าง) */
export function Float({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div
      className={className}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </m.div>
  );
}
