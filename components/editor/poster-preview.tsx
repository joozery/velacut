"use client";

import { ImagePlus } from "lucide-react";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { BRAND_NAME, copy } from "@/lib/copy";
import { useCatalog } from "@/components/shared/catalog-provider";
import type { GameSlug } from "@/lib/games";
import type { TemplateId } from "@/lib/pricing";
import { useTemplates } from "@/components/shared/templates-provider";
import { DEFAULT_TEMPLATE_A_BANNER } from "@/lib/templates";
import { exportSafeSrc } from "@/lib/media-url";
import { cn, fmt } from "@/lib/utils";
import type { Decoration } from "@/stores/editor-store";

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
  bannerA,
}: {
  game: GameSlug;
  skinIds: string[];
  /** สกินต่อแถว — ใช้ค่าเดียวกับ slider ในพื้นที่ทำงาน (สกินที่เกินขึ้นแถวใหม่) */
  cols: number;
  template: TemplateId;
  className?: string;
  decoration?: Decoration;
  /** หลังบ้าน: ดูภาพหัวป้าย A ที่ยังไม่บันทึก */
  bannerA?: string;
}) {
  const cat = useCatalog(game);
  const skins = skinIds.map((id) => cat.skinById.get(id)).filter((x) => !!x);
  // สกินน้อยกว่าจำนวนคอลัมน์ → ใช้เท่าจำนวนสกิน ให้แถวเต็มความกว้าง
  const cols = Math.max(1, Math.min(wantCols, skins.length));
  const templates = useTemplates();
  const name = templates[template]?.name ?? template;

  return (
    <div
      role="img"
      aria-label={fmt(copy.editor.template.previewAlt, { name })}
      className={cn(
        "@container relative isolate w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-soft-lg",
        className,
      )}
      style={decoration ? { "--color-amber-300": decoration.accent } as React.CSSProperties : undefined}
    >
      {template === "a" ? (
        // ภาพหัวป้ายตั้งจากหลังบ้าน (เมนูเทมเพลตป้าย)
        // eslint-disable-next-line @next/next/no-img-element -- admin upload on R2, html-to-image needs a plain <img>
        <img src={exportSafeSrc(bannerA ?? templates.a.banner ?? DEFAULT_TEMPLATE_A_BANNER)} alt="" draggable={false} className="block h-auto w-full select-none" />
      ) : template === "b" && (
        decoration?.banner ? (
          // แบนเนอร์ของลูกค้าเอง — แสดงตามสัดส่วนจริงของรูป ไม่มีข้อความทับ
          // eslint-disable-next-line @next/next/no-img-element -- R2 upload, html-to-image needs a plain <img>
          <img src={exportSafeSrc(decoration.banner)} alt="" draggable={false} className="block h-auto w-full select-none" />
        ) : (
          <div data-export-watermark className="grid aspect-[16/7] place-items-center border-b border-dashed border-white/25 bg-[repeating-linear-gradient(-45deg,rgb(255_255_255/0.04)_0_10px,transparent_10px_20px)] text-center">
            <div className="flex flex-col items-center gap-[1.2cqw] px-[6%]">
              <ImagePlus className="size-[clamp(20px,7cqw,40px)] text-white/45" aria-hidden />
              <p className="text-[clamp(11px,3.4cqw,18px)] font-semibold text-white/70">พื้นที่แบนเนอร์ของคุณ</p>
              <p className="text-[clamp(9px,2.4cqw,13px)] text-white/45">อัปโหลดแบนเนอร์ในขั้นตกแต่ง</p>
            </div>
          </div>
        )
      )}

      {/* ตารางสกินของผู้ใช้ */}
      <div aria-hidden className="grid gap-px bg-black p-px" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {skins.map((skin) => (
          <SkinThumb key={skin.id} skin={skin} hideTier compact size="lg" sizes="160px" watermark exportSafe className="rounded-none" />
        ))}
      </div>

      <TextWatermark />
    </div>
  );
}
