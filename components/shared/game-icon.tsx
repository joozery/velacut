import Image from "next/image";
import { cn } from "@/lib/utils";
import type { GameConfig } from "@/lib/games";

/** ไอคอนเกมทางการ (ไฟล์ใน public/games — ดึงด้วย `npm run import:icons`) */
export function GameIcon({ game, className }: { game: GameConfig; className?: string }) {
  return (
    <span aria-hidden className={cn("relative block size-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br shadow-soft-sm", game.gradient, className)}>
      <Image src={game.icon} alt="" fill sizes="96px" className="object-cover" />
    </span>
  );
}
