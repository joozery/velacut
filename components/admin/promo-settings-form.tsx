"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { ImageUp, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromoBarButton, PromoCard } from "@/components/layout/announcement-bar";
import { promoActive, type PromoAutoOpen, type PromoConfig } from "@/lib/promo";
import { toast } from "@/stores/toast-store";
import { savePromoAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

/** ISO → ค่าสำหรับ <input type="datetime-local"> ตามเวลาเครื่องผู้ใช้ */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring", checked ? "bg-primary" : "bg-surface-3")}>
      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

function Field({ label, hint, children, id }: { label: string; hint?: string; children: React.ReactNode; id: string }) {
  return <div className="grid gap-1.5"><Label htmlFor={id} className="text-xs">{label}</Label>{children}{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>;
}

const AUTO_OPEN: [PromoAutoOpen, string][] = [["off", "ไม่เด้งอัตโนมัติ (กดจากแถบประกาศ)"], ["once", "เด้งครั้งเดียวต่อผู้ใช้"], ["always", "เด้งทุกครั้งที่เปิดเว็บ"]];

export function PromoSettingsForm({ initial, uploadReady }: { initial: PromoConfig; uploadReady: boolean }) {
  const id = useId();
  const [saved, setSaved] = useState<PromoConfig>(initial);
  const [p, setP] = useState<PromoConfig>(initial);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = useMemo(() => JSON.stringify(p) !== JSON.stringify(saved), [p, saved]);
  const set = <K extends keyof PromoConfig>(k: K, v: PromoConfig[K]) => setP((x) => ({ ...x, [k]: v }));
  const live = promoActive(p);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", "promo");
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      set("image", data.url);
      toast({ title: "อัปโหลดรูปแล้ว", description: `${data.width}×${data.height} px · กดบันทึกเพื่อใช้งาน`, variant: "success" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = () => start(async () => {
    setError("");
    const r = await savePromoAction(p).catch(() => null);
    if (!r?.ok) {
      setError(r?.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(r.data);
    setP(r.data);
    toast({ title: "บันทึกโปรโมชันแล้ว", description: "หน้าเว็บใช้ค่าใหม่ทันที", variant: "success" });
  });

  return (
    <div className="grid gap-4 pb-24 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid content-start gap-4">
        <Card className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold">เปิดใช้โปรโมชัน</h2>
            <p className="mt-1 text-xs text-muted-foreground">{!p.enabled ? "ปิดอยู่ — ไม่แสดงแถบประกาศและ modal" : live ? "กำลังแสดงบนหน้าเว็บ" : "เปิดอยู่ แต่อยู่นอกช่วงวันที่กำหนด — ยังไม่แสดง"}</p>
          </div>
          <Switch checked={p.enabled} onChange={(v) => set("enabled", v)} label="เปิดใช้โปรโมชัน" />
        </Card>

        <Card className="grid gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">แถบประกาศด้านบน</h2>
          <Field id={`${id}-bar`} label="ข้อความ" hint={`${p.barText.length}/120`}><Input id={`${id}-bar`} value={p.barText} maxLength={120} onChange={(e) => set("barText", e.target.value)} /></Field>
          <Field id={`${id}-more`} label="ข้อความลิงก์"><Input id={`${id}-more`} value={p.barLinkLabel} maxLength={30} onChange={(e) => set("barLinkLabel", e.target.value)} className="max-w-xs" /></Field>
        </Card>

        <Card className="grid gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Modal โปรโมชัน</h2>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium">รูปโปรโมชัน</span>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="size-20 shrink-0 rounded-xl border border-border bg-surface-2 object-contain" />
              <div className="grid gap-1.5">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="sr-only" id={`${id}-file`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
                <Button variant="outline" size="sm" className="w-fit rounded-lg" disabled={uploading || !uploadReady} onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}{uploading ? "กำลังอัปโหลด…" : "อัปโหลดรูปใหม่"}</Button>
                {uploadReady ? <p className="text-[11px] text-muted-foreground">PNG / JPG / WEBP ไม่เกิน 8 MB · แนะนำสี่เหลี่ยมจัตุรัส 1080×1080 · ระบบแปลงเป็น WEBP แล้วเก็บที่ Cloudflare R2</p> : <p role="status" className="text-[11px] text-danger">ยังไม่ได้ตั้งค่า Cloudflare R2 (R2_* ใน env) — อัปโหลดรูปไม่ได้</p>}
              </div>
            </div>
          </div>
          <Field id={`${id}-alt`} label="คำอธิบายรูป (สำหรับโปรแกรมอ่านหน้าจอ)"><Textarea id={`${id}-alt`} value={p.imageAlt} maxLength={200} onChange={(e) => set("imageAlt", e.target.value)} className="min-h-16" /></Field>
          <Field id={`${id}-title`} label="หัวข้อ"><Input id={`${id}-title`} value={p.title} maxLength={80} onChange={(e) => set("title", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${id}-cta`} label="ข้อความปุ่ม"><Input id={`${id}-cta`} value={p.ctaLabel} maxLength={40} onChange={(e) => set("ctaLabel", e.target.value)} /></Field>
            <Field id={`${id}-href`} label="ลิงก์ปุ่ม" hint="หน้าในเว็บ เช่น /topup, /generate/mlbb"><Input id={`${id}-href`} value={p.ctaHref} maxLength={200} onChange={(e) => set("ctaHref", e.target.value)} /></Field>
          </div>
          <Field id={`${id}-note`} label="หมายเหตุใต้ปุ่ม (ไม่บังคับ)"><Input id={`${id}-note`} value={p.note} maxLength={200} onChange={(e) => set("note", e.target.value)} /></Field>
        </Card>

        <Card className="grid gap-4 p-4 sm:p-5">
          <h2 className="text-sm font-semibold">การแสดงผล</h2>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium">เด้ง modal อัตโนมัติ</span>
            <Select value={p.autoOpen} onValueChange={(v) => set("autoOpen", v as PromoAutoOpen)}>
              <SelectTrigger aria-label="เด้ง modal อัตโนมัติ" className="h-10 w-full rounded-xl sm:max-w-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{AUTO_OPEN.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">&quot;ครั้งเดียวต่อผู้ใช้&quot; — บันทึกโปรใหม่เมื่อไร ผู้ใช้จะเห็น modal อีกครั้ง</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${id}-start`} label="เริ่มแสดง (ว่าง = ทันที)"><div className="flex gap-1.5"><Input id={`${id}-start`} type="datetime-local" value={toLocalInput(p.startsAt)} onChange={(e) => set("startsAt", fromLocalInput(e.target.value))} />{p.startsAt && <Button variant="ghost" size="icon" aria-label="ล้างวันเริ่ม" onClick={() => set("startsAt", null)}><X aria-hidden /></Button>}</div></Field>
            <Field id={`${id}-end`} label="สิ้นสุด (ว่าง = ไม่มีกำหนด)"><div className="flex gap-1.5"><Input id={`${id}-end`} type="datetime-local" value={toLocalInput(p.endsAt)} onChange={(e) => set("endsAt", fromLocalInput(e.target.value))} />{p.endsAt && <Button variant="ghost" size="icon" aria-label="ล้างวันสิ้นสุด" onClick={() => set("endsAt", null)}><X aria-hidden /></Button>}</div></Field>
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">ตัวอย่าง</p>
          <div className="bg-ink text-white"><PromoBarButton promo={p} /></div>
          <div className="bg-[var(--overlay)] p-5">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-lg"><PromoCard promo={{ ...p, ctaHref: "#" }} /></div>
          </div>
        </Card>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur lg:left-[240px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
          <p className={cn("mr-auto text-xs", error ? "text-danger" : "text-muted-foreground")} role={error ? "alert" : "status"}>{error || (dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : "ค่าตรงกับที่บันทึกไว้")}</p>
          <Button variant="outline" size="sm" disabled={pending || !dirty} onClick={() => { setP(saved); setError(""); }}>ยกเลิกการแก้ไข</Button>
          <Button size="sm" disabled={pending || uploading || !dirty} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึก</Button>
        </div>
      </div>
    </div>
  );
}
