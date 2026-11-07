"use client";

import { useId, useState, useTransition } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import { adjustWalletAction, setAdminRoleAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function AdjustWalletForm({ userId }: { userId: string }) {
  const id = useId();
  const [sign, setSign] = useState<1 | -1>(1);
  const [bucket, setBucket] = useState<"transferable" | "bonus">("bonus");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const n = Number(amount);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!(n > 0)) return setError("กรุณาระบุจำนวนเครดิต");
    if (reason.trim().length < 3) return setError("กรุณาระบุเหตุผล");
    start(async () => {
      const r = await adjustWalletAction(userId, { bucket, coins: sign * n, reason }).catch(() => null);
      if (!r?.ok) {
        setError(r?.error ?? "ทำรายการไม่สำเร็จ");
        return;
      }
      toast({ title: sign > 0 ? `เพิ่ม ${n} เครดิตแล้ว` : `หัก ${n} เครดิตแล้ว`, variant: "success" });
      setAmount("");
      setReason("");
    });
  };
  const seg = (active: boolean) => cn("h-9 flex-1 rounded-lg text-xs font-medium transition-colors", active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground");
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3">
      <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="เพิ่มหรือหัก">
        <button type="button" role="radio" aria-checked={sign > 0} onClick={() => setSign(1)} className={seg(sign > 0)}><Plus className="mr-1 inline size-3.5" aria-hidden />เพิ่ม</button>
        <button type="button" role="radio" aria-checked={sign < 0} onClick={() => setSign(-1)} className={seg(sign < 0)}><Minus className="mr-1 inline size-3.5" aria-hidden />หัก</button>
      </div>
      <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="กระเป๋า">
        <button type="button" role="radio" aria-checked={bucket === "bonus"} onClick={() => setBucket("bonus")} className={seg(bucket === "bonus")}>โบนัส</button>
        <button type="button" role="radio" aria-checked={bucket === "transferable"} onClick={() => setBucket("transferable")} className={seg(bucket === "transferable")}>โอนได้</button>
      </div>
      <div className="grid gap-1.5"><Label htmlFor={`${id}-n`}>จำนวนเครดิต</Label><Input id={`${id}-n`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder="เช่น 10" /></div>
      <div className="grid gap-1.5"><Label htmlFor={`${id}-r`}>เหตุผล (ผู้ใช้จะเห็น)</Label><Textarea id={`${id}-r`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="เช่น ชดเชยการโอนที่ระบบตรวจไม่พบ" className="min-h-20" /></div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <Button type="submit" variant={sign < 0 ? "danger" : "primary"} disabled={pending}>{pending && <Loader2 className="animate-spin" aria-hidden />}{sign > 0 ? "เพิ่มเครดิต" : "หักเครดิต"}</Button>
    </form>
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
