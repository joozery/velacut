"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, LayoutGrid, Plus } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import type { GameSlug } from "@/lib/games";
import { MAX_SKINS, MIN_SKINS } from "@/lib/pricing";
import { fmt } from "@/lib/utils";
import { featuredSkins } from "@/lib/catalog";
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
        <div className="editor-canvas flex min-h-full items-center justify-center rounded-2xl border border-border/70 px-4 py-8 sm:px-8 sm:py-10">
          <div className="w-full max-w-xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-surface px-3 py-1.5 text-[11px] font-medium text-primary"><LayoutGrid className="size-3.5" aria-hidden />พื้นที่สร้างป้ายของคุณ</span>
            <div aria-hidden className="mx-auto mt-7 flex h-32 max-w-[280px] items-center justify-center sm:h-40 sm:max-w-[340px]">
              {featuredSkins(game, 4).map((skin, i) => <div key={skin.id} style={{ transform: `translateY(${[10, -5, -5, 10][i]}px) rotate(${[-12, -4, 4, 12][i]}deg)` }} className="relative -mx-1 h-28 w-20 overflow-hidden rounded-xl border-[3px] border-surface shadow-lg sm:h-36 sm:w-24"><Image src={skin.image} alt="" fill sizes="96px" className="object-cover" /></div>)}
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">เริ่มป้ายใหม่ในสไตล์คุณ</h1>
            <p className="mx-auto mt-3 max-w-xs text-xs leading-6 text-muted-foreground sm:text-sm">เลือกสกินที่มี จัดเรียงให้ลงตัว<br />แล้วเติมราคาและรายละเอียดในขั้นตอนถัดไป</p>
            <Button size="lg" className="mt-5 rounded-xl px-6 shadow-soft" onClick={openPicker}><Plus aria-hidden />{g.emptyCta}<ArrowRight aria-hidden /></Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><Check className="size-3.5 text-primary" aria-hidden />{fmt(g.emptyDesc, { n: MIN_SKINS })}</p>
            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-border/70 pt-5 text-[10px] text-muted-foreground sm:text-xs">{["เลือกสกิน", "เลือกแบบและตกแต่ง", "ดาวน์โหลดพร้อมโพสต์"].map((label, i) => <span key={label}><span className="mb-1 block font-mono text-primary">0{i + 1}</span>{label}</span>)}</div>
          </div>
        </div>
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
            <Button size="lg" onClick={openPicker} className="rounded-xl shadow-soft-lg">
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
