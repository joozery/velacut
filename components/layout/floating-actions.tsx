"use client";

import Link from "next/link";
import { Gift, MessageCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { DailyRewardDialog } from "./daily-reward-dialog";
import { copy } from "@/lib/copy";

const fab =
  "relative grid size-13 place-items-center rounded-full shadow-soft-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-6";

export function FloatingActions() {
  return (
    <div className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-3 sm:right-6 md:bottom-6">
      <DailyRewardDialog
        trigger={
          <button type="button" aria-label={copy.dailyReward.fabAria} className={`${fab} bg-primary text-primary-foreground`}>
            <Gift aria-hidden />
            <span aria-hidden className="absolute top-0.5 right-0.5 size-3 rounded-full border-2 border-surface bg-danger" />
          </button>
        }
      />
      <Tooltip content={copy.chatFab.aria} side="left">
        <Link href="/chat" aria-label={copy.chatFab.aria} className={`${fab} bg-secondary text-secondary-foreground`}>
          <MessageCircle aria-hidden />
        </Link>
      </Tooltip>
    </div>
  );
}
