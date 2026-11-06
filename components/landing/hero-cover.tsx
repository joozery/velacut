"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameIcon } from "@/components/shared/game-icon";
import { copy } from "@/lib/copy";
import { GAMES } from "@/lib/games";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";

const DURATION = 6500;

const slides = [
  {
    image: "/images/hero-cover-create-v1.webp",
    tab: "สร้างป้าย",
    eyebrow: "GAME ACCOUNT POSTER",
    title: "ไอดีของคุณ",
    highlight: "โดดเด่นได้อีก",
    description: "เลือกสกิน จัดเรียง และสร้างป้ายขายไอดีในสไตล์คุณ ครบในที่เดียว",
    cta: "เริ่มสร้างป้ายฟรี",
    href: "/generate/mlbb",
    points: ["เลือกสกินจากคลังจริง", "ลากจัดเรียงได้อิสระ", "ดาวน์โหลดพร้อมโพสต์"],
  },
  {
    image: "/images/hero-cover-library-v1.webp",
    tab: "คลังภาพ",
    eyebrow: "ASSET LIBRARY",
    title: "สกินที่ชอบ",
    highlight: "พร้อมให้สร้างสรรค์",
    description: "ดาวน์โหลดภาพสกิน MLBB ฟรี แล้วเริ่มสร้างป้ายในแบบของคุณ",
    cta: "เปิดคลังภาพฟรี",
    href: "/assets/mlbb",
    points: ["ภาพสกินคมชัด", "ค้นหาตามฮีโร่", "อัปเดตสม่ำเสมอ"],
  },
] as const;

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotionPreference(listener: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const reducedMotionSnapshot = () => window.matchMedia(motionQuery).matches;
const serverMotionSnapshot = () => true;

/** hero แบบแบนเนอร์เต็มความกว้าง: ภาพพื้นหลังเต็มจอ + ข้อความซ้าย + แถบสไลด์พร้อมเวลา */
export function HeroCover({ totalSkins }: { totalSkins: number }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useSyncExternalStore(subscribeToMotionPreference, reducedMotionSnapshot, serverMotionSnapshot);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const autoplay = !paused && !reduceMotion;
  const slide = slides[active];

  const go = (index: number) => setActive((index + slides.length) % slides.length);
  const select = (index: number) => {
    go(index);
    setPaused(true);
  };

  return (
    <section
      aria-label={`สร้างป้ายและคลังภาพ ${copy.brand.name}`}
      aria-roledescription="carousel"
      className="relative isolate overflow-hidden bg-[#eef4ff] text-[#111b35]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setPaused(true)}
      onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) select(active + (dx < 0 ? 1 : -1));
      }}
    >
      {/* ภาพพื้นหลังเต็มแบนเนอร์ */}
      {slides.map((item, index) => (
        <div
          key={item.image}
          aria-hidden
          className={cn("pointer-events-none absolute inset-x-0 top-[42%] bottom-0 -z-20 transition-opacity sm:top-0 duration-1000 motion-reduce:transition-none", index === active ? "opacity-100" : "opacity-0")}
        >
          <Image
            key={index === active ? `on-${active}` : "off"}
            src={item.image}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className={cn("object-cover object-[78%_top] sm:object-[70%_center] lg:object-right", index === active && "hero-zoom")}
          />
        </div>
      ))}
      {/* ไล่สีให้ข้อความอ่านง่าย: มือถือไล่บน→ล่าง, จอใหญ่ไล่ซ้าย→ขวา */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#eef4ff_0%,#eef4ff_40%,rgba(238,244,255,0)_56%)] sm:bg-[linear-gradient(to_bottom,rgba(244,248,255,0.97)_0%,rgba(244,248,255,0.9)_40%,rgba(244,248,255,0.1)_65%,rgba(244,248,255,0)_100%)] md:bg-[linear-gradient(to_right,rgba(244,248,255,1)_0%,rgba(244,248,255,0.92)_32%,rgba(244,248,255,0.35)_55%,rgba(244,248,255,0)_75%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#eef4ff] to-transparent" />

      <div className="mx-auto flex min-h-[540px] max-w-7xl flex-col px-5 sm:min-h-[440px] sm:px-8 lg:h-[clamp(440px,calc(100svh-12rem),520px)] lg:px-10">
        {/* ข้อความ */}
        <div className="flex flex-1 items-start pt-8 sm:items-center sm:pt-6">
          <div
            key={active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${active + 1} จาก ${slides.length}`}
            aria-live={paused ? "polite" : "off"}
            className="enter max-w-[34rem]"
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-[#1463e8]/20 bg-white/70 py-1 pr-3 pl-1 text-[10px] font-semibold tracking-[0.14em] text-[#1463e8] backdrop-blur sm:text-[11px]">
              <span className="rounded-full bg-[#1463e8] px-2 py-0.5 tracking-normal text-white">{copy.brand.name}</span>
              {slide.eyebrow}
            </p>
            <h1 className="mt-4 text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.08] font-bold tracking-tight">
              {slide.title}
              <br />
              <span className="bg-gradient-to-r from-[#1463e8] to-[#4f8dff] bg-clip-text text-transparent">{slide.highlight}</span>
            </h1>
            <p className="mt-4 max-w-[19rem] text-sm sm:max-w-[26rem] leading-7 text-[#4a5670] sm:text-base sm:leading-8">{slide.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild className="h-12 rounded-xl bg-[#1463e8] px-6 text-sm text-white shadow-[0_10px_30px_-10px_rgb(20_99_232/0.7)] hover:bg-[#0d52c7] sm:text-base">
                <Link href={slide.href}>
                  {slide.cta}
                  <ArrowUpRight aria-hidden />
                </Link>
              </Button>
              <Link
                href="#showcase"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#d4def0] bg-white/70 px-5 text-sm font-medium text-[#25334d] backdrop-blur transition-colors hover:border-[#1463e8]/40 hover:text-[#1463e8]"
              >
                ดูตัวอย่างป้าย
                <ArrowDown className="size-4" aria-hidden />
              </Link>
            </div>

            <ul className="mt-5 hidden flex-wrap gap-x-5 gap-y-2 text-xs text-[#4a5670] sm:flex">
              {slide.points.map((p) => (
                <li key={p} className="flex items-center gap-1.5">
                  <span className="grid size-4 place-items-center rounded-full bg-[#1463e8]/12 text-[#1463e8]">
                    <Check className="size-3" aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* แถบล่าง: เกม + ตัวควบคุมสไลด์ */}
        <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div id="games" className="flex scroll-mt-24 flex-wrap items-center gap-2">
            {GAMES.map((game) => (
              <Link
                key={game.slug}
                href={`/generate/${game.slug}`}
                className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/80 py-1.5 pr-3 pl-1.5 shadow-[0_8px_24px_-12px_rgb(17_27_53/0.35)] backdrop-blur transition-colors hover:border-[#1463e8]/40"
              >
                <GameIcon game={game} className="size-9 rounded-xl" />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold">{game.shortName}</span>
                  <span className="block text-[10px] text-[#576178] tabular-nums">{formatInt(totalSkins)} สกินพร้อมเลือก</span>
                </span>
                <ArrowUpRight className="size-4 text-[#8a95a8] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1463e8]" aria-hidden />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/75 py-1 pr-1 pl-4 shadow-[0_8px_24px_-12px_rgb(17_27_53/0.35)] backdrop-blur">
            <div className="flex flex-1 gap-3 sm:flex-none" aria-label="เลือกสไลด์">
              {slides.map((item, index) => (
                <button
                  key={item.image}
                  type="button"
                  aria-label={`แสดงสไลด์ ${index + 1}: ${item.tab}`}
                  aria-pressed={index === active}
                  onClick={() => select(index)}
                  className="group flex min-w-0 flex-1 flex-col gap-1.5 py-2 text-left sm:w-28 sm:flex-none"
                >
                  <span className={cn("truncate font-mono text-[10px] tabular-nums transition-colors", index === active ? "text-[#1463e8]" : "text-[#8a95a8] group-hover:text-[#25334d]")}>
                    0{index + 1}
                    <span className="ml-1.5 font-sans font-medium">{item.tab}</span>
                  </span>
                  <span className="relative block h-1 overflow-hidden rounded-full bg-[#1463e8]/15">
                    {index === active &&
                      (autoplay ? (
                        <span
                          key={`p-${active}`}
                          className="hero-progress absolute inset-0 rounded-full bg-[#1463e8]"
                          style={{ ["--hero-duration" as string]: `${DURATION}ms`, animationPlayState: hovered ? "paused" : "running" }}
                          onAnimationEnd={() => !document.hidden && go(active + 1)}
                        />
                      ) : (
                        <span className="absolute inset-0 rounded-full bg-[#1463e8]" />
                      ))}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {!reduceMotion && (
                <button
                  type="button"
                  aria-label={paused ? "เล่นสไลด์อัตโนมัติ" : "หยุดสไลด์อัตโนมัติ"}
                  onClick={() => setPaused((v) => !v)}
                  className="hidden size-10 place-items-center rounded-full text-[#576178] transition-colors hover:bg-white sm:grid"
                >
                  {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
                </button>
              )}
              <button type="button" aria-label="สไลด์ก่อนหน้า" onClick={() => select(active - 1)} className="grid size-10 place-items-center rounded-full border border-[#d7dfed] bg-white text-[#25334d] transition-colors hover:border-[#1463e8]/40 hover:text-[#1463e8]">
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button type="button" aria-label="สไลด์ถัดไป" onClick={() => select(active + 1)} className="grid size-10 place-items-center rounded-full border border-[#d7dfed] bg-white text-[#25334d] transition-colors hover:border-[#1463e8]/40 hover:text-[#1463e8]">
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
