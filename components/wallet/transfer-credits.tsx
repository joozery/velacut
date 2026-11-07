"use client";

import { useId, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { transferAction } from "@/app/actions/account";
import { useAccountStore } from "@/stores/account-store";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { fmt } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

const tr = copy.topup.transfer;

function TransferDialog({ max, onClose }: { max: number; onClose: () => void }) {
  const id = useId();
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const n = Number(amount);
  const recipient = email.trim().toLowerCase();
  const self = recipient === session?.user?.email?.trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) && !self;
  const amountOk = /^\d+(?:\.\d{1,2})?$/.test(amount) && Number.isFinite(n) && n >= 1 && n <= max;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setTouched(true); setError("");
    if (lock.current || !emailOk) return;
    if (!amountOk) {
      if (review) setError(fmt(tr.amountError, { n: formatCoinsFixed(max) }));
      return;
    }
    if (!review) { setReview(true); return; }
    lock.current = true; setBusy(true);
    try {
      const result = await transferAction(recipient, n).catch(() => null);
      if (!result?.ok) { setError(result?.error ?? "ยังยืนยันผลการโอนไม่ได้ กรุณาตรวจสอบประวัติรายการก่อนลองใหม่"); return; }
      useAccountStore.getState().setAccount(result.data.account);
      toast({ title: tr.done, description: fmt(tr.doneDesc, { n: formatCoinsFixed(n), email: recipient }), variant: "success" });
      router.refresh();
      onClose();
    } finally { lock.current = false; setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !lock.current) onClose(); }}><DialogContent className="max-w-md" onEscapeKeyDown={event => { if (lock.current) event.preventDefault(); }} onPointerDownOutside={event => { if (lock.current) event.preventDefault(); }}><form onSubmit={submit} noValidate className="grid gap-4"><DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="size-5 text-primary" aria-hidden />{tr.title}</DialogTitle><DialogDescription>{fmt(tr.description, { n: formatCoinsFixed(max) })}</DialogDescription></DialogHeader>
    {!review ? <fieldset disabled={busy} className="grid gap-4"><div className="grid gap-1.5"><Label htmlFor={`${id}-email`}>{tr.email}</Label><Input id={`${id}-email`} type="email" autoComplete="off" placeholder={tr.emailPlaceholder} value={email} onChange={event => { setEmail(event.target.value); }} aria-invalid={touched && !emailOk} aria-describedby={touched && !emailOk ? `${id}-email-error` : `${id}-email-hint`} /><p id={`${id}-email-hint`} className="text-[11px] text-muted-foreground">ใช้อีเมลที่เพื่อนสมัครบัญชีไว้กับเว็บ</p>{touched && !emailOk && <p id={`${id}-email-error`} className="text-xs text-danger">{self ? "โอนให้ตัวเองไม่ได้" : tr.emailError}</p>}</div><div className="grid gap-1.5"><Label htmlFor={`${id}-amount`}>{tr.amount}</Label><Input id={`${id}-amount`} inputMode="decimal" value={amount} onChange={event => { setAmount(event.target.value.replace(/[^\d.]/g, "")); }} aria-invalid={touched && !amountOk} aria-describedby={`${id}-amount-hint`} /><p id={`${id}-amount-hint`} className={`text-[11px] ${touched && !amountOk ? "text-danger" : "text-muted-foreground"}`}>{fmt(tr.amountError, { n: formatCoinsFixed(max) })}</p></div></fieldset> : <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-4"><p className="text-xs text-muted-foreground">ตรวจสอบรายการโอน</p><p className="mt-3 text-3xl font-bold tabular-nums">{formatCoinsFixed(n)} <span className="text-sm font-normal">เครดิต</span></p><p className="mt-3 break-all text-sm font-medium">ผู้รับ: {recipient}</p><p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">เครดิตที่โอนได้คงเหลือหลังโอน <span className="font-semibold text-foreground tabular-nums">{formatCoinsFixed(Math.max(0, max - n))}</span></p></div>}
    {error && <p role="alert" className="text-xs leading-5 text-danger">{error}</p>}
    <DialogFooter><Button variant="outline" disabled={busy} onClick={() => review ? setReview(false) : onClose()}>{review ? "แก้ไขรายการ" : copy.common.cancel}</Button><Button type="submit" disabled={busy}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : review ? <Send aria-hidden /> : <ArrowRight aria-hidden />}{busy ? "กำลังโอน…" : review ? fmt(tr.confirm, { n: formatCoinsFixed(n) }) : "ตรวจสอบรายการ"}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}

export function TransferCreditsButton({ available }: { available: number }) {
  const [open, setOpen] = useState(false);
  return <><Button variant="outline" size="sm" disabled={available < 1} title={available < 1 ? "ต้องมีเครดิตที่โอนได้อย่างน้อย 1 เครดิต" : undefined} onClick={() => setOpen(true)} className="rounded-xl"><Send className="size-4" aria-hidden />{copy.topup.wallet.transfer}</Button>{open && <TransferDialog max={available} onClose={() => setOpen(false)} />}</>;
}
