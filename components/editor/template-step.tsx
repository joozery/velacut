"use client";

import { Check, Droplets, ImagePlus } from "lucide-react";
import { CoinIcon } from "@/components/shared/coin";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import type { GameSlug } from "@/lib/games";
import { PRICE_PER_SKIN, calcTotal, discountPercent, type TemplateId } from "@/lib/pricing";
import { useEditorTemplates } from "./use-templates";
import { cn, fmt } from "@/lib/utils";
import { useEditorStore, useGameEditor } from "@/stores/editor-store";
import { PosterPreview } from "./poster-preview";
import { useGrid } from "./use-grid";
import { useRequireSkins } from "./use-step-guard";

const t = copy.editor.template;

/** ภาพร่างโครงป้ายของแต่ละแบบ — สื่อโครงสร้าง ไม่ใช่ภาพจริง */
function Sketch({ id, active }: { id: TemplateId; active: boolean }) {
  const cell = cn("rounded-[3px]", active ? "bg-primary/35" : "bg-foreground/15");
  return (
    <span aria-hidden className={cn("flex w-[4.5rem] shrink-0 flex-col gap-1 rounded-xl p-1.5 transition-colors", active ? "bg-primary/10" : "bg-surface-2")}>
      {id === "a" && (
        <span className={cn("relative flex h-6 flex-col justify-center gap-0.5 rounded-md px-1", active ? "bg-primary/60" : "bg-foreground/30")}>
          <span className="h-1 w-3/5 rounded-full bg-white/90" />
          <span className="h-1 w-2/5 rounded-full bg-white/60" />
        </span>
      )}
      {id === "b" && (
        <span className={cn("grid h-6 place-items-center rounded-md border border-dashed", active ? "border-primary/70 text-primary" : "border-foreground/30 text-foreground/40")}>
          <ImagePlus className="size-3" />
        </span>
      )}
      <span className="grid flex-1 grid-cols-4 gap-0.5">{Array.from({ length: id === "none" ? 16 : 8 }, (_, i) => <span key={i} className={cn(cell, "aspect-[3/4]")} />)}</span>
    </span>
  );
}

/** Step 2: เลือกแบบป้าย — preview ซ้าย / ตัวเลือก + สรุปราคา ขวา */
export function TemplateStep({ game }: { game: GameSlug }) {
  const ready = useRequireSkins(game);
  const { skins, viewCols } = useGrid(game);
  const { doc } = useGameEditor(game);
  const setTemplate = useEditorStore((s) => s.setTemplate);
  const { cfg, template, list } = useEditorTemplates(game);

  if (!ready) {
    return <div role="status" aria-busy className="m-6 aspect-[4/3] max-w-2xl animate-pulse rounded-2xl bg-surface-2 lg:mx-auto" />;
  }

  const skinCost = Math.round(skins.length * PRICE_PER_SKIN * 100) / 100;
  const total = calcTotal(skins.length, template, cfg);

  return (
    <div className="lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
      {/* preview */}
      <section className="editor-canvas flex min-w-0 flex-col items-center gap-4 p-5 sm:p-8 lg:overflow-y-auto lg:p-10">
        <div className="w-full max-w-[34rem]"><p className="text-[10px] font-semibold tracking-widest text-primary">02 / TEMPLATE</p><h1 className="mt-1 text-lg font-bold sm:text-xl">เลือกแบบที่ใช่สำหรับป้ายคุณ</h1></div>
        <PosterPreview game={game} skinIds={skins} cols={viewCols} template={template} decoration={doc.decoration} className="max-w-[34rem]" />
        <p className="text-center text-xs text-muted-foreground">{t.previewNote}</p>
      </section>

      {/* แผงตัวเลือก — การ์ดภาพร่าง + ใบสรุปยอด */}
      <aside className="flex flex-col gap-5 border-t border-border bg-surface p-5 sm:p-6 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">เลือกหน้าตาป้าย</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">กดที่การ์ดเพื่อดูผลบนป้ายด้านซ้ายทันที</p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground tabular-nums">{list.length} แบบ</span>
        </div>

        <div role="radiogroup" aria-label={t.sectionAria} className="grid gap-2.5">
          {list.map((id) => {
            const opt = cfg[id];
            const off = discountPercent(opt.price, opt.compareAtPrice ?? undefined);
            const on = template === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTemplate(game, id)}
                className={cn(
                  "group relative flex items-stretch gap-3 rounded-2xl border p-2.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  on ? "border-primary bg-primary-soft/50 shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]" : "border-border hover:border-primary/40 hover:bg-surface-2/50",
                )}
              >
                <Sketch id={id} active={on} />
                <span className="flex min-w-0 flex-1 flex-col py-0.5">
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn("text-sm font-bold", on && "text-primary")}>{opt.name}</span>
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-transparent")}>
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{opt.desc}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-1.5">
                    {opt.price === 0
                      ? <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-[11px] font-semibold text-success">ไม่มีค่าแบบ</span>
                      : <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">+{formatCoinsFixed(opt.price)} เครดิต</span>}
                    {opt.compareAtPrice ? <s className="text-[11px] text-muted-foreground tabular-nums">{formatCoinsFixed(opt.compareAtPrice)}</s> : null}
                    {off > 0 && <span className="rounded-md bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">-{off}%</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* ใบสรุปยอด */}
        <div className="rounded-2xl bg-surface-2/70 p-4">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground">สรุปยอด</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t.skinsRow} <span className="text-[11px] tabular-nums">({fmt(t.skinsFormula, { n: skins.length, price: PRICE_PER_SKIN })})</span></dt><dd className="font-medium tabular-nums">{formatCoinsFixed(skinCost)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{cfg[template].name}</dt><dd className="font-medium tabular-nums">{formatCoinsFixed(cfg[template].price)}</dd></div>
          </dl>
          <div className="my-3 border-t border-dashed border-border" />
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-sm font-semibold">{t.total}</p><p className="text-[11px] text-muted-foreground">{t.totalHint}</p></div>
            <p className="flex items-center gap-1.5 text-2xl font-bold tabular-nums"><CoinIcon className="size-5" />{formatCoinsFixed(total)}</p>
          </div>
          <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-[11px] text-muted-foreground"><Droplets className="size-3.5 shrink-0 text-primary" aria-hidden />{t.orFree} — เลือกได้ในขั้นดาวน์โหลด</p>
        </div>

        <ol className="grid gap-2 text-xs text-muted-foreground">
          {t.notes.map((n, i) => (
            <li key={n} className="flex gap-2.5"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">{i + 1}</span><span className="pt-0.5">{n}</span></li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
