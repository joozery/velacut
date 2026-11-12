"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { MIN_SKINS, calcTotal, payableTotal } from "@/lib/pricing";
import { useTemplates } from "@/components/shared/templates-provider";
import { resolveTemplate } from "@/lib/templates";
import { cn, fmt } from "@/lib/utils";
import { useEditorStore, useGameEditor } from "@/stores/editor-store";
import { LayoutSelect } from "./layout-select";
import { PreviewDialog } from "./preview-dialog";
import { CheckoutCta } from "./checkout-cta";
import { useGrid } from "./use-grid";
import { useEditorStep } from "./use-editor-step";

const c = copy.editor.bottomBar;

/** แถบล่าง: ราคารวม realtime + ขนาดกริด + ดูตัวอย่าง + ไปขั้นถัดไป */
export function EditorBottomBar() {
  const { game, step, next, prev, href } = useEditorStep();
  const { doc } = useGameEditor(game.slug);
  const { hydrated, skins, viewCols } = useGrid(game.slug);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isLibrary = game.mode === "library";
  const cfg = useTemplates();
  const template = resolveTemplate(cfg, doc.template);
  const count = hydrated ? skins.length : 0;
  // ราคาแบบไม่มีลายน้ำ = สกิน × 0.3 + ค่าเทมเพลต (ตั้งแต่ step template เป็นต้นไป)
  // checkout: แบบมีลายน้ำ = ฟรี
  const total = !isLibrary
    ? 0
    : step === "checkout"
      ? payableTotal(count, template, doc.output, cfg)
      : calcTotal(count, step === "grid" ? "none" : template, cfg);
  const isFinal = !isLibrary || !next;
  const missing = Math.max(0, MIN_SKINS - count);
  const blocked = isLibrary && missing > 0;
  const onGrid = isLibrary && step === "grid";

  return (
    <div className={cn("relative z-20 shrink-0 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgb(25_55_100/0.03)]", isLibrary && step === "decorate" && "hidden lg:block")}>
      <div className="flex h-[4.5rem] items-center gap-2 px-4 sm:gap-3 sm:px-5">
        {/* ราคา */}
        <div className="min-w-0 shrink-0" aria-live="polite">
          <p className="text-[11px] font-medium text-muted-foreground">{c.total}</p>
          <p className="flex items-baseline gap-1.5">
            <span className="relative inline-flex overflow-hidden text-xl font-bold tabular-nums sm:text-2xl">
              <AnimatePresence mode="popLayout" initial={false}>
                <m.span
                  key={total}
                  initial={{ y: -14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 14, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                >
                  {formatCoinsFixed(total)}
                </m.span>
              </AnimatePresence>
            </span>
            <span className="text-xs text-muted-foreground">{copy.common.coins}</span>
            {isLibrary && hydrated && (
              <span className={cn("hidden text-xs sm:inline", blocked ? "font-medium text-primary" : "text-muted-foreground")}>
                {blocked ? fmt(c.needMoreShort, { n: missing }) : fmt(c.skinCount, { n: count })}
              </span>
            )}
          </p>
        </div>

        {onGrid && (
          <>
            <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />
            <LayoutSelect
              cols={viewCols}
              count={skins.length}
              onChange={(cols) => useEditorStore.getState().setViewCols(game.slug, cols)}
              disabled={!hydrated}
              placeholder={c.layout}
            />
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isLibrary && !onGrid && prev && (
            <Button asChild variant="ghost" className="rounded-full px-3 sm:px-4">
              <Link href={href(prev)} aria-label={c.back}>
                <ArrowLeft aria-hidden />
                <span className="hidden sm:inline">{c.back}</span>
              </Link>
            </Button>
          )}
          {onGrid && (
            <Button
              variant="outline"
              className="rounded-xl px-3 sm:px-4"
              onClick={() => setPreviewOpen(true)}
              disabled={!hydrated || skins.length === 0}
              aria-label={copy.editor.toolbar.preview}
            >
              <Eye aria-hidden />
              <span className="hidden sm:inline">{copy.editor.toolbar.preview}</span>
            </Button>
          )}
          {isLibrary && step === "checkout" ? (
            <CheckoutCta game={game.slug} disabled={blocked || !hydrated} />
          ) : isFinal ? (
            <Button className="rounded-full px-5" disabled={blocked}>
              <Download aria-hidden />
              {c.pay}
            </Button>
          ) : blocked ? (
            <Button className="rounded-full px-5" disabled>
              {c.next}
              <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button asChild className="rounded-xl px-5 shadow-soft">
              <Link href={href(next)}>
                {c.next}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </div>
      {/* มือถือ: บอกจำนวนที่ขาดใต้ราคา */}
      {isLibrary && hydrated && blocked && (
        <p className="-mt-2 px-3 pb-2 text-[11px] font-medium text-primary sm:hidden">{fmt(c.needMoreShort, { n: missing })}</p>
      )}
      {onGrid && <PreviewDialog game={game.slug} skins={skins} cols={viewCols} open={previewOpen} onOpenChange={setPreviewOpen} />}
    </div>
  );
}
