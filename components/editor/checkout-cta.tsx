"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BRAND_NAME, copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import type { GameSlug } from "@/lib/games";
import { fmt } from "@/lib/utils";
import { toast } from "@/stores/toast-store";
import { useCheckout } from "./checkout-step";

const c = copy.editor.checkout;

/** ปุ่มขั้นสุดท้าย: คอยน์ไม่พอ → เติมคอยน์ / พอ → ยืนยันแล้วชำระ */
export function CheckoutCta({ game, disabled }: { game: GameSlug; disabled?: boolean }) {
  const k = useCheckout(game);
  const [open, setOpen] = useState(false);
  const free = k.output === "watermark";

  if (k.short > 0 && !free) {
    return (
      <Button asChild className="rounded-full px-5">
        <Link href="/topup">
          <Wallet aria-hidden />
          {c.topup}
        </Link>
      </Button>
    );
  }

  // Phase 4–5: เรียก server action ตัดคอยน์ใน transaction → render ภาพฝั่ง server → ดาวน์โหลด
  const confirm = () => {
    setOpen(false);
    toast({ title: c.notReady, description: c.notReadyDesc });
  };

  return (
    <>
      <Button className="rounded-full px-5" disabled={disabled} onClick={() => setOpen(true)}>
        <Download aria-hidden />
        {free ? c.payFree : c.payClean}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{free ? c.confirmFreeTitle : c.confirmTitle}</DialogTitle>
            <DialogDescription>
              {free ? fmt(c.confirmFreeDesc, { brand: BRAND_NAME }) : fmt(c.confirmDesc, { n: formatCoinsFixed(k.total) })}
            </DialogDescription>
          </DialogHeader>
          {!free && (
            <dl className="grid gap-1.5 rounded-2xl bg-surface-2 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">{c.balance}</dt><dd className="tabular-nums">{formatCoinsFixed(k.balance)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{c.total}</dt><dd className="tabular-nums">−{formatCoinsFixed(k.total)}</dd></div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><dt>{c.after}</dt><dd className="tabular-nums">{formatCoinsFixed(k.after)}</dd></div>
            </dl>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{copy.common.cancel}</Button>
            </DialogClose>
            <Button onClick={confirm}>{c.confirm}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
