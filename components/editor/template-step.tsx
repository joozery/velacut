"use client";

import { CornerDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import type { GameSlug } from "@/lib/games";
import { PRICE_PER_SKIN, TEMPLATE_PRICES, calcTotal, discountPercent, type TemplateId } from "@/lib/pricing";
import { cn, fmt } from "@/lib/utils";
import { useEditorStore, useGameEditor } from "@/stores/editor-store";
import { PosterPreview } from "./poster-preview";
import { useGrid } from "./use-grid";
import { useRequireSkins } from "./use-step-guard";

const t = copy.editor.template;
const TEMPLATES: TemplateId[] = ["none", "a", "b"];

function Row({ label, sub, value, strong }: { label: string; sub?: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={cn("text-sm font-semibold", strong && "text-base")}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
      </div>
      <p className={cn("font-semibold tabular-nums", strong ? "text-2xl font-bold" : "text-base")}>{value}</p>
    </div>
  );
}

/** Step 2: เลือกแบบป้าย — preview ซ้าย / ตัวเลือก + สรุปราคา ขวา */
export function TemplateStep({ game }: { game: GameSlug }) {
  const ready = useRequireSkins(game);
  const { skins, viewCols } = useGrid(game);
  const { doc } = useGameEditor(game);
  const setTemplate = useEditorStore((s) => s.setTemplate);

  if (!ready) {
    return <div role="status" aria-busy className="m-6 aspect-[4/3] max-w-2xl animate-pulse rounded-2xl bg-surface-2 lg:mx-auto" />;
  }

  const skinCost = Math.round(skins.length * PRICE_PER_SKIN * 100) / 100;
  const total = calcTotal(skins.length, doc.template);

  return (
    <div className="lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
      {/* preview */}
      <section className="flex flex-col items-center gap-3 p-4 sm:p-8 lg:overflow-y-auto lg:p-10">
        <PosterPreview game={game} skinIds={skins} cols={viewCols} template={doc.template} decoration={doc.decoration} className="max-w-[34rem]" />
        <p className="text-center text-xs text-muted-foreground">{t.previewNote}</p>
      </section>

      {/* แผงตัวเลือก */}
      <aside className="border-t border-border bg-surface p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        <Row
          label={t.skinsRow}
          sub={fmt(t.skinsFormula, { n: skins.length, price: PRICE_PER_SKIN })}
          value={formatCoinsFixed(skinCost)}
        />

        <h2 className="mt-6 mb-2.5 text-sm font-semibold">{t.section}</h2>
        <RadioCardGroup aria-label={t.sectionAria} value={doc.template} onValueChange={(v) => setTemplate(game, v as TemplateId)}>
          {TEMPLATES.map((id) => {
            const opt = t.options[id];
            const { price, compareAtPrice } = TEMPLATE_PRICES[id];
            const off = discountPercent(price, compareAtPrice);
            return (
              <RadioCard key={id} value={id} indicator="left">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold">{opt.name}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums">{price === 0 ? t.free : fmt(t.fee, { n: price })}</span>
                </div>
                {price > 0 && (
                  <div className="mt-0.5 flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">{t.orFree}</span>
                    <span className="flex items-center gap-1.5">
                      {compareAtPrice && <s className="text-muted-foreground tabular-nums">{compareAtPrice}</s>}
                      {off > 0 && (
                        <Badge variant="primary" size="sm">
                          {fmt(t.discount, { n: off })}
                        </Badge>
                      )}
                    </span>
                  </div>
                )}
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{opt.desc}</p>
              </RadioCard>
            );
          })}
        </RadioCardGroup>

        <div className="mt-6 border-t border-border pt-5">
          <Row label={t.total} sub={t.totalHint} value={formatCoinsFixed(total)} strong />
          <ul className="mt-4 grid gap-1.5 text-xs text-muted-foreground">
            {t.notes.map((n) => (
              <li key={n} className="flex gap-2">
                <CornerDownRight className="mt-px size-3.5 shrink-0" aria-hidden />
                {n}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
