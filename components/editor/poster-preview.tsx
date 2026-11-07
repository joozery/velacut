"use client";

import Image from "next/image";
import { Crown } from "lucide-react";
import { RankEmblem } from "@/components/shared/rank-emblem";
import { SAMPLE_RANK } from "@/lib/ranks";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { BRAND_NAME, copy } from "@/lib/copy";
import { useCatalog } from "@/components/shared/catalog-provider";
import { formatInt } from "@/lib/format";
import type { GameSlug } from "@/lib/games";
import { SAMPLE_LISTING } from "@/lib/mock";
import type { TemplateId } from "@/lib/pricing";
import { cn, fmt } from "@/lib/utils";
import type { Decoration } from "@/stores/editor-store";

const s = copy.editor.template.sample;
const hi = "text-amber-300";

/** แถบดำโปร่งรองหลังตัวหนังสือ — อ่านชัดโดยไม่ต้องทำภาพทั้งภาพให้มืด */
function Band({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("bg-black/65 px-[0.45em] py-[0.08em] font-extrabold whitespace-nowrap", className)}>{children}</span>;
}

/** ลายน้ำตัวอักษรเอียงทั้งภาพ (preview ฝั่ง client มีลายน้ำเสมอ — ภาพจริง render ฝั่ง server หลังชำระ) */
function TextWatermark() {
  return (
    <div data-export-watermark aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute -inset-1/2 grid rotate-[-24deg] grid-cols-4 content-center gap-x-10 gap-y-14 opacity-[0.16]">
        {Array.from({ length: 48 }).map((_, i) => (
          <span key={i} className="text-[clamp(10px,3.2cqw,18px)] font-bold tracking-[0.3em] whitespace-nowrap text-white">
            {BRAND_NAME}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PosterPreview({
  game,
  skinIds,
  cols: wantCols,
  template,
  className,
  decoration,
}: {
  game: GameSlug;
  skinIds: string[];
  /** สกินต่อแถว — ใช้ค่าเดียวกับ slider ในพื้นที่ทำงาน (สกินที่เกินขึ้นแถวใหม่) */
  cols: number;
  template: TemplateId;
  className?: string;
  decoration?: Decoration;
}) {
  const cat = useCatalog(game);
  const skins = skinIds.map((id) => cat.skinById.get(id)).filter((x) => !!x);
  // สกินน้อยกว่าจำนวนคอลัมน์ → ใช้เท่าจำนวนสกิน ให้แถวเต็มความกว้าง
  const cols = Math.max(1, Math.min(wantCols, skins.length));
  const cover = skins.find((skin) => skin.id === decoration?.coverId) ?? [...skins].sort((a, b) => b.tierRank - a.tierRank)[0];
  // แรงค์: ยังไม่ตกแต่ง (preview ตัวอย่าง) → แสดงแรงค์ตัวอย่าง / ตกแต่งแล้ว → แสดงตามที่เลือก (ไม่เลือก = ไม่แสดง)
  const rank = decoration ? decoration.rank : SAMPLE_RANK;
  const L = decoration ? { ...decoration, skins: skins.length } : SAMPLE_LISTING;
  const name = copy.editor.template.options[template].name;

  return (
    <div
      role="img"
      aria-label={fmt(copy.editor.template.previewAlt, { name })}
      className={cn(
        "@container relative isolate w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-soft-lg",
        template === "b" && "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-zinc-950",
        className,
      )}
      style={decoration ? { "--color-amber-300": decoration.accent } as React.CSSProperties : undefined}
    >
      {template === "a" ? (
        <Image
          src="/logo/bannerexam.png"
          alt="ตัวอย่างแบนเนอร์ป้ายขายไอดี MLBB เทมเพลต A"
          width={1641}
          height={959}
          sizes="(min-width: 1024px) 544px, 100vw"
          className="block h-auto w-full"
        />
      ) : template !== "none" && (
        <div aria-hidden className="relative aspect-[16/10] overflow-hidden">
          {/* ภาพตัวละคร: ไม่ทับมืดทั้งภาพ — ใช้แถบดำรองหลังตัวหนังสือแทน (แบบป้ายขายไอดีทั่วไป) */}
          {cover && <Image src={cover.image} alt="" fill unoptimized sizes="640px" className="-z-20 object-cover object-[65%_25%]" />}
          <div className="absolute inset-x-0 bottom-0 -z-10 h-[38%] bg-gradient-to-t from-black/85 to-transparent" />

          {/* ข้อมูลไอดี: แต่ละบรรทัดมีแถบดำโปร่งรอง */}
          <div className="absolute top-[7%] left-0 flex flex-col items-start gap-[0.4cqw]">
            <Band className="text-[clamp(11px,4.2cqw,24px)]">
              {game.toUpperCase()} <span className={hi}>{decoration ? decoration.code || "ขายไอดี" : s.code}</span>
            </Band>
            <Band className="text-[clamp(18px,7.4cqw,44px)] leading-[1.15]">
              {s.heroes} <span className={hi}>{L.heroes}</span> {s.skins} <span className={hi}>{L.skins}</span>
            </Band>
            <Band className="text-[clamp(10px,3.6cqw,20px)]">
              {s.winrate} <span className={hi}>{L.winrate}%</span> {s.matches} <span className={hi}>{formatInt(L.matches)}</span>
            </Band>
          </div>

          {/* แรงค์ของไอดี (ตราแรงค์ในเกม) — เทมเพลต A และ B */}
          {rank && <RankEmblem rank={rank} className={cn("absolute right-[4%]", template === "b" ? "top-[17%]" : "top-[8%]")} />}

          {/* ราคา: กลางล่าง มีแถบรองยาว */}
          <div className="absolute inset-x-0 bottom-[6%] flex flex-col items-center">
            {template === "b" && (
              <Band className="text-[clamp(10px,3.8cqw,22px)]">
                {s.down} <span className={hi}>{formatInt(L.down)}</span> {s.baht}
              </Band>
            )}
            <span className="bg-black/70 px-[4%] py-[0.6%] text-[clamp(22px,9cqw,56px)] leading-[1.15] font-extrabold whitespace-nowrap">
              {s.price} <span className={hi}>{formatInt(L.price)}</span> {s.baht}
            </span>
            <span className="mt-[0.5%] text-[clamp(10px,4cqw,24px)] font-extrabold text-amber-300 drop-shadow-[0_2px_4px_rgb(0_0_0/0.9)]">
              {decoration ? decoration.tagline : s.tagline}
            </span>
          </div>

          {/* เทมเพลต B: ของตกแต่ง */}
          {template === "b" && (
            <>
              <div className="absolute bottom-[7%] left-[4%] flex flex-col items-center">
                <span className="grid size-[clamp(30px,13cqw,80px)] place-items-center rounded-[30%] bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-800 shadow-xl ring-2 ring-violet-200/70">
                  <Crown className="size-1/2 text-amber-200 drop-shadow" />
                </span>
                <span className="mt-[0.3em] text-[clamp(8px,2.8cqw,15px)] font-extrabold drop-shadow-[0_2px_3px_rgb(0_0_0/0.9)]">
                  {formatInt(L.honor)}
                </span>
              </div>

              <span className="absolute top-[7%] right-[4%] inline-flex items-center gap-1 rounded-full bg-black/60 px-[0.7em] py-[0.3em] text-[clamp(8px,2.6cqw,14px)] font-semibold">
                <Crown className="size-[1.1em] text-amber-300" />
                VIP
              </span>
            </>
          )}
        </div>
      )}

      {/* ตารางสกินของผู้ใช้ */}
      <div aria-hidden className="grid gap-px bg-black p-px" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {skins.map((skin) => (
          <SkinThumb key={skin.id} skin={skin} hideTier size="lg" sizes="160px" className="rounded-none" />
        ))}
      </div>

      <TextWatermark />
    </div>
  );
}
