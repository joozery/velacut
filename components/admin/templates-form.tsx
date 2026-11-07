"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { Eye, EyeOff, ImageUp, Loader2, RotateCcw, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PosterPreview } from "@/components/editor/poster-preview";
import { getCatalog } from "@/lib/catalog";
import { formatCoinsFixed } from "@/lib/format";
import { discountPercent, type TemplateId } from "@/lib/pricing";
import { DEFAULT_TEMPLATE_A_BANNER, DEFAULT_TEMPLATES, TEMPLATE_IDS, type TemplateSetting, type TemplatesConfig } from "@/lib/templates";
import { saveTemplatesAction } from "@/app/admin/actions";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

const LAYOUT_NOTE: Record<TemplateId, string> = {
  none: "ตารางสกินล้วน ไม่มีหัวป้าย",
  a: "ภาพหัวป้ายที่อัปโหลดจากหลังบ้าน",
  b: "หัวป้ายว่าง ให้ลูกค้าอัปโหลดแบนเนอร์เอง",
};

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring", checked ? "bg-primary" : "bg-surface-3")}>
      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

/** อัปโหลดภาพหัวป้ายเทมเพลต A ขึ้น R2 */
function BannerField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const body = new FormData(); body.set("file", file);
      const res = await fetch("/api/admin/templates/banner", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      onChange(data.url);
      toast({ title: "อัปโหลดภาพหัวป้ายแล้ว", description: `${data.width}×${data.height} px · กดบันทึกเพื่อใช้งาน`, variant: "success" });
    } catch (e) {
      toast({ title: "อัปโหลดไม่สำเร็จ", description: e instanceof Error ? e.message : undefined, variant: "error" });
    } finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <div className="grid gap-1.5 rounded-xl border border-dashed border-border p-3">
      <p className="text-xs font-medium">ภาพหัวป้าย</p>
      <p className="text-[11px] text-muted-foreground">แสดงด้านบนป้ายตามสัดส่วนจริงของรูป · แนะนำกว้าง 1600px</p>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" aria-label="เลือกไฟล์ภาพหัวป้ายเทมเพลต A" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      <div className="mt-1 flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}เปลี่ยนรูป</Button>
        {value !== DEFAULT_TEMPLATE_A_BANNER && <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange(DEFAULT_TEMPLATE_A_BANNER)}><Undo2 aria-hidden />ใช้รูปเริ่มต้น</Button>}
      </div>
    </div>
  );
}

/** สกินตัวอย่างสำหรับ preview — เลือกสกินแรงค์สูงสุด 12 ตัว */
const SAMPLE_SKINS = [...getCatalog("mlbb").skins].sort((a, b) => b.tierRank - a.tierRank).slice(0, 8).map((s) => s.id);

