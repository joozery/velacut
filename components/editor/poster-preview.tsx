"use client";

import { SkinThumb } from "@/components/shared/skin-thumb";
import { BRAND_NAME, copy } from "@/lib/copy";
import { useCatalog } from "@/components/shared/catalog-provider";
import type { GameSlug } from "@/lib/games";
import type { TemplateId } from "@/lib/pricing";
import { useTemplates } from "@/components/shared/templates-provider";
import type { TemplateSetting } from "@/lib/templates";
import { TemplateHeader } from "./template-header";
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
  setting: override,
  sample,
}: {
  game: GameSlug;
  skinIds: string[];
  /** สกินต่อแถว — ใช้ค่าเดียวกับ slider ในพื้นที่ทำงาน (สกินที่เกินขึ้นแถวใหม่) */
  cols: number;
  template: TemplateId;
  className?: string;
  decoration?: Partial<Decoration>;
  /** หลังบ้าน: ดูค่าแบบที่ยังไม่บันทึก */
  setting?: TemplateSetting;
  /** เติมค่าตัวอย่างในช่องที่ยังไม่กรอก ให้เห็นหน้าตาแบบ */
  sample?: boolean;
}) {
  const cat = useCatalog(game);
  const skins = skinIds.map((id) => cat.skinById.get(id)).filter((x) => !!x);
  // สกินน้อยกว่าจำนวนคอลัมน์ → ใช้เท่าจำนวนสกิน ให้แถวเต็มความกว้าง
  const cols = Math.max(1, Math.min(wantCols, skins.length));
  const templates = useTemplates();
  const setting = override ?? templates[template];
  const name = setting?.name ?? template;

  return (
    <div
      role="img"
      aria-label={fmt(copy.editor.template.previewAlt, { name })}
      className={cn(
        "@container relative isolate w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-950 text-white shadow-soft-lg",
        className,
      )}
      style={decoration?.accent ? { "--color-amber-300": decoration.accent } as React.CSSProperties : undefined}
    >
      {setting && <TemplateHeader setting={setting} decoration={decoration} game={game} skinIds={skinIds} sample={sample} />}

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
