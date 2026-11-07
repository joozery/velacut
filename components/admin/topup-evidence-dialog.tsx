/* eslint-disable @next/next/no-img-element -- Private slip images use the authenticated image endpoint directly. */
"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileImage, Loader2, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTopupEvidenceAction, type TopupEvidence } from "@/app/admin/evidence-actions";
import { formatBaht } from "@/lib/format";
import { StatusBadge, fieldClass, formatDateTime } from "./ui";

const labels = { checking: "กำลังตรวจสอบ", verified: "สลิปผ่านการตรวจ", rejected: "ตรวจสลิปไม่ผ่าน" };
const methods = { promptpay: "PromptPay", truemoney: "ซองอั่งเปา TrueMoney", truemoney_wallet: "TrueMoney Wallet" };

export function TopupEvidenceDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<TopupEvidence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");
  const [imageError, setImageError] = useState(false);
  const request = useRef(0);
  const [imageVersion, setImageVersion] = useState(0);
  async function load() {
    const current = ++request.current;
    setLoading(true); setError("");
    const result = await getTopupEvidenceAction(id).catch(() => null);
    if (current !== request.current) return;
    setLoading(false);
    if (!result?.ok) { setError(result?.error ?? "โหลดหลักฐานไม่สำเร็จ กรุณาลองใหม่"); return; }
    setData(result.data); setImageError(false); setImageVersion(v => v + 1);
  }
  const slip = data?.slips.find(row => row.id === selected) ?? data?.slips[0];
  return <Dialog open={open} onOpenChange={value => {
    setOpen(value);
    if (value) { setData(null); setSelected(""); void load(); }
    else { request.current++; setLoading(false); }
  }}>
    <DialogTrigger asChild><button type="button" className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"><FileImage className="size-3.5" aria-hidden />ดูหลักฐาน / ผลตรวจสลิป</button></DialogTrigger>
    <DialogContent className="no-scrollbar max-w-md gap-3 p-4 sm:max-w-[680px] sm:p-5">
      <DialogHeader><DialogTitle>หลักฐาน / ผลตรวจสลิป</DialogTitle><DialogDescription className="break-all font-mono text-[10px]">{id}</DialogDescription></DialogHeader>
      {loading && !data && <div role="status" className="flex min-h-44 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-5 animate-spin" aria-hidden />กำลังโหลดหลักฐาน…</div>}
      {error && <div role="alert" className="rounded-xl bg-danger-soft p-4 text-sm text-danger"><p>{error}</p><Button size="sm" variant="outline" className="mt-3" disabled={loading} onClick={() => void load()}>ลองใหม่</Button></div>}
      {data && <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/50 p-3"><div><p className="text-[10px] text-muted-foreground">{methods[data.method]} · ยอดชำระ</p><p className="mt-1 text-xl font-bold tabular-nums">฿{formatBaht(data.payAmount)}</p></div><div className="flex items-center gap-2"><StatusBadge status={data.status} reason={data.failReason} /><Button size="icon-sm" variant="ghost" aria-label="รีเฟรชหลักฐาน" disabled={loading} onClick={() => void load()}><RefreshCw className={loading ? "animate-spin" : ""} aria-hidden /></Button></div></div>
        {data.method === "truemoney" ? <div className="space-y-3 rounded-xl border border-border p-4"><h3 className="text-sm font-semibold">หลักฐานรับซองอั่งเปา</h3><p className="text-xs text-muted-foreground">บันทึกเมื่อ {formatDateTime(data.recordedAt)}</p>{data.voucherSuffix && <p className="text-xs">รหัสซอง <span className="font-mono">…{data.voucherSuffix}</span></p>}<p className="rounded-lg bg-surface-2 p-3 text-xs leading-6 text-muted-foreground">ช่องทางนี้ใช้ผลรับซองเข้าเบอร์ร้านเป็นหลักฐาน จึงไม่มีภาพสลิป</p></div> : !slip ? <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-5 text-center"><FileImage className="size-8 text-muted-foreground/60" aria-hidden /><p className="text-sm font-medium">ยังไม่มีภาพสลิปที่บันทึกไว้</p><p className="text-xs text-muted-foreground">เมื่อมีการส่งตรวจสลิป หลักฐานจะแสดงที่นี่</p></div> : <>
          {data.slips.length > 1 && <label className="grid gap-1.5 text-xs text-muted-foreground">ครั้งที่ส่งตรวจ<select aria-label="เลือกครั้งที่ส่งตรวจสลิป" value={slip.id} onChange={event => { setSelected(event.target.value); setImageError(false); }} className={`${fieldClass} w-full`}>{data.slips.map((row,index) => <option key={row.id} value={row.id}>{index === 0 ? "ล่าสุด · " : ""}{formatDateTime(row.date)} · {labels[row.status]}</option>)}</select></label>}
          <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"><div className="grid min-h-44 place-items-center overflow-hidden rounded-xl border border-border bg-surface-2 p-2">{imageError ? <p role="status" className="p-5 text-center text-xs text-muted-foreground">โหลดภาพไม่ได้ กรุณารีเฟรชหลักฐาน</p> : <img key={`${slip.id}-${imageVersion}`} src={`/api/admin/slips/${encodeURIComponent(slip.id)}`} alt={`สลิปการโอน ${id}`} onError={() => setImageError(true)} className="max-h-[52dvh] max-w-full rounded-lg object-contain" />}</div><div className="space-y-3 rounded-xl border border-border p-4"><div><p className="text-[10px] text-muted-foreground">ผลตรวจสลิป</p><p className={`mt-1 text-sm font-semibold ${slip.status === "rejected" ? "text-danger" : slip.status === "verified" ? "text-success" : "text-foreground"}`}>{labels[slip.status]}</p></div><p className="text-xs text-muted-foreground">ส่งเมื่อ {formatDateTime(slip.date)}</p>{slip.transRef && <div><p className="text-[10px] text-muted-foreground">เลขอ้างอิง</p><p className="mt-1 break-all font-mono text-xs">{slip.transRef}</p></div>}{slip.error && <p className="rounded-lg bg-danger-soft p-3 text-xs leading-5 text-danger">{slip.error}</p>}<a href={`/api/admin/slips/${encodeURIComponent(slip.id)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">เปิดภาพเต็ม<ExternalLink className="size-3" aria-hidden /></a><p className="border-t border-border pt-3 text-[10px] leading-5 text-muted-foreground">ผลตรวจสลิปแยกจากสถานะเติมเครดิตที่แสดงด้านบน</p></div></div>
        </>}
      </>}
    </DialogContent>
  </Dialog>;
}
