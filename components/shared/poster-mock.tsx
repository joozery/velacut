import Image from "next/image";
import { Trophy } from "lucide-react";
import { SkinThumb } from "./skin-thumb";
import { copy } from "@/lib/copy";
import { formatInt } from "@/lib/format";
import { featuredSkins } from "@/lib/catalog";
import { SAMPLE_LISTING } from "@/lib/mock";
import { cn } from "@/lib/utils";

const s = copy.landing.showcase.sample;
const hi = "text-sky-300";

/**
 * ตำแหน่ง (ร้อยละของความสูงป้าย) ของแต่ละส่วนบนป้ายแบบเต็ม
 * — ใช้วาง callout ใน Showcase ให้เส้นชี้ตรงจุด (ป้ายมีอัตราส่วนคงที่ 416:460)
 */
export const POSTER_SPOTS = { details: 11, hero: 22, rank: 38, price: 44, skins: 77 } as const;

/** ป้ายตัวอย่างที่ตกแต่งแล้ว (ข้อมูลไอดี + ราคา + ตัวละคร + แรงค์ + กริดสกิน) */
export function PosterMock({ className, compact, label }: { className?: string; compact?: boolean; label?: string }) {
  const L = SAMPLE_LISTING;

  if (compact) {
    const skins = featuredSkins("rov", 8, 4);
    return (
      <div role="img" aria-label={label} className={cn("relative overflow-hidden rounded-2xl bg-zinc-950 text-white", className)}>
        <div aria-hidden className="absolute -top-8 -right-8 size-40 rounded-full bg-gradient-to-br from-primary to-fuchsia-500 opacity-60 blur-2xl" />
        <div aria-hidden className="relative flex flex-col gap-0.5 p-4">
          <p className="text-[11px] font-bold">
            {s.code} <span className={hi}>{L.no}</span>
          </p>
          <p className="text-lg leading-tight font-bold">
            {s.heroes} <span className={hi}>{L.heroes}</span> {s.skins} <span className={hi}>{L.skins}</span>
          </p>
          <p className="mt-3 text-3xl font-bold">
            <span className={hi}>{formatInt(L.price)}</span> <span className="text-base text-white/80">{s.baht}</span>
          </p>
        </div>
        <div aria-hidden className="relative grid grid-cols-8 gap-0.5 bg-black/40 p-0.5">
          {skins.map((x, i) => (
            <SkinThumb key={x.id} skin={x} index={i + 1} compact hideTier size="xs" className="rounded-md" sizes="48px" />
          ))}
        </div>
      </div>
    );
  }

  const skins = featuredSkins("rov", 24, 2);
  const cover = featuredSkins("rov", 1, 7)[0] ?? skins[0];

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("@container relative isolate flex aspect-[416/460] flex-col overflow-hidden rounded-xl bg-zinc-950 text-white shadow-soft-lg", className)}
    >
      {/* ส่วนหัว: ภาพตัวละคร + ข้อมูลไอดี + ราคา + แรงค์ */}
      <div aria-hidden className="relative min-h-0 flex-1">
        {cover && (
          <Image src={cover.image} alt="" fill sizes="420px" unoptimized className="-z-20 object-cover object-[70%_30%]" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/75 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40" />

        <div className="flex h-full flex-col justify-between p-[5%]">
          <div>
            <p className="text-[clamp(10px,3.2cqw,14px)] font-bold">
              ROV <span className={hi}>{L.no}</span>
            </p>
            <p className="text-[clamp(18px,6cqw,28px)] leading-tight font-bold">
              {s.heroes} <span className={hi}>{L.heroes}</span> {s.skins} <span className={hi}>{L.skins}</span>
            </p>
            <p className="text-[clamp(10px,3.2cqw,14px)] font-semibold text-white/85">
              {s.winrate} <span className={hi}>{L.winrate}%</span> · {s.matches} <span className={hi}>{formatInt(L.matches)}</span>
            </p>
          </div>
          <p className="text-[clamp(24px,9cqw,42px)] leading-none font-bold">
            {s.price} <span className={hi}>{formatInt(L.price)}</span> <span className="text-[0.55em] text-white/85">{s.baht}</span>
          </p>
        </div>

        {/* แรงค์ */}
        <div className="absolute top-[52%] right-[5%] flex -translate-y-1/2 flex-col items-center gap-1">
          <span className="grid size-[clamp(40px,14cqw,60px)] place-items-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-lg ring-2 ring-amber-200/60">
            <Trophy className="size-1/2 text-white drop-shadow" />
          </span>
          <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[clamp(8px,2.6cqw,11px)] font-bold">{s.rank}</span>
        </div>
      </div>

      {/* กริดสกิน 8 × 3 */}
      <div aria-hidden className="grid shrink-0 grid-cols-8 gap-px bg-black/60 p-px">
        {skins.map((x, i) => (
          <SkinThumb key={x.id} skin={x} index={i + 1} compact hideTier size="xs" className="rounded-[3px]" sizes="56px" />
        ))}
      </div>
    </div>
  );
}
