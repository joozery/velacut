"use client";

import { ImagePlus } from "lucide-react";
import { useCatalog } from "@/components/shared/catalog-provider";
import type { GameSlug } from "@/lib/games";
import { exportSafeSrc } from "@/lib/media-url";
import { SAMPLE_RANK, rankImage, type RankId } from "@/lib/ranks";
import { TOKENS, customerCanUpload, renderTokens, type Layer, type TemplateSetting, type TokenValues } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { Decoration } from "@/stores/editor-store";

const SAMPLE_PEAK_RANK: RankId = "mythic-immortal";
const DEFAULT_ACCENT = "#fcd34d";
/** ใช้ text-shadow เพื่อให้ขอบติดไปกับภาพที่ส่งออกด้วย */
function textOutline(width: number, color: string) {
  if (width <= 0) return undefined;
  const radius = width / 100;
  return Array.from({ length: 24 }, (_, i) => {
    const angle = i * Math.PI / 12;
    return `${Math.cos(angle) * radius}em ${Math.sin(angle) * radius}em 0 ${color}`;
  }).join(", ");
}
const SHIFT_X = { left: "0%", center: "-50%", right: "-100%" } as const;

export type LayerEditor = {
  selected?: string;
  onPointerDown: (e: React.PointerEvent<HTMLElement>, layer: Layer) => void;
};

/**
 * หัวป้ายของแบบที่แอดมินจัดวาง: ภาพพื้นหลัง + ชิ้นส่วนวางทับ (ตำแหน่งเป็น % ของกรอบ, ขนาดเป็น cqw ของป้าย)
 * ต้องอยู่ใน element ที่เป็น @container ความกว้างเท่าป้าย
 */
