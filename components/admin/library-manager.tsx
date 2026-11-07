/* eslint-disable @next/next/no-img-element -- Admin previews use uploaded images and same-origin catalog routes. */
"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Pencil, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAME_TIERS } from "@/lib/tiers";
import type { LibraryItem } from "@/lib/server/catalog";
import { saveLibraryAction } from "@/app/admin/library-actions";
import { toast } from "@/stores/toast-store";

export function LibraryManager({ kind, rows, heroes, uploadReady, initialHero }: { kind: "hero" | "skin"; rows: LibraryItem[]; heroes: { id: string; name: string; active: boolean }[]; uploadReady: boolean; initialHero?: string }) {
  const router = useRouter();
  const id = useId();
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const label = kind === "hero" ? "ฮีโร่" : "สกิน";
  const open = (item?: LibraryItem) => {
    setError(""); setPreview(item?.preview ?? "");
    setEditing(item ? { ...item } : { id: `${kind === "hero" ? "custom-" : "mlbb-custom-"}${crypto.randomUUID()}`, name: "", heroId: heroes.some(h => h.id === initialHero) ? initialHero : heroes.find(h => h.active)?.id ?? "", tier: "Basic", label: "", image: "", preview: "", active: true, uploaded: false });
  };
  const patch = (value: Partial<LibraryItem>) => setEditing(current => current ? { ...current, ...value } : current);
  const upload = async (image: File) => {
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.set("file", image); form.set("folder", "catalog");
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || typeof data.url !== "string") throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      patch({ image: data.url }); setPreview(data.url);
    } catch (error) { setError(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setBusy(false); if (file.current) file.current.value = ""; }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true); setError("");
    const result = await saveLibraryAction(kind, editing).catch(() => null);
    setBusy(false);
    if (!result?.ok) { setError(result?.error ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่"); return; }
    setEditing(null); router.refresh();
    toast({ title: `บันทึก${label}แล้ว`, description: "คลังในหน้าสร้างป้ายจะใช้ข้อมูลใหม่", variant: "success" });
  };
  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">กดแก้ไขเพื่อเปลี่ยนรูปเดิม หรือเพิ่มรายการใหม่</p><Button size="sm" onClick={() => open()}><Plus aria-hidden />เพิ่ม{label}</Button></div>
    {!uploadReady && <p className="mb-4 rounded-xl border border-border bg-surface p-3 text-xs leading-6 text-muted-foreground">ต้องตั้งค่า Cloudflare R2 ก่อนอัปโหลดรูป ชื่อและสถานะของรายการเดิมยังแก้ได้</p>}
    {!rows.length ? <div className="rounded-2xl border border-border bg-surface py-16 text-center text-sm text-muted-foreground">ไม่พบรายการ ลองเปลี่ยนคำค้นหาหรือตัวกรอง</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{rows.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="relative aspect-[3/4] overflow-hidden bg-surface-2">{item.preview ? <img src={item.preview} alt={item.name} loading="lazy" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><ImagePlus className="size-10 text-muted-foreground" aria-hidden /></div>}<span className={`absolute top-2 left-2 rounded-full px-2 py-1 text-[10px] ${item.active ? "bg-surface/95 text-foreground" : "bg-ink/90 text-white"}`}>{item.active ? "แสดงในคลัง" : "ซ่อนอยู่"}</span></div><div className="p-3"><h2 className="truncate text-sm font-semibold" title={item.name}>{item.name}</h2>{item.heroName && <p className="mt-1 truncate text-[11px] text-muted-foreground">{item.heroName} · {item.tier}</p>}<p className="mt-1 text-[10px] text-muted-foreground">{item.uploaded ? "รูปอัปโหลด" : "รูปเดิมในเว็บ"}</p><Button size="sm" variant="outline" block className="mt-3" onClick={() => open(item)}><Pencil aria-hidden />แก้ไข{label}</Button></div></article>)}</div>}
    <Dialog open={Boolean(editing)} onOpenChange={open => { if (!open && !busy) setEditing(null); }}><DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto"><DialogHeader><DialogTitle>จัดการ{label}</DialogTitle><DialogDescription>อัปโหลดรูปและบันทึกเพื่อใช้งานในหน้าสร้างป้าย</DialogDescription></DialogHeader>{editing && <form onSubmit={save}><fieldset disabled={busy} className="grid gap-4"><div className="grid gap-1.5"><Label htmlFor={`${id}-name`}>ชื่อ{label}</Label><Input id={`${id}-name`} value={editing.name} maxLength={100} required onChange={e => patch({ name: e.target.value })} /></div>{kind === "skin" && <><div className="grid gap-1.5"><Label htmlFor={`${id}-hero`}>ฮีโร่</Label><Select value={editing.heroId} onValueChange={heroId => patch({ heroId })}><SelectTrigger id={`${id}-hero`}><SelectValue placeholder="เลือกฮีโร่" /></SelectTrigger><SelectContent>{heroes.map(h => <SelectItem key={h.id} value={h.id}>{h.name}{!h.active ? " (ซ่อนอยู่)" : ""}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-1.5"><Label htmlFor={`${id}-tier`}>ระดับสกิน</Label><Select value={editing.tier} onValueChange={tier => patch({ tier })}><SelectTrigger id={`${id}-tier`}><SelectValue /></SelectTrigger><SelectContent>{GAME_TIERS.mlbb.map(t => <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-1.5"><Label htmlFor={`${id}-label`}>ซีรีส์ / ป้ายกำกับ (ถ้ามี)</Label><Input id={`${id}-label`} value={editing.label} maxLength={80} onChange={e => patch({ label: e.target.value })} placeholder="เช่น Collector, StarLight" /></div></>}
    <div><p className="mb-2 text-xs font-medium">รูป{label}</p><div className="flex items-center gap-4"><div className="aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-2">{preview ? <img src={preview} alt={`ตัวอย่าง${label}`} className="size-full object-cover" /> : <div className="grid size-full place-items-center"><ImagePlus className="size-6 text-muted-foreground" aria-hidden /></div>}</div><div><input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" aria-label={`อัปโหลดรูป${label}`} disabled={!uploadReady || busy} onChange={e => { const selected = e.target.files?.[0]; if (selected) void upload(selected); }} /><Button variant="outline" size="sm" disabled={!uploadReady || busy} onClick={() => file.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}อัปโหลดรูป</Button><p className="mt-2 text-[11px] leading-5 text-muted-foreground">PNG / JPG / WEBP ไม่เกิน 8 MB<br />แนะนำภาพแนวตั้ง 3:4</p></div></div></div><label className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-3 text-sm">แสดงในคลังของผู้ใช้<input type="checkbox" checked={editing.active} onChange={e => patch({ active: e.target.checked })} className="size-4 accent-primary" /></label>{kind === "hero" && <p className="text-[11px] text-muted-foreground">ฮีโร่ใหม่จะแสดงในตัวเลือกเมื่อเพิ่มสกินให้แล้ว</p>}{error && <p role="alert" className="text-xs text-danger">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)}>ยกเลิก</Button><Button type="submit">{busy ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}{busy ? "กำลังทำงาน…" : "บันทึก"}</Button></div></fieldset></form>}</DialogContent></Dialog>
  </>;
}
