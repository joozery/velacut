"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Gift, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CoinIcon } from "@/components/shared/coin";
import { copy } from "@/lib/copy";
import { formatCoins } from "@/lib/format";
import type { DailyConfig } from "@/lib/daily";
import { cn, fmt } from "@/lib/utils";
import { toast } from "@/stores/toast-store";
import { nextRewardDay, useAccountStore, useDaily } from "@/stores/account-store";
import { claimDailyAction } from "@/app/actions/account";

export function DailyRewardDialog({
  trigger,
  open,
  onOpenChange,
  config,
}: {
  config: DailyConfig;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const c = copy.dailyReward;
  const { claimed, claimedToday } = useDaily();
  const loggedIn = useSession().status === "authenticated";
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  // วันที่ของรางวัลวันนี้ (ก่อนรับ = claimed+1, หลังรับ = claimed)
  const today = claimedToday ? claimed : nextRewardDay(claimed, config.days.length);

  const claim = async () => {
    if (busy) return;
    setBusy(true);
    const r = await claimDailyAction().catch(() => null);
    setBusy(false);
    if (!r?.ok) return toast({ title: r?.error ?? "รับรางวัลไม่สำเร็จ กรุณาลองใหม่", variant: "error" });
    useAccountStore.getState().setAccount(r.data.account);
    toast({ title: c.toastTitle, description: fmt(c.toastDesc, { n: formatCoins(r.data.reward) }), variant: "success" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[400px] gap-3.5 p-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base">{c.title}</DialogTitle>
          <DialogDescription className="text-xs">{fmt(c.description, { n: config.days.length })}</DialogDescription>
          <Badge variant="soft" size="sm" className="mt-1 w-fit">{fmt(c.streak, { n: claimed })}</Badge>
        </DialogHeader>

        <ol className="-mx-1 grid max-h-[min(19rem,50dvh)] grid-cols-6 gap-1.5 overflow-y-auto overscroll-contain px-1 py-0.5">
          {config.days.map(({ reward, highlight }, i) => {
            const day = i + 1;
            const isClaimed = day <= claimed;
            const isToday = day === today && !claimedToday;
            const big = highlight;
            return (
              <li
                key={day}
                aria-label={`${fmt(c.day, { n: day })} · ${formatCoins(reward)} ${copy.common.coins}${isClaimed ? ` · ${c.claimed}` : ""}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-px rounded-lg border text-center",
                  isClaimed && "border-transparent bg-surface-2 text-muted-foreground",
                  isToday && "border-2 border-primary bg-primary-soft",
                  !isClaimed && !isToday && "border-border bg-surface",
                  big && !isClaimed && "bg-gradient-to-br from-primary-soft to-surface",
                )}
              >
                <span className="text-[9px] leading-none font-medium">{isToday ? c.today : day}</span>
                {isClaimed ? (
                  <Check className="size-3.5 text-success" aria-hidden />
                ) : big ? (
                  <Gift className="size-3.5 text-primary" aria-hidden />
                ) : (
                  <CoinIcon className="size-3.5" />
                )}
                <span className="text-[9px] leading-none font-semibold tabular-nums">{formatCoins(reward)}</span>
              </li>
            );
          })}
        </ol>

        {loggedIn ? (
          <Button block disabled={claimedToday || busy} onClick={claim} className="rounded-xl">
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Gift aria-hidden />}
            {claimedToday ? c.claimedToday : c.claim}
          </Button>
        ) : (
          <Button asChild block className="rounded-xl">
            <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}><LogIn aria-hidden />เข้าสู่ระบบเพื่อรับรางวัล</Link>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
