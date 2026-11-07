"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Coins, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCoinsFixed } from "@/lib/format";
import { toast } from "@/stores/toast-store";
import { UserAvatar } from "./user-badges";
import { adjustWalletAction, setAdminRoleAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

type Wallet = { transferable: number; bonus: number; balance: number };

const QUICK = [5, 10, 20, 50, 100];
const REASONS: Record<1 | -1, string[]> = {
  1: ["ชดเชยการโอนที่ระบบตรวจไม่พบ", "โบนัสพิเศษจากทีมงาน", "คืนเครดิตป้ายที่มีปัญหา", "เติมเครดิตผ่านแอดมิน"],
  [-1]: ["แก้ไขยอดที่เพิ่มผิด", "ยกเลิกรายการเติมเครดิต"],
};

/** เพิ่ม/หักเครดิตให้ผู้ใช้ — บันทึกเป็นรายการ "ปรับยอด" พร้อมเหตุผลในประวัติผู้ใช้ */
export function AdjustWalletForm({ userId, wallet, onDone }: { userId: string; wallet?: Wallet; onDone?: () => void }) {
  const id = useId();
  const router = useRouter();
  const [sign, setSign] = useState<1 | -1>(1);
  const [bucket, setBucket] = useState<"transferable" | "bonus">("bonus");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const n = Number(amount);
  const valid = n > 0 && Math.round(n * 100) === n * 100;
  const current = wallet ? wallet[bucket] : null;
  const after = current === null ? null : current + sign * (valid ? n : 0);
  const short = after !== null && after < 0;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!valid) return setError("กรุณาระบุจำนวนเครดิต (ทศนิยมไม่เกิน 2 ตำแหน่ง)");
    if (short) return setError("ยอดในกระเป๋านี้ไม่พอให้หัก");
    if (reason.trim().length < 3) return setError("กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร");
    start(async () => {
      const r = await adjustWalletAction(userId, { bucket, coins: sign * n, reason }).catch(() => null);
      if (!r?.ok) {
        setError(r?.error ?? "ทำรายการไม่สำเร็จ");
        return;
      }
      toast({ title: sign > 0 ? `เพิ่ม ${formatCoinsFixed(n)} เครดิตแล้ว` : `หัก ${formatCoinsFixed(n)} เครดิตแล้ว`, description: `กระเป๋า${bucket === "bonus" ? "โบนัส" : "โอนได้"} · ผู้ใช้เห็นในประวัติพร้อมเหตุผล`, variant: "success" });
      setAmount("");
      setReason("");
      router.refresh();
      onDone?.();
    });
  };
  const seg = (active: boolean) => cn("h-9 flex-1 rounded-lg text-xs font-medium transition-colors", active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground");
  const chip = (active: boolean) => cn("h-8 rounded-lg border px-2.5 text-xs font-medium tabular-nums transition-colors", active ? "border-primary bg-primary-soft text-primary" : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground");
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3">
      <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="เพิ่มหรือหัก">
        <button type="button" role="radio" aria-checked={sign > 0} onClick={() => setSign(1)} className={seg(sign > 0)}><Plus className="mr-1 inline size-3.5" aria-hidden />เพิ่ม</button>
        <button type="button" role="radio" aria-checked={sign < 0} onClick={() => setSign(-1)} className={seg(sign < 0)}><Minus className="mr-1 inline size-3.5" aria-hidden />หัก</button>
      </div>
      <div className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">กระเป๋า</span>
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="กระเป๋า">
          <button type="button" role="radio" aria-checked={bucket === "bonus"} onClick={() => setBucket("bonus")} className={seg(bucket === "bonus")} title="ใช้สร้างป้ายได้ โอนต่อไม่ได้">โบนัส{wallet && <span className="ml-1 text-muted-foreground tabular-nums">({formatCoinsFixed(wallet.bonus)})</span>}</button>
          <button type="button" role="radio" aria-checked={bucket === "transferable"} onClick={() => setBucket("transferable")} className={seg(bucket === "transferable")} title="เครดิตปกติแบบเดียวกับที่ผู้ใช้เติมเงิน">โอนได้{wallet && <span className="ml-1 text-muted-foreground tabular-nums">({formatCoinsFixed(wallet.transferable)})</span>}</button>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-n`}>จำนวนเครดิต</Label>
        <Input id={`${id}-n`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="เช่น 10" />
        <div className="flex flex-wrap gap-1.5">{QUICK.map((q) => <button key={q} type="button" onClick={() => setAmount(String(q))} className={chip(n === q)}>{sign > 0 ? "+" : "−"}{q}</button>)}</div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-r`}>เหตุผล (ผู้ใช้จะเห็น)</Label>
        <Textarea id={`${id}-r`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="เช่น ชดเชยการโอนที่ระบบตรวจไม่พบ" className="min-h-16" />
        <div className="flex flex-wrap gap-1.5">{REASONS[sign].map((r) => <button key={r} type="button" onClick={() => setReason(r)} className={chip(reason === r)}>{r}</button>)}</div>
      </div>
      {after !== null && current !== null && (
        <dl className="grid gap-1 rounded-xl bg-surface-2/70 p-3 text-xs">
          <div className="flex justify-between"><dt className="text-muted-foreground">ยอด{bucket === "bonus" ? "โบนัส" : "โอนได้"}ตอนนี้</dt><dd className="tabular-nums">{formatCoinsFixed(current)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">{sign > 0 ? "เพิ่ม" : "หัก"}</dt><dd className={cn("tabular-nums", sign > 0 ? "text-success" : "text-danger")}>{sign > 0 ? "+" : "−"}{formatCoinsFixed(valid ? n : 0)}</dd></div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold"><dt>หลังทำรายการ</dt><dd className={cn("tabular-nums", short && "text-danger")}>{formatCoinsFixed(after)}</dd></div>
        </dl>
      )}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <Button type="submit" variant={sign < 0 ? "danger" : "primary"} disabled={pending || short}>{pending && <Loader2 className="animate-spin" aria-hidden />}{sign > 0 ? `เพิ่ม${valid ? ` ${formatCoinsFixed(n)}` : ""} เครดิต` : `หัก${valid ? ` ${formatCoinsFixed(n)}` : ""} เครดิต`}</Button>
    </form>
  );
}

/** ปุ่มในรายชื่อผู้ใช้ → เปิดหน้าต่างเพิ่ม/หักเครดิตโดยไม่ต้องเข้าหน้ารายละเอียด */
export function AdjustWalletDialog({ user, compact }: { user: { id: string; name: string; email: string; image?: string | null } & Wallet; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact
          ? <button type="button" aria-label={`เพิ่ม/หักเครดิต ${user.name}`} title="เพิ่ม/หักเครดิต" className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary"><Coins className="size-4" aria-hidden /></button>
          : <Button size="sm" variant="soft" className="h-8 rounded-lg text-xs"><Coins aria-hidden />เพิ่มเครดิต</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ปรับยอดเครดิต</DialogTitle>
          <DialogDescription className="flex items-center gap-2"><UserAvatar name={user.name} image={user.image ?? null} className="size-6 text-[10px]" /><span className="min-w-0 truncate">{user.name} · {user.email}</span></DialogDescription>
        </DialogHeader>
        <AdjustWalletForm userId={user.id} wallet={user} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function AdminRoleToggle({ userId, roleAdmin, fromEnv, self }: { userId: string; roleAdmin: boolean; fromEnv: boolean; self: boolean }) {
  const [pending, start] = useTransition();
  if (fromEnv) return <span className="text-xs text-muted-foreground">แอดมิน (กำหนดใน ADMIN_EMAILS)</span>;
  const toggle = () => start(async () => {
    const r = await setAdminRoleAction(userId, !roleAdmin).catch(() => null);
    if (!r?.ok) {
      toast({ title: r?.error ?? "ทำรายการไม่สำเร็จ", variant: "error" });
      return;
    }
    toast({ title: roleAdmin ? "ถอดสิทธิ์แอดมินแล้ว" : "ให้สิทธิ์แอดมินแล้ว", variant: "success" });
  });
  return (
    <Button size="sm" variant={roleAdmin ? "outline" : "soft"} className="h-8 rounded-lg text-xs" disabled={pending || (self && roleAdmin)} onClick={toggle}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}{roleAdmin ? "ถอดสิทธิ์แอดมิน" : "ให้สิทธิ์แอดมิน"}
    </Button>
  );
}
