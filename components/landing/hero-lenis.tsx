"use client";

import { useId, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Anton } from "next/font/google";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Images, Sparkles } from "lucide-react";
import { copy } from "@/lib/copy";
import { formatInt } from "@/lib/format";
import { cn, fmt } from "@/lib/utils";

/** ฟอนต์ display สำหรับ wordmark (ละตินเท่านั้น — ข้อความไทยยังใช้ Noto Sans Thai) */
const display = Anton({ subsets: ["latin"], weight: "400", display: "swap" });
const h = copy.landing.hero;

function HeroCta({ href, icon, label, variant }: { href: string; icon: React.ReactNode; label: string; variant: "primary" | "ghost" }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-14 min-w-0 items-center gap-2 rounded-2xl p-1 pr-4 text-sm font-semibold transition-[background-color] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4f8dff] sm:w-60 lg:w-52 xl:w-60",
        variant === "primary" ? "bg-[#2f78f5] text-white shadow-[0_20px_50px_-20px_rgb(47_120_245/0.9)] hover:bg-[#4f8dff]" : "bg-white/[0.06] text-white ring-1 ring-white/15 hover:bg-white/[0.12]",
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:-rotate-8", variant === "primary" ? "bg-[#04060d] text-[#7fb0ff]" : "bg-white text-[#04060d]")}>{icon}</span>
      <span className="flex-1 truncate text-center">{label}</span>
      <ArrowUpRight className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
    </Link>
  );
}

/** Hero เต็มจอโทนมืดแนว lenis.dev: wordmark ใหญ่เต็มกว้าง (เติมด้วยภาพสกิน) + tagline ชิดขวา + แถวล่างปุ่มใหญ่ — เลื่อนแล้ว wordmark ยุบ/จาง */
export function HeroLenis({ totalSkins, previewSkins }: { totalSkins: number; previewSkins: { id: string; image: string }[] }) {
  const patternId = useId().replace(/:/g, "");
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const wordY = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const wordScale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);
  const wordOpacity = useTransform(() => reduce ? 1 : 1 - Math.min(scrollYProgress.get() / 0.8, 1) * 0.85);
  const tagX = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.4]);

  return (
    <section id="hero" ref={ref} aria-label={fmt(h.aria, { brand: copy.brand.name })} className="relative isolate flex min-h-[520px] flex-col overflow-hidden bg-[#04060d] text-white sm:min-h-[560px] lg:min-h-[max(580px,min(720px,calc(100svh-6rem)))]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image src="/images/hero-arena-background-v1.webp" alt="" fill priority sizes="100vw" className="object-cover object-[20%_center] sm:object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,13,0.45)_0%,rgba(4,6,13,0.12)_45%,rgba(4,6,13,0.7)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,6,13,0.05),rgba(4,6,13,0.4))]" />
      </div>
      <m.div aria-hidden style={{ scale: reduce ? 1 : glowScale }} className="pointer-events-none absolute inset-x-[-20%] bottom-[-45%] -z-10 h-[90%] rounded-[100%] bg-[radial-gradient(closest-side,rgba(47,120,245,0.45),rgba(47,120,245,0.12)_55%,transparent)]" />

      <div className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col px-5 pt-6 pb-6 sm:px-8 sm:pt-7 lg:pb-8">
        <div className="enter flex items-center justify-between gap-4 font-mono text-[10px] tracking-[0.2em] text-white/55 sm:text-[11px]">
          <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[#4f8dff] shadow-[0_0_12px_#4f8dff]" />{h.kicker}</span>
          <span className="hidden tabular-nums sm:inline">{fmt(h.edition, { n: formatInt(totalSkins) })}</span>
        </div>

        <m.h1 style={{ y: reduce ? "0%" : wordY, scale: reduce ? 1 : wordScale, opacity: wordOpacity }} className="mt-6 origin-top sm:mt-8">
          <span className="sr-only">{copy.brand.name} — {h.tagline}{h.taglineLine2}</span>
          <svg aria-hidden viewBox="0 0 1440 330" className={cn(display.className, "block h-auto w-full overflow-visible select-none")}>
            <defs>
              <pattern id={patternId} patternUnits="userSpaceOnUse" width="1440" height="330">
                <image href="/images/hero-cover-create-v1.webp" x="-1100" y="-350" width="3000" height="1500" className="hero-wordmark-image" />
              </pattern>
            </defs>
            <text x="0" y="315" fontSize="400" textLength="1440" lengthAdjust="spacingAndGlyphs" fill={`url(#${patternId})`}>{copy.brand.name.toUpperCase()}</text>
          </svg>
        </m.h1>

        <div className="mt-6 flex items-center justify-between gap-6 sm:mt-7">
          <div aria-hidden className="hidden items-center pl-2 sm:flex">
            {previewSkins.map((skin, i) => (
              <div key={skin.id} style={{ transform: `rotate(${[-10, -3, 5, 12][i]}deg)` }} className="relative -ml-2 h-20 w-14 overflow-hidden rounded-lg border border-white/25 bg-[#102040] shadow-xl lg:h-24 lg:w-16">
                <Image src={skin.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
            ))}
          </div>
          <m.p aria-hidden style={{ x: reduce ? "0%" : tagX }} className="ml-auto text-right text-[clamp(1.75rem,4.6vw,4rem)] leading-[1.15] font-bold tracking-tight">
            {h.tagline}<br /><span className="text-[#7fb0ff]">{h.taglineLine2}</span>
          </m.p>
        </div>

        <div className="mt-auto grid gap-5 pt-8 sm:grid-cols-[auto_1fr] sm:items-end lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6">
          <div className="hidden items-center gap-3 sm:flex">
            <span aria-hidden className="relative h-11 w-px overflow-hidden bg-white/20"><span className="hero-scroll-line absolute inset-x-0 top-0 h-1/2 bg-[#4f8dff]" /></span>
            <p className={cn(display.className, "text-xl leading-[1.05] tracking-wide text-white/90 uppercase")}>{h.scroll}<br />{h.scrollLine2}</p>
          </div>
          <p className="text-sm leading-6 text-white/65 sm:max-w-sm">{h.byline}<br className="hidden sm:block" /> {h.bylineLine2}</p>
          <div id="hero-actions" className="flex flex-col gap-3 sm:col-span-2 sm:flex-row lg:col-span-1">
            <HeroCta href="/generate/mlbb" variant="primary" icon={<Sparkles className="size-5" aria-hidden />} label={h.ctaPrimary} />
            <HeroCta href="/assets/mlbb" variant="ghost" icon={<Images className="size-5" aria-hidden />} label={h.ctaSecondary} />
          </div>
        </div>
      </div>
    </section>
  );
}
