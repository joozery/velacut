"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Eye, Minus, Plus, Redo2, ImagePlus, LayoutTemplate, Palette, Type, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { getCatalog } from "@/lib/catalog";
import type { GameSlug } from "@/lib/games";
import { DEFAULT_DECORATION, useEditorStore, useGameEditor, type Decoration } from "@/stores/editor-store";
import { PosterPreview } from "./poster-preview";
import { RankPicker } from "./rank-picker";
import { useGrid } from "./use-grid";
import { useRequireSkins } from "./use-step-guard";

type Tool = "text" | "template" | "cover" | "color";
const tools = [{ id: "text", label: "ข้อความ", icon: Type }, { id: "template", label: "แบบป้าย", icon: LayoutTemplate }, { id: "cover", label: "หน้าปก", icon: ImagePlus }, { id: "color", label: "สี", icon: Palette }] as const;

const fields = [
  ["heroes", "จำนวนฮีโร่"], ["price", "ราคาขาย (บาท)"],
  ["winrate", "อัตราชนะ (%)"], ["matches", "จำนวนแมตช์"],
  ["down", "เงินดาวน์ (บาท)"], ["honor", "คะแนนสะสม"],
] as const;

export function DecorateStep({ game }: { game: GameSlug }) {
  const ready = useRequireSkins(game);
  const { doc, past, future } = useGameEditor(game);
  const { skins, viewCols } = useGrid(game);
  const [zoom, setZoom] = useState(100);
  const [preview, setPreview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("text");
  const setDecoration = useEditorStore((s) => s.setDecoration);
  const setTemplate = useEditorStore((s) => s.setTemplate);
  const decoration = { ...DEFAULT_DECORATION, ...doc.decoration };
  const patch = (value: Partial<Decoration>) => setDecoration(game, value);

  if (!ready) return <div role="status" aria-label="กำลังเตรียมป้าย" aria-busy="true" className="m-6 h-80 animate-pulse rounded-2xl bg-surface-2" />;

  const poster = <PosterPreview game={game} skinIds={skins} cols={viewCols} template={doc.template} decoration={decoration} />;

  const renderSettings = (prefix: string, tool?: Tool) => <>
        {!tool && <h2 className="text-lg font-bold">ตกแต่งป้ายของคุณ</h2>}
        {!tool && <p className="mt-1 text-xs text-muted-foreground">เปลี่ยนข้อมูลแล้วดูผลบนป้ายได้ทันที</p>}
        <div className="grid gap-4 pt-4">
          {(!tool || tool === "template" || doc.template === "none") && <div className="grid gap-2">
            <Label htmlFor={`${prefix}-decorate-template`}>แบบป้าย</Label>
            <select id={`${prefix}-decorate-template`} value={doc.template} onChange={(e) => setTemplate(game, e.target.value as typeof doc.template)} className="h-12 rounded-2xl border border-input bg-surface px-3 text-base sm:text-sm">
              <option value="none">ตารางสกินอย่างเดียว</option><option value="a">เทมเพลต A</option><option value="b">เทมเพลต B</option>
            </select>
          </div>}
          {doc.template === "none" ? <p className="rounded-2xl bg-primary-soft p-4 text-sm text-primary-soft-foreground">แบบนี้แสดงเฉพาะตารางสกิน เลือกเทมเพลต A หรือ B เพื่อเพิ่มข้อมูลไอดีและภาพหน้าปก</p> : <>
            {(!tool || tool === "text") && <><div className="grid gap-2"><Label htmlFor={`${prefix}-decorate-code`}>ชื่อป้าย / รหัสไอดี</Label><Input className="h-12 text-base sm:text-sm" id={`${prefix}-decorate-code`} value={decoration.code} maxLength={40} placeholder="เช่น ไอดี MLBB 001" onChange={(e) => patch({ code: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              {fields.filter(([key]) => doc.template === "b" || !["down", "honor"].includes(key)).map(([key, label]) => <div key={key} className="grid gap-2">
                <Label htmlFor={`${prefix}-decorate-${key}`} className="text-xs">{label}</Label>
                <Input className="h-12 text-base sm:text-sm" id={`${prefix}-decorate-${key}`} type="number" min={0} max={key === "winrate" ? 100 : undefined} step={key === "winrate" ? 0.1 : 1} value={decoration[key]} onChange={(e) => patch({ [key]: Math.min(key === "winrate" ? 100 : Number.MAX_SAFE_INTEGER, Math.max(0, Number(e.target.value) || 0)) })} />
              </div>)}
            </div>
            <div className="grid gap-2"><Label htmlFor={`${prefix}-decorate-tagline`}>ข้อความเพิ่มเติม</Label><Input className="h-12 text-base sm:text-sm" id={`${prefix}-decorate-tagline`} value={decoration.tagline} maxLength={60} onChange={(e) => patch({ tagline: e.target.value })} /></div>
            <RankPicker id={`${prefix}-decorate-rank`} value={decoration.rank} onChange={(rank) => patch({ rank })} /></>}
            {(!tool || tool === "cover") && <div className="grid gap-2"><Label htmlFor={`${prefix}-decorate-cover`}>ภาพหน้าปก</Label><select id={`${prefix}-decorate-cover`} value={decoration.coverId} onChange={(e) => patch({ coverId: e.target.value })} className="h-12 w-full rounded-2xl border border-input bg-surface px-3 text-base sm:text-sm"><option value="">เลือกจากสกินระดับสูงสุดอัตโนมัติ</option>{skins.map((id) => <option key={id} value={id}>{getCatalog(game).skinById.get(id)?.name ?? id}</option>)}</select>
              {tool === "cover" && <div className="mt-2 grid grid-cols-3 gap-3">{skins.map((id) => { const skin = getCatalog(game).skinById.get(id); return skin ? <button key={id} type="button" aria-label={`ใช้ ${skin.name} เป็นหน้าปก`} aria-pressed={decoration.coverId === id} onClick={() => patch({ coverId: id })} className={`relative overflow-hidden rounded-2xl border-2 ${decoration.coverId === id ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}><Image src={skin.image} alt={skin.name} width={120} height={160} className="aspect-[3/4] w-full object-cover" /><span className="absolute inset-x-0 bottom-0 bg-black/65 p-1 text-[10px] text-white">{skin.name}</span></button> : null; })}</div>}
            </div>}
            {(!tool || tool === "color") && <><div className="flex items-center justify-between gap-3"><Label htmlFor={`${prefix}-decorate-accent`}>สีข้อความไฮไลต์</Label><input id={`${prefix}-decorate-accent`} type="color" value={decoration.accent} onChange={(e) => patch({ accent: e.target.value })} className="h-10 w-16 cursor-pointer rounded-lg border border-input bg-surface p-1" /></div>
              <div className="grid grid-cols-6 gap-2">{["#fcd34d", "#ffffff", "#60a5fa", "#c084fc", "#fb7185", "#4ade80"].map((color) => <button type="button" key={color} aria-label={`สี ${color}`} aria-pressed={decoration.accent === color} onClick={() => patch({ accent: color })} className={`grid aspect-square place-items-center rounded-2xl border border-border ${decoration.accent === color ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : ""}`} style={{backgroundColor:color}}>{decoration.accent === color && <Check className="size-5 text-zinc-800" />}</button>)}</div>
            </>}
          </>}
        </div>
        {!tool && <p className="mt-6 text-xs leading-relaxed text-muted-foreground">บันทึกการแก้ไขอัตโนมัติในแท็บนี้ ย้อนกลับไปเปลี่ยนสกินหรือแบบป้ายได้</p>}
  </>;

  return (
    <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-label="ตัวอย่างป้ายที่กำลังตกแต่ง" className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-y-auto">
        <div className="z-10 flex shrink-0 items-center justify-between gap-1 bg-surface px-4 py-2 lg:border-b lg:border-border">
          <div className="flex items-center gap-0.5 rounded-full bg-surface-2 px-1">
            <Button variant="ghost" size="icon-sm" className="size-10 sm:size-9" aria-label="ย้อนกลับการแก้ไข" disabled={!past.length} onClick={() => useEditorStore.getState().undo(game)}><Undo2 /></Button>
            <Button variant="ghost" size="icon-sm" className="size-10 sm:size-9" aria-label="ทำซ้ำการแก้ไข" disabled={!future.length} onClick={() => useEditorStore.getState().redo(game)}><Redo2 /></Button>
            <Button variant="ghost" size="icon-sm" className="size-10 sm:size-9" aria-label="ย่อป้าย" disabled={zoom <= 50} onClick={() => setZoom((v) => Math.max(50, v - 10))}><Minus /></Button>
            <Button variant="ghost" size="sm" aria-label="รีเซ็ตขนาดป้าย" onClick={() => setZoom(100)} className="h-10 px-2 tabular-nums sm:h-9">{zoom}%</Button>
            <Button variant="ghost" size="icon-sm" className="size-10 sm:size-9" aria-label="ขยายป้าย" disabled={zoom >= 150} onClick={() => setZoom((v) => Math.min(150, v + 10))}><Plus /></Button>
          </div>
          <Button variant="outline" size="sm" aria-label="ดูตัวอย่างป้าย" onClick={() => setPreview(true)} className="inline-flex rounded-full px-3"><Eye /><span className="hidden sm:inline">ดูตัวอย่าง</span></Button>

        </div>
        <div className="relative min-h-0 flex-1 overflow-auto overscroll-contain editor-canvas px-6 pt-8 pb-5 sm:p-8">
          <div className="mx-auto transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${zoom}%`, maxWidth: `${34 * zoom / 100}rem` }}>{poster}</div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground"><Check className="size-3" />บันทึกแล้ว · {skins.length} สกิน</p>
        </div>
        <div className="shrink-0 rounded-t-2xl border-t border-border/50 bg-surface px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgb(25_35_65/0.06)] lg:hidden">
          <p className="mb-2 text-center text-[10px] font-medium text-muted-foreground">แต่งป้ายในสไตล์คุณ</p>
          <div className="grid grid-cols-4 gap-1">
            {tools.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-haspopup="dialog" onClick={() => { setActiveTool(id); setSettingsOpen(true); }} className="group flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl text-[11px] font-medium text-foreground transition-colors active:bg-primary-soft">
              <span className={`grid size-11 place-items-center rounded-2xl ${id === "text" ? "bg-primary text-primary-foreground shadow-soft" : "bg-surface-2 text-foreground"}`}><Icon className="size-5" strokeWidth={1.7} /></span>{label}
            </button>)}
          </div>
        </div>
      </section>
      <aside aria-label="ตั้งค่าป้าย" className="hidden border-l border-border bg-surface p-5 lg:block lg:overflow-y-auto">
        {renderSettings("desktop")}
      </aside>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="gap-0 lg:hidden">
          <div className="border-b border-border px-5 pt-2 pb-4 pr-14">
            <SheetTitle>{tools.find((tool) => tool.id === activeTool)?.label}</SheetTitle>
            <SheetDescription className="mt-1">ปรับข้อมูลแล้วกดเสร็จเพื่อกลับไปดูป้าย</SheetDescription>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{renderSettings("mobile", activeTool)}</div>
          <div className="shrink-0 border-t border-border bg-surface px-5 py-3"><Button size="lg" className="w-full rounded-2xl" onClick={() => setSettingsOpen(false)}><Check />เสร็จแล้ว</Button></div>
        </SheetContent>
      </Sheet>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-2xl"><DialogTitle>ตัวอย่างป้ายของคุณ</DialogTitle><DialogDescription>ข้อมูลและการตกแต่งล่าสุดก่อนดาวน์โหลด</DialogDescription>{poster}</DialogContent>
      </Dialog>
    </div>
  );
}
