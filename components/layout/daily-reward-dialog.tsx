"use client";

import { Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CoinIcon } from "@/components/shared/coin";
import { copy } from "@/lib/copy";
import { formatCoins } from "@/lib/format";
import { DAILY_REWARDS } from "@/lib/mock";
import { cn, fmt } from "@/lib/utils";
import { toast } from "@/stores/toast-store";
import { nextRewardDay, useDailyReward } from "@/stores/daily-reward-store";

export function DailyRewardDialog({
  trigger,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const c = copy.dailyReward;
  const { claimed, claimedToday, claim: markClaimed } = useDailyReward();
  // วันที่ของรางวัลวันนี้ (ก่อนรับ = claimed+1, หลังรับ = claimed)
  const today = claimedToday ? claimed : nextRewardDay(claimed);

  const claim = () => {
    const reward = DAILY_REWARDS[today - 1].reward;
    markClaimed();
    toast({ title: c.toastTitle, description: fmt(c.toastDesc, { n: formatCoins(reward) }), variant: "success" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.description}</DialogDescription>
          <Badge variant="soft" className="mt-1 w-fit">{fmt(c.streak, { n: claimed })}</Badge>
        </DialogHeader>

        <ol className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {DAILY_REWARDS.map(({ day, reward }) => {
            const isClaimed = day <= claimed;
            const isToday = day === today && !claimedToday;
            const big = reward >= 3;
            return (
              <li
                key={day}
                aria-label={`${fmt(c.day, { n: day })} · ${formatCoins(reward)} ${copy.common.coins}${isClaimed ? ` · ${c.claimed}` : ""}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-center",
                  isClaimed && "border-transparent bg-surface-2 text-muted-foreground",
                  isToday && "border-2 border-primary bg-primary-soft",
                  !isClaimed && !isToday && "border-border bg-surface",
                  big && !isClaimed && "bg-gradient-to-br from-primary-soft to-surface",
                )}
              >
                <span className="text-[10px] font-medium">{isToday ? c.today : day}</span>
                {isClaimed ? (
                  <Check className="size-4 text-success" aria-hidden />
                ) : big ? (
                  <Gift className="size-4 text-primary" aria-hidden />
                ) : (
                  <CoinIcon className="size-4" />
                )}
                <span className="text-[10px] font-semibold tabular-nums">{formatCoins(reward)}</span>
              </li>
            );
          })}
        </ol>

        <Button size="lg" block disabled={claimedToday} onClick={claim}>
          <Gift aria-hidden />
          {claimedToday ? c.claimedToday : c.claim}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
