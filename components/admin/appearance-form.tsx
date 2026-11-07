/* eslint-disable @next/next/no-img-element -- Preview uploaded images directly, including unsaved assets. */
"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Droplets, ImageUp, LayoutTemplate, Loader2, Palette, RotateCcw, Save, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "./ui";
import { DEFAULT_APPEARANCE, HOME_SECTIONS, appearanceTokens, type Appearance } from "@/lib/appearance";
import { saveAppearanceAction } from "@/app/admin/actions";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { SkinWatermarkOverlay } from "@/components/shared/skin-watermark";
import { getCatalog } from "@/lib/catalog";
import type { SkinWatermark } from "@/lib/appearance";

const SAMPLE = [...getCatalog("mlbb").skins].sort((a, b) => b.tierRank - a.tierRank).slice(0, 3);

function WatermarkPreview({ config, name }: { config: SkinWatermark; name: string }) {
  return <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#0b0b0d] p-3">{SAMPLE.map((skin) => <div key={skin.id} className="@container relative overflow-hidden rounded-lg"><SkinThumb skin={skin} hideTier size="lg" sizes="160px" className="rounded-lg" /><SkinWatermarkOverlay config={config} siteName={name} /></div>)}</div>;
}

function Field({ label, children }: { label: string; children: (id: string) => React.ReactNode }) {
  const id = useId();
  return <div className="grid gap-1.5"><Label htmlFor={id} className="text-xs">{label}</Label>{children(id)}</div>;
}

