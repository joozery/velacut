"use client";

import Link from "next/link";
import { useBalance } from "@/stores/account-store";
import { Plus } from "lucide-react";
import { CoinIcon } from "@/components/shared/coin";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { cn } from "@/lib/utils";

/** ยอดเครดิต + ปุ่มเติม — อ่านยอดจริงจาก account store */
export function CoinBalance({ className, showTopup = true }: { className?: string; showTopup?: boolean }) {
  const balance = useBalance();
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
