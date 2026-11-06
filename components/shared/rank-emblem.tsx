import Image from "next/image";
import { getRank, rankImage, type RankId } from "@/lib/ranks";
import { cn } from "@/lib/utils";

/**
 * ตราแรงค์ในเกมสำหรับหัวป้าย (รูปตราอย่างเดียว ไม่มีชื่อแรงค์)
 * ขนาดผูกกับ container ของป้าย (cqw) — ต้องอยู่ใต้ element ที่มี @container
 */
export function RankEmblem({ rank, className }: { rank: RankId; className?: string }) {
  const r = getRank(rank);
  if (!r) return null;
  return (
    <div title={r.name} className={cn("flex flex-col items-center", className)}>
      <span className="relative block size-[clamp(44px,17cqw,104px)] drop-shadow-[0_6px_12px_rgb(0_0_0/0.55)]">
        <Image src={rankImage(r.id)} alt="" fill unoptimized sizes="104px" className="object-contain" />
      </span>
    </div>
  );
}