export function TemplatesForm({ initial, used }: { initial: TemplatesConfig; used: Record<string, number> }) {
  const uid = useId();
  const [saved, setSaved] = useState(initial);
  const [cfg, setCfg] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(saved), [cfg, saved]);
  const enabledCount = TEMPLATE_IDS.filter((id) => cfg[id].enabled).length;
  const set = (id: TemplateId, patch: Partial<TemplateSetting>) => setCfg((c) => ({ ...c, [id]: { ...c[id], ...patch } }));

  const save = () => start(async () => {
    setError("");
    const r = await saveTemplatesAction(cfg);
    if (!r.ok) { setError(r.error); return; }
    setSaved(r.data); setCfg(r.data);
    toast({ title: "บันทึกเทมเพลตแล้ว", description: "ผู้ใช้เห็นชื่อ ราคา และแบบที่เปิดใหม่ทันที", variant: "success" });
  });

  return (
    <div className="pb-24">
      <div className="grid gap-5 xl:grid-cols-3">
        {TEMPLATE_IDS.map((id) => {
          const t = cfg[id];
          const off = discountPercent(t.price, t.compareAtPrice ?? undefined);
          const lastOn = t.enabled && enabledCount === 1;
          return (
            <Card key={id} className={cn("flex flex-col overflow-hidden transition-opacity", !t.enabled && "opacity-70")}>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary uppercase">{id === "none" ? "—" : id}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.name || DEFAULT_TEMPLATES[id].name}</p>
                  <p className="flex items-center gap-1 text-[11px]"><span className={cn("flex items-center gap-1", t.enabled ? "text-success" : "text-muted-foreground")}>{t.enabled ? <Eye className="size-3" aria-hidden /> : <EyeOff className="size-3" aria-hidden />}{t.enabled ? "เปิดให้ผู้ใช้เลือก" : "ปิดอยู่ · ผู้ใช้มองไม่เห็น"}</span><span className="text-muted-foreground">· ขายแล้ว {(used[id] ?? 0).toLocaleString("th-TH")} ป้าย</span></p>
                </div>
                <span title={lastOn ? "ต้องเปิดไว้อย่างน้อย 1 แบบ" : undefined}><Switch checked={t.enabled} onChange={(v) => !lastOn || v ? set(id, { enabled: v }) : toast({ title: "ต้องเปิดไว้อย่างน้อย 1 แบบ", variant: "error" })} label={`เปิดใช้${t.name}`} /></span>
              </div>

              <div className="relative h-56 overflow-hidden bg-surface-2/60 p-3">
                <PosterPreview game="mlbb" skinIds={SAMPLE_SKINS} cols={4} template={id} bannerA={cfg.a.banner} className="pointer-events-none rounded-xl shadow-none" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent" />
                <span className="absolute right-5 bottom-5 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur">{LAYOUT_NOTE[id]}</span>
              </div>

              <div className="grid gap-3 p-4">
                {id === "a" && <BannerField value={t.banner ?? DEFAULT_TEMPLATE_A_BANNER} onChange={(banner) => set("a", { banner })} />}
                <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-name`} className="text-xs">ชื่อที่แสดง</Label><Input id={`${uid}-${id}-name`} value={t.name} maxLength={40} onChange={(e) => set(id, { name: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-desc`} className="text-xs">คำอธิบาย</Label><Textarea id={`${uid}-${id}-desc`} rows={2} value={t.desc} maxLength={160} onChange={(e) => set(id, { desc: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-price`} className="text-xs">ราคา (เครดิต)</Label><Input id={`${uid}-${id}-price`} type="number" inputMode="decimal" min={0} step="0.01" value={Number.isFinite(t.price) ? t.price : ""} onChange={(e) => set(id, { price: e.target.value === "" ? 0 : Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-compare`} className="text-xs">ราคาก่อนลด</Label><Input id={`${uid}-${id}-compare`} type="number" inputMode="decimal" min={0} step="0.01" placeholder="ไม่แสดง" value={t.compareAtPrice ?? ""} onChange={(e) => set(id, { compareAtPrice: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                </div>
                <p className="text-[11px] text-muted-foreground">ผู้ใช้เห็น: <b className="text-foreground">{t.price === 0 ? "ฟรี" : `+${formatCoinsFixed(t.price)} เครดิต`}</b>{t.compareAtPrice ? <> · <s>{formatCoinsFixed(t.compareAtPrice)}</s></> : null}{off > 0 && <span className="ml-1 rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">ลด {off}%</span>} · บวกค่าสกินตามจำนวน</p>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] leading-6 text-muted-foreground">ราคาใหม่มีผลกับป้ายที่ซื้อหลังบันทึก · ป้ายที่ซื้อไปแล้วดาวน์โหลดซ้ำได้ตามเดิม · ถ้าผู้ใช้กำลังใช้แบบที่ปิด ระบบจะสลับเป็นแบบแรกที่เปิดอยู่ให้อัตโนมัติ</p>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur lg:left-[240px]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <p role={error ? "alert" : "status"} className={cn("min-w-0 flex-1 truncate text-xs", error ? "text-danger" : "text-muted-foreground")}>{error || (dirty ? "มีการเปลี่ยนแปลงที่ยังไม่บันทึก" : "บันทึกการเปลี่ยนแปลงทั้งหมดแล้ว")}</p>
          <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={() => { setCfg(saved); setError(""); }}><RotateCcw aria-hidden />ยกเลิก</Button>
          <Button type="button" disabled={!dirty || pending} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึก</Button>
        </div>
      </div>
    </div>
  );
}
