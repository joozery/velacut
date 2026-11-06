"use client";

import Link from "next/link";
import { useDemoWallet } from "@/stores/checkout-store";
import { Plus } from "lucide-react";
import { CoinIcon } from "@/components/shared/coin";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { cn } from "@/lib/utils";

/** ยอดคอยน์ + ปุ่มเติม (server component) */
export function CoinBalance({ balance, className, showTopup = true }: { balance: number; className?: string; showTopup?: boolean }) {
  const currentBalance = useDemoWallet();
  balance = currentBalance;
  return (
    <div className={cn("inline-flex h-10 items-center gap-1 rounded-full border border-border bg-surface pr-1 pl-2 shadow-soft-sm", className)}>
      <CoinIcon />
      <span className="px-1 text-sm font-semibold tabular-nums">
        <span className="sr-only">{copy.header.coinBalance} </span>
        {formatCoinsFixed(balance)}
      </span>
      {showTopup && (
        <Link
          href="/topup"
          aria-label={copy.header.topupAria}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Plus className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">{copy.header.topupButton}</span>
        </Link>
      )}
    </div>
  );
}
