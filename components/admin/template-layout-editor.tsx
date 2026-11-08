"use client";

import { useEffect, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Award, Copy, ImageIcon, Move, Plus, RotateCcw, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { TemplateHeader } from "@/components/editor/template-header";
import { MAX_LAYERS, TOKENS, newCoverLayer, newLayerId, newRankLayer, newTextLayer, starterLayers, type Layer, type TemplateSetting, type TextLayer } from "@/lib/templates";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const LAYER_ICON = { text: Type, rank: Award, cover: ImageIcon } as const;
const SAMPLE_ACCENT = "#fcd34d";
const round = (n: number) => Math.round(n * 10) / 10;

function layerTitle(l: Layer) {
  if (l.type === "rank") return l.source === "peakRank" ? "ตราแรงค์สูงสุด" : "ตราแรงค์ปัจจุบัน";
  if (l.type === "cover") return "ภาพหน้าปก (สกิน)";
  return l.text.replace(/\s+/g, " ").trim() || "ข้อความ";
}

/** ตัวเลข + slider ในบรรทัดเดียว */
function NumberField({ label, value, min, max, step = 0.1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        <span className="flex items-center gap-1">
          <Input type="number" aria-label={label} value={value} min={min} max={max} step={step} onChange={(e) => e.target.value !== "" && onChange(Math.min(max, Math.max(min, Number(e.target.value))))} className="h-8 w-20 px-2 text-right text-xs tabular-nums" />
          {unit && <span className="w-4 text-[11px] text-muted-foreground">{unit}</span>}
        </span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(round(v))} thumbLabel={label} />
    </div>
  );
}

