"use client";

import { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import type { GameSlug } from "@/lib/games";
import { MAX_SKINS, MIN_SKINS } from "@/lib/pricing";
import { fmt } from "@/lib/utils";
import { SkinGrid } from "./skin-grid";
import { SkinPicker } from "./skin-picker";
import { useGrid } from "./use-grid";

const g = copy.editor.grid;

function GridSkeleton() {
  return (
    <div role="status" aria-busy aria-label={g.loading} className="mx-auto grid w-full max-w-md grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}

export function GridStep({ game }: { game: GameSlug }) {
  const { hydrated, skins, layout, viewCols } = useGrid(game);
  const [pickerOpen, setPickerOpen] = useState(false);
  const openPicker = () => setPickerOpen(true);

  return (
    <>
      {!hydrated ? (
        <Card className="p-6"><GridSkeleton /></Card>
      ) : skins.length === 0 || !layout ? (
        <Card className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 border-dashed p-8 text-center lg:h-full lg:border-0 lg:bg-transparent lg:shadow-none">
          <m.span
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary"
          >
            <LayoutGrid className="size-7" aria-hidden />
          </m.span>
          <h1 className="text-xl font-semibold">{g.emptyTitle}</h1>
          <p className="max-w-xs text-sm text-muted-foreground lg:hidden">{fmt(g.emptyDesc, { n: MIN_SKINS })}</p>
          <p className="hidden max-w-xs text-sm text-muted-foreground lg:block">{g.emptyDescDesktop}</p>
          <Button size="lg" className="mt-2 lg:hidden" onClick={openPicker}>
            <Plus aria-hidden />
            {g.emptyCta}
          </Button>
        </Card>
      ) : (
        // พื้นที่ทำงาน: การ์ดใหญ่บนพื้นสว่าง จำนวนคอลัมน์ตาม slider (layout ของภาพจริงเลือกที่แถบล่าง)
        <SkinGrid game={game} skins={skins} viewCols={viewCols} />
      )}

      {/* FAB เพิ่มสกิน — อยู่เหนือแถบล่าง */}
      <AnimatePresence>
        {hydrated && skins.length > 0 && skins.length < MAX_SKINS && (
          <m.div
            key="fab"
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 26 }}
            className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 sm:right-6 lg:hidden"
          >
            <Button size="lg" onClick={openPicker} className="rounded-full shadow-soft-lg">
              <Plus aria-hidden />
              {g.addSkin}
            </Button>
          </m.div>
        )}
      </AnimatePresence>

      <SkinPicker game={game} open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
