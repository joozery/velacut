"use client";

import { useWallet } from "@/stores/account-store";
import Link from "next/link";
import { History, Info } from "lucide-react";
import { UiIcon } from "@/components/icons/ui-icon";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { TransferCreditsButton } from "@/components/wallet/transfer-credits";

const w = copy.topup.wallet;

/** ยอดเครดิตปัจจุบันและทางลัดจัดการกระเป๋า */
export function WalletCard() {
  const wallet = useWallet() ?? { balance: 0, transferable: 0, bonus: 0 };
  const balance = wallet.balance;
  return (
    <section aria-label={w.title} className="relative overflow-hidden rounded-2xl border border-primary/15 bg-surface">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 p-4 sm:flex sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 sm:size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><UiIcon name="wallet-balance" look="glass" className="size-7" /></span><div><p className="text-[11px] text-muted-foreground">เครดิตพร้อมใช้</p><p className="mt-0.5 text-[26px] leading-none font-bold sm:text-3xl tracking-tight tabular-nums">{formatCoinsFixed(balance)}<span className="ml-2 text-xs font-medium text-muted-foreground">เครดิต</span></p></div></div>
        <dl className="col-span-2 row-start-2 grid grid-cols-2 gap-5 border-t border-border pt-3 sm:min-w-48 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"><div><dt className="text-[10px] text-muted-foreground">{w.transferable}</dt><dd className="mt-1 text-base font-semibold tabular-nums">{formatCoinsFixed(wallet.transferable)}</dd></div><div><dt className="text-[10px] text-muted-foreground">{w.bonus}</dt><dd className="mt-1 text-base font-semibold text-primary tabular-nums">{formatCoinsFixed(wallet.bonus)}</dd></div></dl>
        <div className="col-start-2 row-start-1"><TransferCreditsButton available={wallet.transferable} /></div>
      </div>
      <div className="flex items-center gap-3 border-t border-border/60 bg-surface-2/40 px-4 py-2.5 sm:px-6"><p className="flex flex-1 items-start gap-1.5 text-[10px] leading-5 text-muted-foreground"><Info className="mt-1 size-3 shrink-0" aria-hidden />{w.bonusNote}</p><Link href="/history" className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-primary sm:hidden"><History className="size-3" aria-hidden />ประวัติ</Link></div>
    </section>
  );
}
