"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Copy, Eye, EyeOff, ImageUp, LayoutTemplate, Loader2, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PosterPreview } from "@/components/editor/poster-preview";
import { getCatalog } from "@/lib/catalog";
import { formatCoinsFixed } from "@/lib/format";
import { discountPercent, type TemplateId } from "@/lib/pricing";
import {
  DEFAULT_TEMPLATE_A_BANNER, MAX_TEMPLATES, isBuiltinTemplate, newLayerId, starterLayers, templateIds,
  type Layer, type TemplateKind, type TemplateSetting, type TemplatesConfig,
} from "@/lib/templates";
import { saveTemplatesAction } from "@/app/admin/actions";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { Card } from "./ui";
import { TemplateLayoutEditor } from "./template-layout-editor";

const KIND_NOTE: Record<TemplateKind, string> = {
  grid: "ตารางสกินล้วน ไม่มีหัวป้าย",
  banner: "ภาพหัวป้ายจากหลังบ้าน + ข้อมูลลูกค้าวางทับ",
  upload: "ลูกค้าอัปโหลดแบนเนอร์เอง",
};

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring", checked ? "bg-primary" : "bg-surface-3")}>
      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

/** อัปโหลดภาพหัวป้ายขึ้น R2 */
function BannerField({ value, onChange, name, optional }: { value: string; onChange: (url: string) => void; name: string; optional?: boolean }) {
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
      <p className="text-[11px] text-muted-foreground">แสดงตามสัดส่วนจริงของรูป · แนะนำกว้าง 1600px · ใช้ภาพพื้นหลังที่ยังไม่มีข้อความ แล้ววางข้อความในหน้าจัดวาง</p>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" aria-label={`เลือกไฟล์ภาพหัวป้าย ${name}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      <div className="mt-1 flex gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}{value ? "เปลี่ยนรูป" : "อัปโหลดรูป"}</Button>
        {optional ? value && <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange("")}><Undo2 aria-hidden />ไม่ใช้รูป (พื้นไล่สี)</Button>
          : value !== DEFAULT_TEMPLATE_A_BANNER && <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => onChange(DEFAULT_TEMPLATE_A_BANNER)}><Undo2 aria-hidden />ใช้รูปเริ่มต้น</Button>}
      </div>
    </div>
  );
}

/** สกินตัวอย่างสำหรับ preview — เลือกสกินแรงค์สูงสุด 8 ตัว */
const SAMPLE_SKINS = [...getCatalog("mlbb").skins].sort((a, b) => b.tierRank - a.tierRank).slice(0, 8).map((s) => s.id);

const newTemplateId = (cfg: TemplatesConfig) => {
  let id: string;
  do id = `t-${newLayerId().slice(0, 6)}`; while (id in cfg);
  return id;
};