/** เลือกสี: สีคงที่ / สีไฮไลต์ที่ลูกค้าเลือก / (ถ้ามี) ไม่กำหนด */
function ColorField({ label, value, onChange, emptyLabel }: { label: string; value: string; onChange: (v: string) => void; emptyLabel?: string }) {
  const mode = value === "accent" ? "accent" : value ? "fixed" : "empty";
  const opt = (on: boolean) => cn("rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors", on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-surface-2");
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        {emptyLabel && <button type="button" className={opt(mode === "empty")} onClick={() => onChange("")}>{emptyLabel}</button>}
        <button type="button" className={opt(mode === "accent")} onClick={() => onChange("accent")}>สีไฮไลต์ของลูกค้า</button>
        <label className={cn(opt(mode === "fixed"), "flex cursor-pointer items-center gap-1.5")}>
          <input type="color" aria-label={`${label} สีคงที่`} value={mode === "fixed" ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="size-4 cursor-pointer rounded border-0 bg-transparent p-0" />
          สีคงที่{mode === "fixed" && <span className="font-mono text-[10px] uppercase">{value}</span>}
        </label>
      </div>
    </div>
  );
}

function TextProps({ layer, set }: { layer: TextLayer; set: (patch: Partial<TextLayer>) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (key: string) => {
    const el = ref.current;
    const at = el?.selectionStart ?? layer.text.length;
    const end = el?.selectionEnd ?? at;
    const token = `{${key}}`;
    set({ text: layer.text.slice(0, at) + token + layer.text.slice(end) });
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(at + token.length, at + token.length); });
  };
  const seg = (on: boolean) => cn("grid h-8 flex-1 place-items-center rounded-lg text-xs font-medium transition-colors", on ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground");
  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="layer-text" className="text-xs">ข้อความ</Label>
        <Textarea ref={ref} id="layer-text" rows={2} maxLength={120} value={layer.text} onChange={(e) => set({ text: e.target.value })} className="font-mono text-xs" />
        <p className="text-[11px] text-muted-foreground">กดเพื่อแทรกข้อมูลของลูกค้า — ถ้าลูกค้าไม่กรอกข้อมูลในบรรทัดนี้เลย บรรทัดนี้จะถูกซ่อน</p>
        <div className="flex flex-wrap gap-1">
          {TOKENS.map((t) => <button key={t.key} type="button" onClick={() => insert(t.key)} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] text-foreground hover:bg-primary-soft hover:text-primary">{t.label}</button>)}
        </div>
      </div>
      <NumberField label="ขนาดตัวอักษร" value={layer.size} min={0.5} max={20} unit="%" onChange={(size) => set({ size })} />
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">ความหนา</Label>
          <div className="flex gap-0.5 rounded-xl bg-surface-2 p-0.5">
            {([[400, "ปกติ"], [600, "หนา"], [800, "หนามาก"]] as const).map(([w, l]) => <button key={w} type="button" aria-pressed={layer.weight === w} onClick={() => set({ weight: w })} className={seg(layer.weight === w)}>{l}</button>)}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">จัดข้อความ</Label>
          <div className="flex gap-0.5 rounded-xl bg-surface-2 p-0.5">
            {([["left", AlignLeft, "ชิดซ้าย"], ["center", AlignCenter, "กึ่งกลาง"], ["right", AlignRight, "ชิดขวา"]] as const).map(([a, Icon, l]) => <button key={a} type="button" aria-label={l} aria-pressed={layer.align === a} onClick={() => set({ align: a })} className={seg(layer.align === a)}><Icon className="size-4" aria-hidden /></button>)}
          </div>
        </div>
      </div>
      <ColorField label="สีข้อความ" value={layer.color} onChange={(color) => set({ color: color || "#ffffff" })} />
      <ColorField label="สีของข้อมูลลูกค้า (ตัวเลข/ชื่อ)" value={layer.valueColor} emptyLabel="เหมือนข้อความ" onChange={(valueColor) => set({ valueColor })} />
      <label className="flex cursor-pointer items-center justify-between gap-3 text-xs font-medium">
        ขอบดำรอบตัวอักษร
        <input type="checkbox" checked={layer.shadow} onChange={(e) => set({ shadow: e.target.checked })} className="size-4 accent-[var(--color-primary)]" />
      </label>
    </>
  );
}

/** หน้าจัดวางหัวป้าย: ลากชิ้นส่วนบนภาพ + ตั้งค่าทางขวา (ค่ายังไม่บันทึกจนกดบันทึกที่หน้าหลัก) */
export function TemplateLayoutEditor({ open, onOpenChange, setting, onChange, skinIds }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: TemplateSetting;
  onChange: (layers: Layer[]) => void;
  skinIds: string[];
}) {
  const layers = setting.layers ?? [];
  const [selected, setSelected] = useState<string | undefined>(layers[0]?.id);
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; sx: number; sy: number; x: number; y: number; w: number; h: number } | null>(null);
  // ใช้ค่าล่าสุดใน pointer handler โดยไม่ต้องผูก listener ใหม่
  const latest = useRef({ layers, onChange });
  latest.current = { layers, onChange };

  const update = (id: string, patch: Partial<Layer>) => latest.current.onChange(latest.current.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  const sel = layers.find((l) => l.id === selected);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      let x = round(d.x + ((e.clientX - d.sx) / d.w) * 100);
      const y = round(d.y + ((e.clientY - d.sy) / d.h) * 100);
      if (Math.abs(x - 50) < 1 && !e.altKey) x = 50; // ดูดเข้ากึ่งกลาง (กด Alt ค้างเพื่อปิด)
      update(d.id, { x: Math.min(120, Math.max(-20, x)), y: Math.min(120, Math.max(-20, y)) });
    };
    const up = () => { drag.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, []);

  const add = (layer: Layer) => {
    if (layers.length >= MAX_LAYERS) { toast({ title: `วางได้ไม่เกิน ${MAX_LAYERS} ชิ้น`, variant: "error" }); return; }
    onChange([...layers, layer]);
    setSelected(layer.id);
  };
  const remove = (id: string) => {
    const i = layers.findIndex((l) => l.id === id);
    const next = layers.filter((l) => l.id !== id);
    onChange(next);
    setSelected(next[Math.min(i, next.length - 1)]?.id);
  };
  const moveBy = (id: string, dir: -1 | 1) => {
    const i = layers.findIndex((l) => l.id === id);
    const j = i + dir;
    if (j < 0 || j >= layers.length) return;
    const next = [...layers];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!sel) return;
    const step = e.shiftKey ? 5 : 0.5;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (d) { e.preventDefault(); update(sel.id, { x: round(sel.x + d[0]), y: round(sel.y + d[1]) }); }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(sel.id); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl gap-0 p-0 sm:rounded-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="border-b border-border px-6 pt-5 pb-4 pr-14">
          <DialogTitle className="text-lg">จัดวางหัวป้าย · {setting.name}</DialogTitle>
          <DialogDescription className="mt-1 text-xs">ลากชิ้นส่วนบนภาพเพื่อย้าย · ปุ่มลูกศรขยับทีละนิด (Shift = ทีละมาก) · ภาพนี้ใช้ข้อมูลตัวอย่าง</DialogDescription>
        </div>
        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* พื้นที่จัดวาง */}
          <div className="flex min-w-0 flex-col gap-3 bg-surface-2/60 p-4 sm:p-6">
            <div
              ref={canvas}
              tabIndex={0}
              onKeyDown={onKey}
              onPointerDown={(e) => { if (e.target === e.currentTarget || !(e.target as HTMLElement).closest("[data-layer]")) setSelected(undefined); }}
              aria-label="พื้นที่จัดวางหัวป้าย"
              className="@container relative overflow-hidden rounded-xl bg-zinc-950 text-white shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <TemplateHeader
                setting={setting}
                decoration={{ accent: SAMPLE_ACCENT }}
                game="mlbb"
                skinIds={skinIds}
                editor={{
                  selected,
                  onPointerDown: (e, l) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelected(l.id);
                    canvas.current?.focus();
                    const r = canvas.current!.getBoundingClientRect();
                    drag.current = { id: l.id, sx: e.clientX, sy: e.clientY, x: l.x, y: l.y, w: r.width, h: r.height };
                  },
                }}
              />
              {sel && <>
                <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-sky-400/40" style={{ left: `${sel.x}%` }} />
                <span aria-hidden className="pointer-events-none absolute inset-x-0 h-px bg-sky-400/40" style={{ top: `${sel.y}%` }} />
              </>}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Move className="size-3.5" aria-hidden />ขนาดตัวอักษรและตำแหน่งคิดเป็น % ของป้าย — ป้ายจริงจะออกมาสัดส่วนเดียวกันทุกขนาด</p>
          </div>

          {/* แผงชิ้นส่วน */}
          <div className="flex min-h-0 flex-col border-t border-border lg:max-h-[calc(100dvh-10rem)] lg:border-t-0 lg:border-l">
            <div className="grid gap-3 border-b border-border p-4">
              <div className="grid grid-cols-3 gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => add(newTextLayer())}><Plus aria-hidden />ข้อความ</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => add(newRankLayer({ source: layers.some((l) => l.type === "rank" && l.source === "rank") ? "peakRank" : "rank" }))}><Plus aria-hidden />แรงค์</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => add(newCoverLayer())}><Plus aria-hidden />หน้าปก</Button>
              </div>
              <ul className="grid max-h-48 grid-cols-[minmax(0,1fr)] gap-1 overflow-y-auto" aria-label="ชิ้นส่วนบนหัวป้าย (บนสุดอยู่ล่างสุดของรายการ)">
                {layers.length === 0 && <li className="rounded-xl bg-surface-2 p-3 text-center text-xs text-muted-foreground">ยังไม่มีชิ้นส่วน · เพิ่มจากปุ่มด้านบน หรือ <button type="button" className="font-medium text-primary underline" onClick={() => { const s = starterLayers(); onChange(s); setSelected(s[0].id); }}>ใช้ชุดเริ่มต้น</button></li>}
                {layers.map((l, i) => {
                  const Icon = LAYER_ICON[l.type];
                  const on = l.id === selected;
                  return (
                    <li key={l.id} className={cn("flex items-center gap-1 rounded-xl pr-1 transition-colors", on ? "bg-primary-soft" : "hover:bg-surface-2")}>
                      <button type="button" onClick={() => setSelected(l.id)} aria-pressed={on} className={cn("flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-xs", on && "font-semibold text-primary")}>
                        <Icon className="size-3.5 shrink-0" aria-hidden /><span className="truncate">{layerTitle(l)}</span>
                      </button>
                      <button type="button" aria-label="เลื่อนไปข้างหลัง" disabled={i === 0} onClick={() => moveBy(l.id, -1)} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-surface disabled:opacity-30"><ArrowUp className="size-3.5" /></button>
                      <button type="button" aria-label="เลื่อนมาข้างหน้า" disabled={i === layers.length - 1} onClick={() => moveBy(l.id, 1)} className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-surface disabled:opacity-30"><ArrowDown className="size-3.5" /></button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
              {!sel ? (
                <p className="text-center text-xs text-muted-foreground">เลือกชิ้นส่วนบนภาพหรือในรายการเพื่อแก้ไข</p>
              ) : <>
                {sel.type === "text" && <TextProps layer={sel} set={(p) => update(sel.id, p)} />}
                {sel.type === "rank" && <>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">แสดงแรงค์</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([["rank", "แรงค์ปัจจุบัน"], ["peakRank", "แรงค์สูงสุด"]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={sel.source === v} onClick={() => update(sel.id, { source: v })} className={cn("rounded-xl border px-2 py-2 text-xs font-medium", sel.source === v ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground")}>{l}</button>)}
                    </div>
                    <p className="text-[11px] text-muted-foreground">ลูกค้าเลือกแรงค์ในขั้นตกแต่ง ถ้าไม่เลือกจะไม่แสดงตรา</p>
                  </div>
                  <NumberField label="ขนาดตรา" value={sel.size} min={2} max={60} unit="%" onChange={(size) => update(sel.id, { size })} />
                </>}
                {sel.type === "cover" && <>
                  <p className="text-[11px] text-muted-foreground">ภาพสกินที่ลูกค้าเลือกเป็นหน้าปก (ไม่เลือก = สกินระดับสูงสุดอัตโนมัติ)</p>
                  <NumberField label="ขนาดภาพ" value={sel.size} min={4} max={80} unit="%" onChange={(size) => update(sel.id, { size })} />
                  <NumberField label="ความโค้งมุม" value={sel.radius} min={0} max={50} onChange={(radius) => update(sel.id, { radius })} />
                </>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label htmlFor="layer-x" className="text-xs">ตำแหน่งแนวนอน (%)</Label><Input id="layer-x" type="number" step={0.5} value={sel.x} onChange={(e) => e.target.value !== "" && update(sel.id, { x: Math.min(120, Math.max(-20, Number(e.target.value))) })} className="h-9 text-xs tabular-nums" /></div>
                  <div className="grid gap-1.5"><Label htmlFor="layer-y" className="text-xs">ตำแหน่งแนวตั้ง (%)</Label><Input id="layer-y" type="number" step={0.5} value={sel.y} onChange={(e) => e.target.value !== "" && update(sel.id, { y: Math.min(120, Math.max(-20, Number(e.target.value))) })} className="h-9 text-xs tabular-nums" /></div>
                </div>
                <div className="flex gap-2 border-t border-border pt-4">
                  <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => add({ ...sel, id: newLayerId(), x: round(sel.x + 2), y: round(sel.y + 4) })}><Copy aria-hidden />ทำสำเนา</Button>
                  <Button type="button" size="sm" variant="outline" className="flex-1 text-danger hover:text-danger" onClick={() => remove(sel.id)}><Trash2 aria-hidden />ลบ</Button>
                </div>
              </>}
            </div>

            <div className="flex gap-2 border-t border-border p-4">
              <Button type="button" variant="ghost" size="sm" disabled={!layers.length} onClick={() => { onChange([]); setSelected(undefined); }}><RotateCcw aria-hidden />ล้างทั้งหมด</Button>
              <Button type="button" className="flex-1" onClick={() => onOpenChange(false)}>เสร็จ</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
