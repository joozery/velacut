"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Copy, ImageUp, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { copy } from "@/lib/copy";
import { formatBaht } from "@/lib/format";
import type { TopupTicket } from "@/lib/account";
import { topupStatusAction } from "@/app/actions/account";
import { useAccountStore } from "@/stores/account-store";
import { cn, fmt, hashString } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

const t = copy.topup;

/**
 * ภาพ QR "ตัวอย่าง" — ไม่ใช่ PromptPay payload จริง (สแกนแล้วไม่ได้อะไร)
 * TODO: สร้าง EMVCo payload จาก PromptPay ID ของร้าน + ticket.payAmount
 */
function SampleQr({ seed }: { seed: string }) {
  const n = 25;
  const h = hashString(seed);
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (hashString(`${h}:${x}:${y}`) % 100 < 46) cells.push([x, y]);
    }
  const Finder = ({ x, y }: { x: number; y: number }) => (
    <g>
      <rect x={x} y={y} width={7} height={7} rx={1.4} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} rx={1} fill="white" />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} fill="currentColor" />
    </g>
  );
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="size-full text-zinc-900" aria-hidden>
      <rect x={-1} y={-1} width={n + 2} height={n + 2} fill="white" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} rx={0.3} fill="currentColor" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={n - 7} y={0} />
      <Finder x={0} y={n - 7} />
    </svg>
  );
}

/** นับถอยหลังจากเวลาหมดอายุของคำสั่งที่ server กำหนด */
function useCountdown(expiresAt: string | undefined) {
  const calc = () => (expiresAt ? Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!expiresAt) return;
    const id = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);
  return left;
}

/** ถามสถานะคำสั่งทุก 5 วินาที — ผู้ดูแลยืนยันยอดแล้วจะปิดหน้าต่างและอัปเดตยอดให้ */
function usePaidWatcher(ticket: TopupTicket | null, onPaid: () => void) {
  const paidRef = useRef(onPaid);
  useEffect(() => { paidRef.current = onPaid; });
  useEffect(() => {
    if (!ticket) return;
    let stop = false;
    const id = setInterval(async () => {
      const r = await topupStatusAction(ticket.id).catch(() => null);
      if (stop || !r?.ok) return;
      if (r.data.status === "completed") {
        if (r.data.account) useAccountStore.getState().setAccount(r.data.account);
        toast({ title: "เติมเครดิตสำเร็จ", description: `ได้รับ ${ticket.coins.toLocaleString("th-TH")} เครดิต`, variant: "success" });
        paidRef.current();
      }
    }, 5000);
    return () => { stop = true; clearInterval(id); };
  }, [ticket]);
}

/** QR PromptPay จริงจาก payload (สร้างฝั่ง server) */
function RealQr({ payload }: { payload: string }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toString(payload, { type: "svg", errorCorrectionLevel: "M", margin: 0, color: { dark: "#111114", light: "#ffffff" } }).then((s) => alive && setSvg(s));
    return () => { alive = false; };
  }, [payload]);
  // svg สร้างจาก payload ของเราเอง (ไม่มีข้อมูลจากผู้ใช้) จึงฝังได้
  return svg ? <div aria-label="QR PromptPay" role="img" className="size-full [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="size-full animate-pulse rounded-lg bg-surface-2" />;
}

/** อัปโหลดสลิปเพื่อตรวจอัตโนมัติ (Slip2Go) */
function SlipUpload({ ticketId, onPaid, enabled }: { ticketId: string; onPaid: () => void; enabled: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const upload = async (file: File) => {
    if (busy || !enabled) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const body = new FormData();
      body.append("id", ticketId);
      body.append("file", file);
      const res = await fetch("/api/topup/slip", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "ตรวจสลิปไม่สำเร็จ");
      if (data.account) useAccountStore.getState().setAccount(data.account);
      toast({ title: "เติมเครดิตสำเร็จ", description: `ได้รับ ${Number(data.coins).toLocaleString("th-TH")} เครดิต`, variant: "success" });
      onPaid();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ตรวจสลิปไม่สำเร็จ");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <section className="flex h-full flex-col rounded-2xl border-2 border-primary/30 bg-primary-soft/40 p-4 sm:p-5" aria-label="อัปโหลดสลิปการโอน">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">2</span>
        <div><h3 className="text-base font-bold">โอนแล้ว? อัปโหลดสลิปที่นี่</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">ส่งรูปสลิปเพื่อตรวจสอบและรับเครดิต</p></div>
      </div>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || !enabled} className="sr-only" aria-label="เลือกรูปสลิป" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      <button type="button" disabled={busy || !enabled} onClick={() => ref.current?.click()} aria-label="เลือกรูปสลิปเพื่ออัปโหลด" className="group flex min-h-40 flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/35 bg-surface/80 p-5 text-center transition-colors hover:border-primary hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-52">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="สลิปที่เลือก" className="max-h-44 max-w-full rounded-lg border border-border object-contain" /> : <span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary"><ImageUp className="size-8" aria-hidden /></span>}
        <span className="text-sm font-semibold text-primary">{busy ? "กำลังตรวจสอบสลิป…" : preview ? "เลือกรูปสลิปใหม่" : "แตะเพื่อเลือกรูปสลิป"}</span>
        <span className="text-[11px] text-muted-foreground">JPG, PNG หรือ WEBP · ไม่เกิน 8 MB</span>
      </button>
      <Button size="lg" block className="mt-4 rounded-xl text-sm" disabled={busy || !enabled} onClick={() => ref.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}{busy ? "กำลังตรวจสลิป…" : preview ? "อัปโหลดสลิปใหม่" : "อัปโหลดสลิปการโอน"}</Button>
      <p role="status" className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />{enabled ? "เมื่อเลือกรูป ระบบจะส่งตรวจและเติมเครดิตเมื่อสลิปผ่าน" : "รายการนี้ยังไม่พร้อมรับสลิป กรุณาติดต่อผู้ดูแล"}</p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-xs leading-5 text-danger">{error}</p>}
    </section>
  );
}