export function TemplatesForm({ initial, used }: { initial: TemplatesConfig; used: Record<string, number> }) {
  const uid = useId();
  const [saved, setSaved] = useState(initial);
  const [cfg, setCfg] = useState(initial);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<TemplateId | null>(null);
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(saved), [cfg, saved]);
  const ids = templateIds(cfg);
  const enabledCount = ids.filter((id) => cfg[id].enabled).length;
  const set = (id: TemplateId, patch: Partial<TemplateSetting>) => setCfg((c) => ({ ...c, [id]: { ...c[id], ...patch } }));

  /** เพิ่มแบบใหม่ต่อท้าย (หรือถัดจากแบบต้นฉบับ) — ปิดไว้ก่อนจนแอดมินจัดเสร็จ */
  const insert = (setting: TemplateSetting, after?: TemplateId) => {
    if (ids.length >= MAX_TEMPLATES) { toast({ title: `สร้างได้ไม่เกิน ${MAX_TEMPLATES} แบบ`, variant: "error" }); return; }
    const id = newTemplateId(cfg);
    setCfg((c) => {
      const keys = Object.keys(c);
      const at = after ? keys.indexOf(after) + 1 : keys.length;
      keys.splice(at, 0, id);
      return Object.fromEntries(keys.map((k) => [k, k === id ? setting : c[k]]));
    });
    setEditing(id);
  };
  const create = () => insert({ enabled: false, kind: "banner", name: `แบบใหม่ ${ids.length}`, desc: "", price: 15, compareAtPrice: null, banner: "", layers: starterLayers() });
  const duplicate = (id: TemplateId) => {
    const t = cfg[id];
    insert({ ...t, enabled: false, name: `${t.name} (สำเนา)`.slice(0, 40), layers: (t.layers ?? []).map((l) => ({ ...l, id: newLayerId() })) }, id);
  };
  const remove = (id: TemplateId) => {
    if (cfg[id].enabled && enabledCount === 1) { toast({ title: "ต้องเปิดไว้อย่างน้อย 1 แบบ", variant: "error" }); return; }
    setCfg((c) => Object.fromEntries(Object.entries(c).filter(([k]) => k !== id)));
    toast({ title: `เอา "${cfg[id].name}" ออกแล้ว`, description: "กดบันทึกเพื่อยืนยัน หรือกดยกเลิกเพื่อเอากลับมา" });
  };
  const move = (id: TemplateId, dir: -1 | 1) => setCfg((c) => {
    const keys = Object.keys(c);
    const i = keys.indexOf(id), j = i + dir;
    if (j < 0 || j >= keys.length) return c;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    return Object.fromEntries(keys.map((k) => [k, c[k]]));
  });

  const save = () => start(async () => {
    setError("");
    const r = await saveTemplatesAction(cfg);
    if (!r.ok) { setError(r.error); return; }
    setSaved(r.data); setCfg(r.data);
    toast({ title: "บันทึกเทมเพลตแล้ว", description: "ผู้ใช้เห็นแบบ ราคา และการจัดวางใหม่ทันที", variant: "success" });
  });

  const editingSetting = editing ? cfg[editing] : undefined;

  return (
    <div className="pb-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{ids.length} แบบ · เปิดอยู่ {enabledCount} แบบ · ลำดับการ์ด = ลำดับที่ลูกค้าเห็น</p>
        <Button type="button" onClick={create}><Plus aria-hidden />สร้างแบบใหม่</Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ids.map((id, index) => {
          const t = cfg[id];
          const off = discountPercent(t.price, t.compareAtPrice ?? undefined);
          const lastOn = t.enabled && enabledCount === 1;
          const builtin = isBuiltinTemplate(id);
          const sold = used[id] ?? 0;
          return (
            <Card key={id} className={cn("flex flex-col overflow-hidden transition-opacity", !t.enabled && "opacity-75")}>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{t.name || "ไม่มีชื่อ"}</p>
                  <p className="flex flex-wrap items-center gap-x-1 text-[11px]"><span className={cn("flex items-center gap-1", t.enabled ? "text-success" : "text-muted-foreground")}>{t.enabled ? <Eye className="size-3" aria-hidden /> : <EyeOff className="size-3" aria-hidden />}{t.enabled ? "เปิดให้ผู้ใช้เลือก" : "ปิดอยู่ · ผู้ใช้มองไม่เห็น"}</span><span className="text-muted-foreground">· ขายแล้ว {sold.toLocaleString("th-TH")} ป้าย</span></p>
                </div>
                <span title={lastOn ? "ต้องเปิดไว้อย่างน้อย 1 แบบ" : undefined}><Switch checked={t.enabled} onChange={(v) => !lastOn || v ? set(id, { enabled: v }) : toast({ title: "ต้องเปิดไว้อย่างน้อย 1 แบบ", variant: "error" })} label={`เปิดใช้${t.name}`} /></span>
              </div>

              <div className="relative h-56 overflow-hidden bg-surface-2/60 p-3">
                <PosterPreview game="mlbb" skinIds={SAMPLE_SKINS} cols={4} template={id} setting={t} sample className="pointer-events-none rounded-xl shadow-none" />
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent" />
                <span className="absolute right-5 bottom-5 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm backdrop-blur">{KIND_NOTE[t.kind]}</span>
              </div>

              <div className="grid gap-3 p-4">
                {t.kind !== "grid" && (
                  <Button type="button" variant="outline" className="w-full" onClick={() => setEditing(id)}>
                    <LayoutTemplate aria-hidden />จัดวางข้อความ / แรงค์บนหัวป้าย
                    <span className="ml-auto rounded-full bg-surface-2 px-1.5 text-[10px] text-muted-foreground tabular-nums">{t.layers?.length ?? 0} ชิ้น</span>
                  </Button>
                )}
                {!builtin && (
                  <div className="grid gap-1.5">
                    <Label className="text-xs">หัวป้าย</Label>
                    <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-0.5">
                      {([["banner", "ภาพจากหลังบ้าน"], ["upload", "ลูกค้าอัปโหลดเอง"]] as const).map(([k, l]) => (
                        <button key={k} type="button" aria-pressed={t.kind === k} onClick={() => set(id, { kind: k })} className={cn("h-8 rounded-lg text-xs font-medium transition-colors", t.kind === k ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{l}</button>
                      ))}
                    </div>
                  </div>
                )}
                {t.kind === "banner" && <BannerField name={t.name} optional={!builtin} value={t.banner ?? (builtin ? DEFAULT_TEMPLATE_A_BANNER : "")} onChange={(banner) => set(id, { banner })} />}
                <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-name`} className="text-xs">ชื่อที่แสดง</Label><Input id={`${uid}-${id}-name`} value={t.name} maxLength={40} onChange={(e) => set(id, { name: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-desc`} className="text-xs">คำอธิบาย</Label><Textarea id={`${uid}-${id}-desc`} rows={2} value={t.desc} maxLength={160} onChange={(e) => set(id, { desc: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-price`} className="text-xs">ราคา (เครดิต)</Label><Input id={`${uid}-${id}-price`} type="number" inputMode="decimal" min={0} step="0.01" value={Number.isFinite(t.price) ? t.price : ""} onChange={(e) => set(id, { price: e.target.value === "" ? 0 : Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label htmlFor={`${uid}-${id}-compare`} className="text-xs">ราคาก่อนลด</Label><Input id={`${uid}-${id}-compare`} type="number" inputMode="decimal" min={0} step="0.01" placeholder="ไม่แสดง" value={t.compareAtPrice ?? ""} onChange={(e) => set(id, { compareAtPrice: e.target.value === "" ? null : Number(e.target.value) })} /></div>
                </div>
                <p className="text-[11px] text-muted-foreground">ผู้ใช้เห็น: <b className="text-foreground">{t.price === 0 ? "ฟรี" : `+${formatCoinsFixed(t.price)} เครดิต`}</b>{t.compareAtPrice ? <> · <s>{formatCoinsFixed(t.compareAtPrice)}</s></> : null}{off > 0 && <span className="ml-1 rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">ลด {off}%</span>} · บวกค่าสกินตามจำนวน</p>
              </div>

              <div className="mt-auto flex items-center gap-1 border-t border-border px-2 py-1.5">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`เลื่อน ${t.name} ไปก่อนหน้า`} disabled={index === 0} onClick={() => move(id, -1)}><ArrowLeft /></Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`เลื่อน ${t.name} ไปถัดไป`} disabled={index === ids.length - 1} onClick={() => move(id, 1)}><ArrowRight /></Button>
                <span className="flex-1" />
                {t.kind !== "grid" && <Button type="button" variant="ghost" size="sm" onClick={() => duplicate(id)}><Copy aria-hidden />ทำสำเนา</Button>}
                {!builtin && (
                  <Button type="button" variant="ghost" size="sm" className="text-danger hover:text-danger" disabled={sold > 0} title={sold > 0 ? "มีคนซื้อแล้ว ลบไม่ได้ — ปิดการใช้งานแทน" : undefined} onClick={() => remove(id)}><Trash2 aria-hidden />ลบ</Button>
                )}
              </div>
            </Card>
          );
        })}
        <button type="button" onClick={create} className="grid min-h-60 place-items-center rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft/40 hover:text-primary">
          <span className="flex flex-col items-center gap-2"><Plus className="size-6" aria-hidden />สร้างแบบใหม่<span className="text-[11px] font-normal">เริ่มจากชุดข้อความตัวอย่าง แล้วลากจัดวางเอง</span></span>
        </button>
      </div>
      <p className="mt-4 text-[11px] leading-6 text-muted-foreground">แบบใหม่จะปิดไว้ก่อนจนกว่าจะเปิดใช้ · ราคาใหม่มีผลกับป้ายที่ซื้อหลังบันทึก · ป้ายที่ซื้อไปแล้วดาวน์โหลดซ้ำได้ตามเดิม · แบบที่มีคนซื้อแล้วลบไม่ได้ ให้ปิดแทน · ถ้าผู้ใช้กำลังใช้แบบที่ปิด ระบบจะสลับเป็นแบบแรกที่เปิดอยู่ให้อัตโนมัติ</p>

      {editing && editingSetting && (
        <TemplateLayoutEditor
          key={editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          setting={editingSetting}
          skinIds={SAMPLE_SKINS}
          onChange={(layers: Layer[]) => set(editing, { layers })}
        />
      )}

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