function ImageField({ label, value, onChange, uploadReady, disabled }: { label: string; value: string; onChange: (url: string) => void; uploadReady: boolean; disabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File) {
    setBusy(true); setError("");
    try {
      const body = new FormData(); body.set("folder", "appearance"); body.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") throw new Error(result.error || "อัปโหลดไม่สำเร็จ");
      onChange(result.url);
    } catch (error) { setError(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  return <div className="grid gap-2"><span className="text-xs font-medium">{label}</span><div className="flex flex-wrap items-center gap-3"><div className="grid h-20 w-36 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-2 p-2"><img src={value} alt={label} className="max-h-full max-w-full object-contain" /></div><div><input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" aria-label={`อัปโหลด${label}`} disabled={!uploadReady || disabled || busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }} /><Button type="button" variant="outline" size="sm" disabled={!uploadReady || disabled || busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}{busy ? "กำลังอัปโหลด…" : "เปลี่ยนรูป"}</Button><p className="mt-2 max-w-xs text-[11px] leading-5 text-muted-foreground">PNG / JPG / WEBP ไม่เกิน 8 MB · อัปโหลดแล้วกดบันทึกเพื่อใช้งาน</p></div></div>{error && <p role="alert" className="text-xs text-danger">{error}</p>}</div>;
}

const tabs = [{ id: "brand", label: "แบรนด์และสี", icon: Palette }, { id: "hero", label: "ส่วนบนหน้าแรก", icon: Type }, { id: "sections", label: "ส่วนที่แสดง", icon: LayoutTemplate }, { id: "watermark", label: "ลายน้ำ", icon: Droplets }] as const;
const wordmarkImages = [
  ["/images/hero-cover-create-v1.webp", "สกินโทนน้ำเงิน"],
  ["/images/hero-cover-library-v1.webp", "คลังสกิน"],
  ["/images/hero-white-gaming.webp", "เกมมิงโทนสว่าง"],
];
const backgrounds = [
  ["/images/hero-arena-background-v1.webp", "อารีนาสีน้ำเงิน"],
  ["/images/auth-arena-portrait-v1.webp", "ประตูแฟนตาซี"],
  ["/images/hero-white-gaming.webp", "เกมมิงโทนสว่าง"],
];

/** ตัวหนังสือชื่อเว็บที่เติมด้วยภาพ — แบบเดียวกับหน้าแรก (ย่อส่วน) */
function WordmarkPreview({ name, image, animate, bare = false }: { name: string; image: string; animate: boolean; bare?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={cn(!bare && "overflow-hidden rounded-xl bg-[#04060d] px-4 py-5")}>
      <svg aria-label={`ตัวอย่างตัวหนังสือ ${name}`} role="img" viewBox="0 0 1440 330" className="block h-auto w-full select-none">
        <defs><pattern id={id} patternUnits="userSpaceOnUse" width="1440" height="330"><image href={image} x="-1100" y="-350" width="3000" height="1500" preserveAspectRatio="xMidYMid slice" className={animate ? "hero-wordmark-image" : undefined} /></pattern></defs>
        <text x="0" y="315" fontSize="400" fontWeight="900" textLength="1440" lengthAdjust="spacingAndGlyphs" fill={`url(#${id})`}>{name.toUpperCase()}</text>
      </svg>
    </div>
  );
}

export function AppearanceForm({ initial, uploadReady }: { initial: Appearance; uploadReady: boolean }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("brand");
  const [previewDark, setPreviewDark] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const prefix = useId();
  const dirty = JSON.stringify(value) !== JSON.stringify(saved);
  const set = <K extends keyof Appearance>(key: K, next: Appearance[K]) => setValue(v => ({ ...v, [key]: next }));
  const wm = (patch: Partial<SkinWatermark>) => setValue(v => ({ ...v, watermark: { ...v.watermark, ...patch } }));
  const hero = (patch: Partial<Appearance["hero"]>) => setValue(v => ({ ...v, hero: { ...v.hero, ...patch } }));
  const save = () => start(async () => {
    setError("");
    const result = await saveAppearanceAction(value).catch(() => null);
    if (!result?.ok) { setError(result?.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่"); return; }
    setValue(result.data); setSaved(result.data);
    router.refresh();
    toast({ title: "บันทึกหน้าตาเว็บแล้ว", description: "หน้าบ้านจะใช้ค่าที่บันทึกใหม่", variant: "success" });
  });
  return <>
    <div className="mb-5 flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1.5" role="tablist" aria-label="ส่วนตกแต่งเว็บ" onKeyDown={event => {
      const index = tabs.findIndex(t => t.id === tab);
      const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
      if (next < 0) return;
      event.preventDefault();
      setTab(tabs[next].id);
      document.getElementById(`${prefix}-${tabs[next].id}`)?.focus();
    }}>{tabs.map(t => <button key={t.id} type="button" role="tab" tabIndex={tab === t.id ? 0 : -1} aria-selected={tab === t.id} aria-controls={`${prefix}-panel`} id={`${prefix}-${t.id}`} onClick={() => setTab(t.id)} className={cn("flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-xs font-medium transition-colors sm:flex-none sm:text-sm", tab === t.id ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-surface-2")}><t.icon className="size-4" aria-hidden />{t.label}</button>)}</div>
    <div className="grid items-start gap-5 pb-28 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div role="tabpanel" id={`${prefix}-panel`} aria-labelledby={`${prefix}-${tab}`} className="min-w-0 space-y-4">
        <fieldset disabled={pending} className="min-w-0 space-y-4 disabled:opacity-70">
          {tab === "brand" && <>
            <Card className="space-y-4 p-5"><div><h2 className="text-sm font-semibold">ข้อมูลเว็บ</h2><p className="mt-1 text-xs text-muted-foreground">ชื่อที่แสดงบนเว็บและคำอธิบายสำหรับผลการค้นหา</p></div><Field label="ชื่อเว็บ">{id => <Input id={id} value={value.name} maxLength={40} onChange={e => set("name", e.target.value)} />}</Field><Field label="คำอธิบายเว็บ">{id => <Textarea id={id} value={value.description} maxLength={200} rows={3} onChange={e => set("description", e.target.value)} />}</Field></Card>
            <Card className="space-y-5 p-5"><h2 className="text-sm font-semibold">โลโก้</h2>{!uploadReady && <p className="rounded-xl bg-surface-2 p-3 text-xs leading-6 text-muted-foreground">ยังไม่พร้อมอัปโหลดรูป กรุณาตั้งค่า Cloudflare R2 ก่อน ส่วนข้อความ สี และรูปที่มีอยู่ยังแก้ไขได้ตามปกติ</p>}<ImageField label="โลโก้โหมดสว่าง" value={value.logoLight} onChange={url => set("logoLight", url)} uploadReady={uploadReady} disabled={pending} /><ImageField label="โลโก้โหมดมืด / พื้นหลังมืด" value={value.logoDark} onChange={url => set("logoDark", url)} uploadReady={uploadReady} disabled={pending} /></Card>
            <Card className="space-y-4 p-5"><h2 className="text-sm font-semibold">สีหลักของเว็บ</h2><p className="text-xs text-muted-foreground">ใช้กับปุ่ม ลิงก์ และจุดเน้นของเว็บ สีตัวอักษรบนปุ่มจะปรับให้อ่านง่ายอัตโนมัติ</p>{([["primaryLight", "โหมดสว่าง"], ["primaryDark", "โหมดมืด"]] as const).map(([key, label]) => <Field key={key} label={label}>{id => <div className="flex items-center gap-3"><input id={id} type="color" value={value[key]} onChange={e => set(key, e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1" /><Input aria-label={`รหัสสี${label}`} value={value[key]} maxLength={7} onChange={e => set(key, e.target.value)} className="max-w-40 font-mono" /></div>}</Field>)}</Card>
          </>}
          {tab === "hero" && <>
            <Card className="space-y-4 p-5"><h2 className="text-sm font-semibold">ข้อความส่วนบนหน้าแรก</h2><Field label="ข้อความเล็กเหนือหัวข้อ">{id => <Input id={id} value={value.hero.kicker} maxLength={80} onChange={e => hero({ kicker: e.target.value })} />}</Field><Field label="หัวข้อบรรทัดแรก">{id => <Input id={id} value={value.hero.title} maxLength={60} onChange={e => hero({ title: e.target.value })} />}</Field><Field label="หัวข้อบรรทัดที่สอง">{id => <Input id={id} value={value.hero.highlight} maxLength={60} onChange={e => hero({ highlight: e.target.value })} />}</Field><Field label="คำอธิบาย">{id => <Textarea id={id} rows={3} value={value.hero.description} maxLength={300} onChange={e => hero({ description: e.target.value })} />}</Field><div className="grid gap-4 sm:grid-cols-2"><Field label="ข้อความปุ่ม">{id => <Input id={id} value={value.hero.ctaLabel} maxLength={40} onChange={e => hero({ ctaLabel: e.target.value })} />}</Field><Field label="ลิงก์ปุ่มในเว็บ">{id => <Input id={id} value={value.hero.ctaHref} maxLength={200} placeholder="/generate/mlbb" onChange={e => hero({ ctaHref: e.target.value })} />}</Field></div></Card>
            <Card className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">ภาพในตัวหนังสือชื่อเว็บ</h2><p className="mt-1 text-xs text-muted-foreground">ภาพที่อยู่ในตัวอักษร &quot;{value.name.toUpperCase()}&quot; ตัวใหญ่บนหน้าแรก</p></div>
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={value.hero.wordmarkAnimate} onChange={e => hero({ wordmarkAnimate: e.target.checked })} className="size-4 accent-primary" />ภาพเลื่อนช้า ๆ</label></div>
              <WordmarkPreview name={value.name} image={value.hero.wordmarkImage} animate={value.hero.wordmarkAnimate} />
              <div className="grid grid-cols-3 gap-2">{wordmarkImages.map(([src,label]) => <button key={src} type="button" aria-pressed={value.hero.wordmarkImage === src} onClick={() => hero({ wordmarkImage: src })} className={cn("overflow-hidden rounded-xl border-2 text-left", value.hero.wordmarkImage === src ? "border-primary" : "border-transparent")}><img src={src} alt="" className="aspect-video w-full object-cover" /><span className="block p-2 text-[10px]">{label}</span></button>)}</div>
              <ImageField label="ภาพที่เลือก" value={value.hero.wordmarkImage} onChange={url => hero({ wordmarkImage: url })} uploadReady={uploadReady} disabled={pending} />
              <p className="text-[11px] text-muted-foreground">แนะนำภาพแนวนอนกว้าง 2400px ขึ้นไป สีสด ตัดกับพื้นหลังเข้ม — ส่วนกลางภาพจะอยู่ในตัวอักษร</p>
            </Card>
            <Card className="space-y-4 p-5"><h2 className="text-sm font-semibold">ภาพพื้นหลัง section</h2><div className="grid grid-cols-3 gap-2">{backgrounds.map(([src,label]) => <button key={src} type="button" aria-pressed={value.hero.background === src} onClick={() => hero({ background: src })} className={cn("overflow-hidden rounded-xl border-2 text-left", value.hero.background === src ? "border-primary" : "border-transparent")}><img src={src} alt="" className="aspect-video w-full object-cover" /><span className="block p-2 text-[10px]">{label}</span></button>)}</div><ImageField label="รูปพื้นหลังที่เลือก" value={value.hero.background} onChange={url => hero({ background: url })} uploadReady={uploadReady} disabled={pending} /><p className="text-[11px] text-muted-foreground">แนะนำภาพแนวนอน 1920×1080 ขึ้นไป</p></Card>
          </>}
          {tab === "sections" && <>
            <Card className="overflow-hidden"><div className="border-b border-border p-5"><h2 className="text-sm font-semibold">ส่วนที่แสดงบนหน้าแรก</h2><p className="mt-1 text-xs text-muted-foreground">เปิดเฉพาะส่วนที่ต้องการให้ผู้ใช้เห็น</p></div><div className="divide-y divide-border">{HOME_SECTIONS.map(([key,label]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4"><span className="text-sm">{label}</span><input type="checkbox" checked={value.sections[key]} onChange={e => set("sections", { ...value.sections, [key]: e.target.checked })} className="size-4 accent-primary" /></label>)}</div></Card>
            <Card className="space-y-4 p-5"><h2 className="text-sm font-semibold">ข้อความท้ายเว็บ</h2><Field label="เกี่ยวกับเว็บ">{id => <Textarea id={id} rows={4} value={value.footerAbout} maxLength={300} onChange={e => set("footerAbout", e.target.value)} />}</Field><div className="flex flex-wrap gap-4 text-xs"><Link href="/admin/promo" className="text-primary hover:underline">ตั้งค่าแถบประกาศและโปรโมชัน ↗</Link><Link href="/admin/daily" className="text-primary hover:underline">ตั้งค่าเช็กอิน ↗</Link></div></Card>
          </>}
          {tab === "watermark" && <>
            <Card className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">ลายน้ำบนภาพสกิน</h2><p className="mt-1 text-xs text-muted-foreground">แสดงบนการ์ดสกินที่ผู้ใช้เลือกในตารางจัดสกินและบนป้ายตัวอย่าง — ไฟล์แบบไม่มีลายน้ำที่ชำระแล้วจะไม่มีลายน้ำนี้</p></div>
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs"><input type="checkbox" checked={value.watermark.enabled} onChange={e => wm({ enabled: e.target.checked })} className="size-4 accent-primary" />เปิดใช้</label></div>
              <WatermarkPreview config={value.watermark} name={value.name} />
              <div className={cn("space-y-4", !value.watermark.enabled && "pointer-events-none opacity-50")}>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="รูปแบบลายน้ำ">{([["text", "ข้อความ", Type], ["image", "รูปภาพ / โลโก้", ImageUp]] as const).map(([mode, label, Icon]) => <button key={mode} type="button" role="radio" aria-checked={value.watermark.mode === mode} onClick={() => wm({ mode })} className={cn("flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors", value.watermark.mode === mode ? "border-primary bg-primary-soft text-primary" : "border-border hover:bg-surface-2")}><Icon className="size-4" aria-hidden />{label}</button>)}</div>
                {value.watermark.mode === "text"
                  ? <Field label="ข้อความลายน้ำ">{id => <Input id={id} value={value.watermark.text} maxLength={24} placeholder={`เว้นว่าง = ใช้ชื่อเว็บ (${value.name})`} onChange={e => wm({ text: e.target.value })} />}</Field>
                  : <><ImageField label="รูปลายน้ำ" value={value.watermark.image} onChange={url => wm({ image: url })} uploadReady={uploadReady} disabled={pending} /><div className="flex flex-wrap gap-2 text-[11px]"><button type="button" onClick={() => wm({ image: value.logoDark })} className="rounded-lg border border-border px-2.5 py-1.5 hover:bg-surface-2">ใช้โลโก้โหมดมืด</button><button type="button" onClick={() => wm({ image: value.logoLight })} className="rounded-lg border border-border px-2.5 py-1.5 hover:bg-surface-2">ใช้โลโก้โหมดสว่าง</button></div><p className="text-[11px] text-muted-foreground">แนะนำ PNG พื้นใส สีขาวหรือสีอ่อน จะเห็นชัดบนภาพสกิน</p></>}
                {([["opacity", "ความเข้ม", 5, 90], ["size", "ขนาด", 50, 200]] as const).map(([key, label, min, max]) => <Field key={key} label={`${label} ${value.watermark[key]}%`}>{id => <input id={id} type="range" min={min} max={max} step={5} value={value.watermark[key]} onChange={e => wm({ [key]: Number(e.target.value) })} className="w-full accent-primary" />}</Field>)}
              </div>
            </Card>
          </>}
        </fieldset>
      </div>
      <aside className="xl:sticky xl:top-24" aria-label="ตัวอย่างหน้าบ้าน"><Card className="overflow-hidden"><div className="flex items-center justify-between gap-3 border-b border-border p-4"><div><h2 className="text-sm font-semibold">ตัวอย่างโดยย่อ</h2><p className="mt-1 text-[10px] text-muted-foreground">อัปเดตตามที่แก้ไข ยังไม่เผยแพร่</p></div><button type="button" onClick={() => setPreviewDark(d => !d)} aria-pressed={previewDark} className="rounded-lg border border-border px-2 py-1.5 text-[11px]">{previewDark ? "โหมดมืด" : "โหมดสว่าง"}</button></div><div style={appearanceTokens(/^#[0-9a-f]{6}$/i.test(previewDark ? value.primaryDark : value.primaryLight) ? (previewDark ? value.primaryDark : value.primaryLight) : "#1463e8")}><div className={cn("flex h-14 items-center justify-between px-4", previewDark ? "bg-[#151518] text-white" : "bg-white text-[#111114]")}><img src={previewDark ? value.logoDark : value.logoLight} alt={value.name} className="h-5 max-w-40 object-contain" /><span className="rounded-full bg-primary px-3 py-1.5 text-[10px] text-primary-foreground">บัญชี</span></div><div className="relative isolate overflow-hidden bg-[#04060d] px-5 py-8 text-white"><img src={value.hero.background} alt="" className="absolute inset-0 -z-20 size-full object-cover" /><div className="absolute inset-0 -z-10 bg-black/50" /><p className="text-[8px] tracking-widest text-white/70">{value.hero.kicker}</p><div className="mt-6"><WordmarkPreview name={value.name} image={value.hero.wordmarkImage} animate={value.hero.wordmarkAnimate} bare /></div><h3 className="mt-6 text-xl font-bold">{value.hero.title}<br /><span className="text-[#7fb0ff]">{value.hero.highlight}</span></h3><p className="mt-3 text-[11px] leading-5 whitespace-pre-line text-white/70">{value.hero.description}</p><span className="mt-5 inline-flex items-center gap-3 rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground">{value.hero.ctaLabel}<ArrowUpRight className="size-3.5" aria-hidden /></span></div><div className={cn("grid gap-2 p-4", previewDark ? "bg-[#151518]" : "bg-[#f5f5f7]")}>{HOME_SECTIONS.filter(([key]) => value.sections[key]).map(([key,label]) => <div key={key} className="rounded-lg border border-primary/15 bg-primary-soft px-3 py-2 text-[10px] text-primary">{label}</div>)}</div><div className="bg-[#06152f] p-5 text-white"><img src={value.logoDark} alt="" className="h-4 max-w-36 object-contain" /><p className="mt-3 text-[10px] leading-5 whitespace-pre-line text-white/65">{value.footerAbout}</p></div></div></Card></aside>
    </div>
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 p-3 shadow-soft-lg backdrop-blur sm:p-4"><div aria-live="polite"><p className="text-xs font-medium">{pending ? "กำลังบันทึก…" : dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : "บันทึกการเปลี่ยนแปลงทั้งหมดแล้ว"}</p>{error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}</div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => { setValue(structuredClone(DEFAULT_APPEARANCE)); setError(""); }}><RotateCcw aria-hidden />ค่าเริ่มต้น</Button><Button type="button" size="sm" variant="outline" disabled={!dirty || pending} onClick={() => { setValue(saved); setError(""); }}>ยกเลิก</Button><Button type="button" size="sm" disabled={!dirty || pending} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึก</Button></div></div>
  </>;
}
