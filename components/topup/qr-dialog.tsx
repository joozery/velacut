"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UiIcon } from "@/components/icons/ui-icon";
import { copy } from "@/lib/copy";
import { formatBaht } from "@/lib/format";
import { QR_TTL_MIN } from "@/lib/topup";
import { cn, fmt, hashString } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

const t = copy.topup;

/**
 * ภาพ QR "ตัวอย่าง" — ไม่ใช่ PromptPay payload จริง (สแกนแล้วไม่ได้อะไร)
 * Phase 4: สร้าง EMVCo payload ฝั่ง server จาก PromptPay ID ของร้าน + uniqueAmount
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

function useCountdown(open: boolean, key: number) {
  const [left, setLeft] = useState(QR_TTL_MIN * 60);
  useEffect(() => {
    if (!open) return;
    setLeft(QR_TTL_MIN * 60);
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [open, key]);
  return left;
}

export function QrDialog({
  open,
  onOpenChange,
  amount,
  coins,
  onRenew,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  coins: number;
  onRenew: () => void;
}) {
  const left = useCountdown(open, amount);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="items-center pr-0 text-center">
          <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
            <UiIcon name="qr-code" className="size-7" />
          </span>
          <DialogTitle>{t.qrTitle}</DialogTitle>
          <DialogDescription>{t.qrDesc}</DialogDescription>
        </DialogHeader>

        <div className="relative mx-auto w-56">
          <div className={cn("aspect-square rounded-2xl border border-border bg-white p-3 shadow-soft", expired && "opacity-20 blur-[2px]")}>
            <SampleQr seed={amount.toFixed(2)} />
          </div>
          {/* ป้ายกันสับสน: QR ตัวอย่างห้ามสแกนจ่าย */}
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[-8deg] bg-danger/90 py-1 text-center text-[11px] font-bold text-white shadow">
            {t.qrSample}
          </span>
          {expired && (
            <Button size="sm" className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full" onClick={onRenew}>
              <RefreshCw aria-hidden />
              {t.qrRenew}
            </Button>
          )}
        </div>

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

        <div className="flex items-center justify-between text-xs" aria-live="polite">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            {t.qrWaiting}
          </span>
          <span className={cn("font-medium tabular-nums", expired ? "text-danger" : left < 120 ? "text-warning" : "text-muted-foreground")}>
            {expired ? t.qrExpired : fmt(t.qrExpires, { time: `${mm}:${ss}` })}
          </span>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">{t.qrNote}</p>
      </DialogContent>
    </Dialog>
  );
}
