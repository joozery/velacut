"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CoinIcon } from "@/components/shared/coin";
import { copy } from "@/lib/copy";
import { formatCoins } from "@/lib/format";
import { MAX_SKINS, MIN_SKINS, PRICE_PER_SKIN, calcTotal, discountPercent, type TemplateId } from "@/lib/pricing";
import { enabledTemplates, resolveTemplate } from "@/lib/templates";
import { useTemplates } from "@/components/shared/templates-provider";
import { cn, fmt } from "@/lib/utils";

const p = copy.landing.pricing;
const c = p.calc;

/** เครื่องคิดราคาป้าย: เลื่อนจำนวนสกิน + เลือกเทมเพลต → ราคารวมจริงตาม lib/pricing */
export function PriceCalculator() {
  const [skins, setSkins] = useState(24);
  const cfg = useTemplates();
  const list = enabledTemplates(cfg);
  const [picked, setTpl] = useState<TemplateId>("a");
  const tpl = resolveTemplate(cfg, picked);
  const skinCost = Math.round(skins * PRICE_PER_SKIN * 100) / 100;
  const tplCost = cfg[tpl].price;
  const total = calcTotal(skins, tpl, cfg);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Calculator className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-semibold">{c.title}</h3>
          <p className="text-xs text-muted-foreground">{c.sub}</p>
        </div>
      </div>

      {/* จำนวนสกิน */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">{c.skins}</p>
          <p className="text-sm font-semibold text-primary tabular-nums">{fmt(c.skinsValue, { n: skins })}</p>
        </div>
        <Slider
          className="mt-3"
          min={MIN_SKINS}
          max={MAX_SKINS}
          step={1}
          value={[skins]}
          onValueChange={([v]) => setSkins(v)}
          thumbLabel={c.skins}
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{MIN_SKINS}</span>
          <span>{fmt(c.perSkin, { n: formatCoins(PRICE_PER_SKIN) })}</span>
          <span>{MAX_SKINS}</span>
        </div>
      </div>

      {/* เทมเพลต */}
      <div className="mt-5">
        <p className="text-sm font-medium">{c.template}</p>
        <div role="radiogroup" aria-label={c.template} className={cn("mt-2 grid gap-2", list.length === 1 ? "grid-cols-1" : list.length === 2 || list.length === 4 ? "grid-cols-2" : "grid-cols-3")}>
          {list.map((id) => {
            const { price, compareAtPrice } = cfg[id];
            const off = discountPercent(price, compareAtPrice ?? undefined);
            const on = tpl === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setTpl(id)}
                className={cn(
                  "relative rounded-xl border px-2 py-2.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  on ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40",
                )}
              >
                {off > 0 && (
                  <span className="absolute -top-2 right-1.5 rounded-full bg-danger px-1.5 text-[10px] leading-4 font-semibold text-white">
                    {fmt(p.discount, { n: off })}
                  </span>
                )}
                <span className={cn("block truncate text-sm font-semibold", on && "text-primary")}>{id === "none" ? c.none : cfg[id].name}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground tabular-nums">
                  {price ? fmt(p.plusCoins, { n: formatCoins(price) }) : "—"}
                  {compareAtPrice ? <s className="ml-1 opacity-70">{formatCoins(compareAtPrice)}</s> : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* รวม */}
      <div className="mt-5 flex items-end justify-between gap-3 rounded-xl bg-surface-2 p-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{c.total}</p>
          <p aria-live="polite" className="mt-1 flex items-center gap-1.5 text-3xl leading-none font-bold tabular-nums">
            <CoinIcon className="size-6" />
            {formatCoins(total)}
          </p>
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground tabular-nums">
            {fmt(c.breakdown, { skins: formatCoins(skinCost), tpl: formatCoins(tplCost) })}
          </p>
        </div>
        <Button asChild className="h-11 shrink-0 rounded-xl px-4">
          <Link href="/generate/mlbb">
            {c.cta}
            <ArrowUpRight aria-hidden />
          </Link>
        </Button>
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">{c.note}</p>
    </div>
  );
}
