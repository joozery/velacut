"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, Check, Grip, LayoutGrid, Plus } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { copy } from "@/lib/copy";
import type { GameSlug } from "@/lib/games";
import { MAX_SKINS, MIN_SKINS } from "@/lib/pricing";
import { fmt } from "@/lib/utils";
import { featuredFromCatalog } from "@/lib/catalog";
import { useCatalog } from "@/components/shared/catalog-provider";
import { SkinGrid } from "./skin-grid";
import { SkinPicker } from "./skin-picker";
import { useGrid } from "./use-grid";

const g = copy.editor.grid;

function GridSkeleton() {
  return (
    <div role="status" aria-busy aria-label={g.loading} className="mx-auto grid w-full max-w-md grid-cols-3 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[200/325] animate-pulse rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}

export function GridStep({ game }: { game: GameSlug }) {
  const catalog = useCatalog(game);
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
              {featuredFromCatalog(catalog, 4).map((skin, i) => <div key={skin.id} style={{ transform: `translateY(${[10, -5, -5, 10][i]}px) rotate(${[-12, -4, 4, 12][i]}deg)` }} className="relative -mx-1 h-28 w-20 overflow-hidden rounded-xl border-[3px] border-surface shadow-lg sm:h-36 sm:w-24"><Image src={skin.image} alt="" fill sizes="96px" className="object-cover" /></div>)}
            </div>
            <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">เริ่มป้ายใหม่ในสไตล์คุณ</h1>
            <p className="mx-auto mt-3 max-w-xs text-xs leading-6 text-muted-foreground sm:text-sm">เลือกสกินที่มี จัดเรียงให้ลงตัว<br />แล้วเติมราคาและรายละเอียดในขั้นตอนถัดไป</p>
            <Button size="lg" className="mt-5 rounded-xl px-6 shadow-soft" onClick={openPicker}><Plus aria-hidden />{g.emptyCta}<ArrowRight aria-hidden /></Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><Check className="size-3.5 text-primary" aria-hidden />{fmt(g.emptyDesc, { n: MIN_SKINS })}</p>
            <div className="mt-7 grid grid-cols-3 gap-2 border-t border-border/70 pt-5 text-[10px] text-muted-foreground sm:text-xs">{["เลือกสกิน", "เลือกแบบและตกแต่ง", "ดาวน์โหลดพร้อมโพสต์"].map((label, i) => <span key={label}><span className="mb-1 block font-mono text-primary">0{i + 1}</span>{label}</span>)}</div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-surface shadow-soft-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/10 bg-gradient-to-r from-primary-soft/80 via-primary-soft/30 to-surface px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/10 bg-surface text-primary"><LayoutGrid className="size-5" aria-hidden /></span>
              <div><h1 className="text-sm font-bold sm:text-base">คอลเลกชันบนป้ายของคุณ</h1><p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground sm:text-xs"><Grip className="size-3" aria-hidden />ลากการ์ดเพื่อจัดลำดับที่ต้องการ</p></div>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl bg-surface" onClick={openPicker} disabled={skins.length >= MAX_SKINS}><Plus aria-hidden />เพิ่มสกิน</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5 text-[10px] sm:px-5 sm:text-xs">
            <p className="text-muted-foreground">เลือกแล้ว <span className="font-bold text-foreground tabular-nums">{skins.length}</span> / {MAX_SKINS} สกิน</p>
            <p className="flex items-center gap-1.5 font-medium text-primary">{skins.length >= MIN_SKINS ? <><Check className="size-3.5" aria-hidden />พร้อมเลือกแบบป้าย</> : `เลือกเพิ่มอีก ${MIN_SKINS - skins.length} สกินเพื่อไปต่อ`}</p>
          </div>
          <div className="editor-canvas p-3 sm:p-5"><SkinGrid game={game} skins={skins} viewCols={viewCols} /></div>
        </div>
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
