"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBaht, formatCoinsFixed } from "@/lib/format";
import { toast } from "@/stores/toast-store";
import { confirmTopupAction, rejectTopupAction } from "@/app/admin/actions";

type Props = { id: string; email: string; payAmount: number; coins: number; expired: boolean };

/** ปุ่มยืนยัน / ปฏิเสธคำสั่งเติม — ต้องกดยืนยันใน dialog ที่แสดงยอดโอนอีกครั้ง */
export function TopupActions({ id, email, payAmount, coins, expired }: Props) {
  const [mode, setMode] = useState<"confirm" | "reject" | null>(null);
  const [pending, start] = useTransition();
  const run = () => start(async () => {
    const r = await (mode === "confirm" ? confirmTopupAction(id) : rejectTopupAction(id)).catch(() => null);
    if (!r?.ok) {
      toast({ title: r?.error ?? "ทำรายการไม่สำเร็จ", variant: "error" });
      return;
    }
    toast({ title: mode === "confirm" ? "ยืนยันยอดแล้ว" : "ปฏิเสธคำสั่งแล้ว", description: mode === "confirm" ? `เพิ่ม ${formatCoinsFixed(coins)} เครดิตให้ ${email}` : id, variant: "success" });
    setMode(null);
  });
  return (
    <>
      <div className="flex justify-end gap-1.5">
        <Button size="sm" className="h-8 rounded-lg px-2.5 text-xs" onClick={() => setMode("confirm")}><Check aria-hidden />ยืนยันยอด</Button>
        {!expired && <Button size="sm" variant="outline" className="h-8 rounded-lg px-2.5 text-xs" onClick={() => setMode("reject")}><X aria-hidden />ปฏิเสธ</Button>}
      </div>
      <Dialog open={!!mode} onOpenChange={(o) => !pending && !o && setMode(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{mode === "confirm" ? "ยืนยันว่าได้รับเงินแล้ว?" : "ปฏิเสธคำสั่งนี้?"}</DialogTitle>
            <DialogDescription>{mode === "confirm" ? "ตรวจยอดในบัญชีธนาคารให้ตรงทุกหลักก่อนยืนยัน — ยืนยันแล้วยกเลิกไม่ได้" : "ใช้เมื่อตรวจไม่พบยอดโอน ผู้ใช้จะเห็นรายการนี้เป็น \"ไม่สำเร็จ\""}</DialogDescription>
          </DialogHeader>
          <dl className="grid gap-2 rounded-2xl bg-surface-2 p-4 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">ยอดโอน</dt><dd className="text-lg font-bold tabular-nums">฿{formatBaht(payAmount)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">ผู้ใช้</dt><dd className="truncate">{email}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">เครดิตที่จะได้</dt><dd className="tabular-nums">{formatCoinsFixed(coins)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">เลขอ้างอิง</dt><dd className="font-mono text-xs">{id}</dd></div>
          </dl>
          {expired && mode === "confirm" && <p className="text-xs text-amber-700 dark:text-amber-300">คำสั่งนี้หมดอายุแล้ว ยืนยันได้ถ้าได้รับเงินจริง</p>}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={pending}>ยกเลิก</Button></DialogClose>
            <Button variant={mode === "reject" ? "danger" : "primary"} disabled={pending} onClick={run}>{pending && <Loader2 className="animate-spin" aria-hidden />}{mode === "confirm" ? "ยืนยันยอด" : "ปฏิเสธ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
