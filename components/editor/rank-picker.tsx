"use client";

import Image from "next/image";
import { Ban } from "lucide-react";
import { Label } from "@/components/ui/input";
import { copy } from "@/lib/copy";
import { RANKS, rankImage, type RankId } from "@/lib/ranks";
import { cn, fmt } from "@/lib/utils";

const c = copy.rankPicker;

/** เลือกแรงค์ของไอดีจากตราแรงค์ในเกม (กดซ้ำ = ยกเลิก) */
export function RankPicker({ value, onChange, id, label = c.label, hint = c.hint }: { value?: RankId; onChange: (rank: RankId | undefined) => void; id: string; label?: string; hint?: string }) {
  const tile =
    "flex flex-col items-center gap-1 rounded-2xl border-2 p-1.5 text-[10px] leading-tight font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="grid gap-2">
      <Label id={`${id}-label`}>{label}</Label>
      <p className="-mt-1 text-xs text-muted-foreground">{hint}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-4">
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange(undefined)}
          className={cn(tile, !value ? "border-primary bg-primary-soft text-primary" : "border-transparent bg-surface-2 text-muted-foreground hover:bg-surface-3")}
        >
          <span className="grid size-10 place-items-center">
            <Ban className="size-5" aria-hidden />
          </span>
          {c.none}
        </button>
        {RANKS.map((r) => {
          const active = value === r.id;
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={active}
              aria-label={fmt(c.pick, { name: r.name })}
              onClick={() => onChange(active ? undefined : r.id)}
              className={cn(tile, active ? "border-primary bg-primary-soft text-foreground" : "border-transparent bg-surface-2 text-muted-foreground hover:bg-surface-3")}
            >
              <span className="relative block size-10">
                <Image src={rankImage(r.id)} alt="" fill unoptimized sizes="40px" className="object-contain" />
              </span>
              <span className="line-clamp-2 text-center">{r.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
