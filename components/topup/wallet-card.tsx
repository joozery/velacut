"use client";

import { useAccountStore, useWallet } from "@/stores/account-store";
import { transferAction } from "@/app/actions/account";
import { useId, useState } from "react";
import Link from "next/link";
import { History, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { UiIcon } from "@/components/icons/ui-icon";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { fmt } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

const w = copy.topup.wallet;
const tr = copy.topup.transfer;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function TransferDialog({ open, onOpenChange, max }: { open: boolean; onOpenChange: (o: boolean) => void; max: number }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const n = Number(amount);
  const emailOk = EMAIL_RE.test(email.trim());
  const amountOk = Number.isFinite(n) && n > 0 && n <= max;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailOk || !amountOk || busy) return;
    setBusy(true);
    setError("");
    const r = await transferAction(email.trim(), Math.round(n * 100) / 100).catch(() => null);
    setBusy(false);
    if (!r?.ok) return setError(r?.error ?? "โอนไม่สำเร็จ กรุณาลองใหม่");
    useAccountStore.getState().setAccount(r.data.account);
    toast({ title: tr.done, description: tr.doneDesc, variant: "success" });
    onOpenChange(false);
    setEmail("");
    setAmount("");
    setTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{tr.title}</DialogTitle>
            <DialogDescription>{fmt(tr.description, { n: formatCoinsFixed(max) })}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-email`}>{tr.email}</Label>
            <Input
              id={`${id}-email`}
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr.emailPlaceholder}
              aria-invalid={touched && !emailOk}
              aria-describedby={touched && !emailOk ? `${id}-email-err` : undefined}
            />
            {touched && !emailOk && <p id={`${id}-email-err`} className="text-xs text-danger">{tr.emailError}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-amount`}>{tr.amount}</Label>
            <Input
              id={`${id}-amount`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              aria-invalid={touched && !amountOk}
              aria-describedby={touched && !amountOk ? `${id}-amount-err` : undefined}
            />
            {touched && !amountOk && <p id={`${id}-amount-err`} className="text-xs text-danger">{fmt(tr.amountError, { n: formatCoinsFixed(max) })}</p>}
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={busy}>{copy.common.cancel}</Button>
            </DialogClose>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" aria-hidden />}{amountOk ? fmt(tr.confirm, { n: formatCoinsFixed(n) }) : w.transfer}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** ยอดเครดิตปัจจุบันและทางลัดจัดการกระเป๋า */
export function WalletCard() {
  const [open, setOpen] = useState(false);
  const wallet = useWallet() ?? { balance: 0, transferable: 0, bonus: 0 };
  const balance = wallet.balance;
  return (
    <section aria-label={w.title} className="relative overflow-hidden rounded-2xl border border-primary/15 bg-surface">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 p-4 sm:flex sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 sm:size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><UiIcon name="wallet-balance" look="glass" className="size-7" /></span><div><p className="text-[11px] text-muted-foreground">เครดิตพร้อมใช้</p><p className="mt-0.5 text-[26px] leading-none font-bold sm:text-3xl tracking-tight tabular-nums">{formatCoinsFixed(balance)}<span className="ml-2 text-xs font-medium text-muted-foreground">เครดิต</span></p></div></div>
        <dl className="col-span-2 row-start-2 grid grid-cols-2 gap-5 border-t border-border pt-3 sm:min-w-48 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"><div><dt className="text-[10px] text-muted-foreground">{w.transferable}</dt><dd className="mt-1 text-base font-semibold tabular-nums">{formatCoinsFixed(wallet.transferable)}</dd></div><div><dt className="text-[10px] text-muted-foreground">{w.bonus}</dt><dd className="mt-1 text-base font-semibold text-primary tabular-nums">{formatCoinsFixed(wallet.bonus)}</dd></div></dl>
        <div className="col-start-2 row-start-1"><Button variant="outline" size="sm" aria-label={w.transfer} className="h-10 rounded-xl px-3 sm:h-9" onClick={() => setOpen(true)} disabled={wallet.transferable <= 0}><UiIcon name="send" className="size-4" /><span className="hidden sm:inline">{w.transfer}</span></Button></div>
      </div>
      <div className="flex items-center gap-3 border-t border-border/60 bg-surface-2/40 px-4 py-2.5 sm:px-6"><p className="flex flex-1 items-start gap-1.5 text-[10px] leading-5 text-muted-foreground"><Info className="mt-1 size-3 shrink-0" aria-hidden />{w.bonusNote}</p><Link href="/history" className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-primary sm:hidden"><History className="size-3" aria-hidden />ประวัติ</Link></div>
      <TransferDialog open={open} onOpenChange={setOpen} max={wallet.transferable} />
    </section>
  );
}
