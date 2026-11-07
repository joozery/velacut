"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { CheckCircle2, Copy, ImageUp, Loader2, RefreshCw } from "lucide-react";
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
function SlipUpload({ ticketId, onPaid }: { ticketId: string; onPaid: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const upload = async (file: File) => {
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
    <div className="rounded-2xl border border-dashed border-primary/40 bg-primary-soft/30 p-3">
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="เลือกรูปสลิป" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {preview ? <img src={preview} alt="สลิปที่เลือก" className="h-14 w-10 shrink-0 rounded-md border border-border object-cover" /> : <span className="grid h-14 w-10 shrink-0 place-items-center rounded-md bg-surface text-primary"><ImageUp className="size-5" aria-hidden /></span>}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">โอนแล้ว? อัปโหลดสลิป</p>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">ระบบตรวจสลิปและเติมเครดิตให้อัตโนมัติ</p>
        </div>
        <Button size="sm" className="shrink-0 rounded-lg" disabled={busy} onClick={() => ref.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <CheckCircle2 aria-hidden />}{busy ? "กำลังตรวจ…" : "เลือกสลิป"}</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
    </div>
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
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center pr-0 text-center">
          {isWallet ? <Image src="/images/payments/truemoney.webp" alt="TrueMoney Wallet" width={220} height={43} className="mb-1 h-7 w-auto" /> : <Image src="/images/payments/thai-qr.webp" alt="Thai QR Payment" width={791} height={240} className="mb-1 h-9 w-auto rounded-md" />}
          <DialogTitle>{isWallet ? t.walletTransfer.title : t.qrTitle}</DialogTitle>
          <DialogDescription>{isWallet ? t.walletTransfer.description : t.qrDesc}</DialogDescription>
        </DialogHeader>

        {isWallet ? <div className="rounded-2xl border border-orange-300/40 bg-orange-50 p-4 text-center dark:bg-orange-400/10"><p className="text-xs text-muted-foreground">{t.walletTransfer.receiver}</p><p className="mt-2 text-2xl font-bold tabular-nums">{ticket?.walletMobile}</p><Button size="sm" variant="outline" className="mt-3" onClick={async () => { try { await navigator.clipboard.writeText(ticket?.walletMobile ?? ""); toast({ title: t.walletTransfer.copied, variant: "success" }); } catch {} }}><Copy aria-hidden />{t.walletTransfer.copy}</Button>{expired && <Button size="sm" className="mt-3 ml-2" onClick={onRenew}><RefreshCw aria-hidden />{t.qrRenew}</Button>}</div> : <div className="relative mx-auto w-56">
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

        {ticket?.payeeName && <p className="-mt-2 text-center text-xs text-muted-foreground">ชื่อบัญชี: <span className="font-semibold text-foreground">{ticket.payeeName}</span></p>}
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

        {slipEnabled && ticket && (ticket.qrPayload || isWallet) && <SlipUpload ticketId={ticket.id} onPaid={onClose} />}

        <div className="flex items-center justify-between text-xs" aria-live="polite">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {t.qrWaiting}
          </span>
          <span className={cn("font-medium tabular-nums", expired ? "text-danger" : left < 120 ? "text-warning" : "text-muted-foreground")}>
            {expired ? t.qrExpired : fmt(t.qrExpires, { time: `${mm}:${ss}` })}
          </span>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">{slipEnabled ? "โอนให้ตรงยอดทุกหลักรวมเศษสตางค์ แล้วอัปโหลดสลิปด้านบน" : t.qrNote}</p>
      </DialogContent>
    </Dialog>
  );
}