export function QrDialog({ ticket, onClose, onRenew, slipEnabled }: { ticket: TopupTicket | null; onClose: () => void; onRenew: () => void; slipEnabled: boolean }) {
  const isWallet = ticket?.method === "truemoney_wallet";
  const open = !!ticket;
  const amount = ticket?.payAmount ?? 0;
  const coins = ticket?.coins ?? 0;
  const left = useCountdown(ticket?.expiresAt);
  usePaidWatcher(ticket, onClose);
  const expired = left === 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  const copyAmount = async () => {
    try {
      await navigator.clipboard.writeText(amount.toFixed(2));
      toast({ title: t.qrCopied, variant: "success" });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md sm:max-w-[760px]">
        <DialogHeader className="items-start pr-10 text-left">
          {isWallet ? <Image src="/images/payments/truemoney.webp" alt="TrueMoney Wallet" width={220} height={43} className="mb-1 h-7 w-auto" /> : <Image src="/images/payments/thai-qr.webp" alt="Thai QR Payment" width={791} height={240} className="mb-1 h-9 w-auto rounded-md" />}
          <DialogTitle>{isWallet ? t.walletTransfer.title : t.qrTitle}</DialogTitle>
          <DialogDescription>{isWallet ? t.walletTransfer.description : t.qrDesc}</DialogDescription>
        </DialogHeader>

        <div className="grid items-stretch gap-4 sm:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-2/35 p-4" aria-label="ข้อมูลการชำระเงิน">
            <div className="flex items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface text-sm font-bold text-primary ring-1 ring-border">1</span><h3 className="text-sm font-semibold">{isWallet ? "โอนเข้าเบอร์ Wallet" : "สแกน QR แล้วโอนเงิน"}</h3></div>
            {isWallet ? <div className="rounded-2xl border border-orange-300/40 bg-orange-50 p-4 text-center dark:bg-orange-400/10"><p className="text-xs text-muted-foreground">{t.walletTransfer.receiver}</p><p className="mt-2 text-2xl font-bold tabular-nums">{ticket?.walletMobile}</p><Button size="sm" variant="outline" className="mt-3" onClick={async () => { try { await navigator.clipboard.writeText(ticket?.walletMobile ?? ""); toast({ title: t.walletTransfer.copied, variant: "success" }); } catch {} }}><Copy aria-hidden />{t.walletTransfer.copy}</Button>{expired && <Button size="sm" className="mt-3 ml-2" onClick={onRenew}><RefreshCw aria-hidden />{t.qrRenew}</Button>}</div> : <div className="relative mx-auto w-48 sm:w-52">
              <div className={cn("aspect-square rounded-2xl border border-border bg-white p-3 shadow-soft", expired && "opacity-20 blur-[2px]")}>
                {ticket?.qrPayload ? <RealQr payload={ticket.qrPayload} /> : <SampleQr seed={amount.toFixed(2)} />}
              </div>
              {/* ป้ายกันสับสน: ยังไม่ตั้งพร้อมเพย์ร้าน → QR ตัวอย่างห้ามสแกนจ่าย */}
              {!ticket?.qrPayload && (
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[-8deg] bg-danger/90 py-1 text-center text-[11px] font-bold text-white shadow">
                  {t.qrSample}
                </span>
              )}
              {expired && (
                <Button size="sm" className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full" onClick={onRenew}>
                  <RefreshCw aria-hidden />
                  {t.qrRenew}
                </Button>
              )}
            </div>}

            {ticket?.payeeName && <p className="text-center text-xs text-muted-foreground">ชื่อบัญชี: <span className="font-semibold text-foreground">{ticket.payeeName}</span></p>}
            <div className="rounded-2xl bg-surface-2 p-4 text-center">
              <p className="text-xs text-muted-foreground">{t.qrAmount}</p>
              <p className="mt-0.5 text-3xl font-bold tabular-nums">฿{formatBaht(amount)}</p>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                = {coins.toLocaleString("th-TH")} {t.coins}
              </p>
              <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={copyAmount}>
                <Copy aria-hidden />
                {t.qrCopy}
              </Button>
            </div>

          </section>
          {ticket && <SlipUpload key={ticket.id} ticketId={ticket.id} onPaid={onClose} enabled={slipEnabled && Boolean(ticket.qrPayload || isWallet)} />}
        </div>

        <div className="flex items-center justify-between text-xs" aria-live="polite">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {t.qrWaiting}
          </span>
          <span className={cn("font-medium tabular-nums", expired ? "text-danger" : left < 120 ? "text-warning" : "text-muted-foreground")}>
            {expired ? t.qrExpired : fmt(t.qrExpires, { time: `${mm}:${ss}` })}
          </span>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">{slipEnabled ? "โอนให้ตรงยอดทุกหลักรวมเศษสตางค์ แล้วส่งรูปในช่องอัปโหลดสลิป" : t.qrNote}</p>
      </DialogContent>
    </Dialog>
  );
}
