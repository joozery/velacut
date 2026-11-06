"use client";

import { Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { copy } from "@/lib/copy";
import { getCatalog } from "@/lib/catalog";
import type { GameSlug } from "@/lib/games";
import { fmt } from "@/lib/utils";

const p = copy.editor.preview;

/**
 * Preview ฝั่ง client: ภาพเบลอ + ลายน้ำ + กุญแจ
 * (ภาพจริงจะ render ฝั่ง server หลังตัดคอยน์แล้วเท่านั้น — Phase 5)
 */
export function PreviewDialog({
  game,
  skins,
  cols: wantCols,
  open,
  onOpenChange,
}: {
  game: GameSlug;
  skins: string[];
  cols: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { skinById } = getCatalog(game);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{p.title}</DialogTitle>
          <DialogDescription>{p.description}</DialogDescription>
        </DialogHeader>
        {skins.length ? (
          <div
            role="img"
            aria-label={fmt(p.alt, { n: skins.length })}
            className="relative overflow-hidden rounded-2xl bg-zinc-900 p-3 select-none"
          >
            <div
              aria-hidden
              className="mx-auto grid blur-[3px]"
              style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(wantCols, skins.length))}, minmax(0, 1fr))`, gap: 6 }}
            >
              {skins.map((id) => {
                const s = skinById.get(id);
                return s ? <SkinThumb key={id} skin={s} compact hideTier sizes="96px" /> : null;
              })}
            </div>
            <div aria-hidden className="watermark pointer-events-none absolute inset-0" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                <Lock className="size-4" aria-hidden />
                {p.locked}
              </span>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-surface-2 p-8 text-center text-sm text-muted-foreground">{p.empty}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