export function TemplateHeader({ setting, decoration, game, skinIds, sample, editor }: {
  setting: TemplateSetting;
  decoration?: Partial<Decoration>;
  game: GameSlug;
  skinIds: string[];
  /** เติมค่าตัวอย่างในช่องที่ลูกค้ายังไม่กรอก (หน้าเลือกแบบ / หลังบ้าน) */
  sample?: boolean;
  editor?: LayerEditor;
}) {
  const cat = useCatalog(game);
  if (setting.kind === "grid") return null;
  const d = decoration ?? {};
  const accent = d.accent || DEFAULT_ACCENT;
  const paint = (c: string) => (c === "accent" ? accent : c);

  const values: TokenValues = { code: d.code, heroes: d.heroes, skins: skinIds.length, price: d.price, down: d.down, winrate: d.winrate, matches: d.matches, honor: d.honor, tagline: d.tagline };
  if (sample || editor) for (const t of TOKENS) if (!values[t.key] || (t.key === "skins" && editor)) values[t.key] = t.sample;
  const ranks = { rank: d.rank ?? (sample || editor ? SAMPLE_RANK : undefined), peakRank: d.peakRank ?? (sample || editor ? SAMPLE_PEAK_RANK : undefined) };

  const skins = skinIds.map((id) => cat.skinById.get(id)).filter((s) => !!s);
  const cover = skins.find((s) => s.id === d.coverId) ?? [...skins].sort((a, b) => b.tierRank - a.tierRank)[0];

  // แบบ banner ที่เปิดให้ลูกค้าเปลี่ยนพื้นหลัง: ใช้รูปลูกค้าถ้ามี ไม่งั้นใช้ภาพของแอดมิน
  const image = setting.kind === "banner" ? (customerCanUpload(setting) && d.banner) || setting.banner : d.banner;

  const layer = (l: Layer) => {
    const selected = editor?.selected === l.id;
    const common = {
      "data-layer": l.id,
      onPointerDown: editor ? (e: React.PointerEvent<HTMLElement>) => editor.onPointerDown(e, l) : undefined,
      className: cn("absolute select-none", editor && "cursor-move touch-none outline-offset-2 hover:outline hover:outline-1 hover:outline-sky-400/70", selected && "outline outline-2! outline-sky-400!"),
    };
    if (l.type === "text") {
      const parts = renderTokens(l.text, values);
      if (!parts) return null;
      return (
        <div key={l.id} {...common} style={{ left: `${l.x}%`, top: `${l.y}%`, transform: `translate(${SHIFT_X[l.align]},-50%)`, fontSize: `${l.size}cqw`, fontWeight: l.weight, color: paint(l.color), textAlign: l.align, lineHeight: 1.15, whiteSpace: "pre", fontStyle: l.italic ? "italic" : undefined,
          textShadow: l.shadow ? textOutline(l.strokeWidth ?? 4, paint(l.strokeColor || "#000000")) : undefined,
          width: l.backgroundWidth ? `${l.backgroundWidth}cqw` : undefined,
          boxSizing: "border-box",
          padding: l.backgroundColor ? `${l.backgroundPadding ?? 1}cqw` : undefined,
          isolation: "isolate" }}>
          {l.backgroundColor && <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, backgroundColor: paint(l.backgroundColor), opacity: (l.backgroundOpacity ?? 50) / 100, borderRadius: `${l.backgroundRadius ?? 1.5}cqw`, pointerEvents: "none" }} />}
          {parts.map((p, i) => <span key={i} style={p.value && l.valueColor ? { color: paint(l.valueColor) } : undefined}>{p.text}</span>)}
        </div>
      );
    }
    const box = { left: `${l.x}%`, top: `${l.y}%`, width: `${l.size}cqw`, transform: "translate(-50%,-50%)" };
    if (l.type === "rank") {
      const id = ranks[l.source];
      if (!id) return null;
      // eslint-disable-next-line @next/next/no-img-element -- html-to-image needs a plain <img>
      return <img key={l.id} {...common} src={rankImage(id)} alt="" draggable={false} style={box} className={cn(common.className, "h-auto")} />;
    }
    if (!cover) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- html-to-image needs a plain <img>
      <img key={l.id} {...common} src={exportSafeSrc(cover.image)} alt="" draggable={false} style={{ ...box, aspectRatio: "3 / 4", borderRadius: `${l.radius}cqw` }} className={cn(common.className, "object-cover")} />
    );
  };

  return (
    <div className="relative">
      {setting.kind === "banner" && !image ? (
        // แบบที่ไม่ได้ใช้ภาพ: พื้นไล่สีเข้ม ใช้สีไฮไลต์ของลูกค้าเป็นแสง
        <div className="aspect-[16/9] w-full" style={{ background: `radial-gradient(120% 90% at 85% 10%, color-mix(in oklab, ${accent} 35%, transparent), transparent 60%), linear-gradient(135deg, #1e1b4b, #09090b 70%)` }} />
      ) : image ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin/customer upload on R2, html-to-image needs a plain <img>
        <img src={exportSafeSrc(image)} alt="" draggable={false} className="pointer-events-none block h-auto w-full select-none" />
      ) : (
        <div data-export-watermark className="grid aspect-[16/7] place-items-center border-b border-dashed border-white/25 bg-[repeating-linear-gradient(-45deg,rgb(255_255_255/0.04)_0_10px,transparent_10px_20px)] text-center">
          <div className="flex flex-col items-center gap-[1.2cqw] px-[6%]">
            <ImagePlus className="size-[clamp(20px,7cqw,40px)] text-white/45" aria-hidden />
            <p className="text-[clamp(11px,3.4cqw,18px)] font-semibold text-white/70">พื้นที่แบนเนอร์ของคุณ</p>
            <p className="text-[clamp(9px,2.4cqw,13px)] text-white/45">อัปโหลดแบนเนอร์ในขั้นตกแต่ง</p>
          </div>
        </div>
      )}
      {!!setting.layers?.length && <div className={cn("absolute inset-0 overflow-hidden", !editor && "pointer-events-none")}>{setting.layers.map(layer)}</div>}
    </div>
  );
}
