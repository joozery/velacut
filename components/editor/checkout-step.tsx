"use client";

import { AlertCircle, CornerDownRight, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { BRAND_NAME, copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import type { GameSlug } from "@/lib/games";
import { posterSignature } from "@/lib/account";
import { useAccountStore, useBalance } from "@/stores/account-store";
import { useSession } from "next-auth/react";
import { PRICE_PER_SKIN, payableTotal } from "@/lib/pricing";
import { useEditorTemplates } from "./use-templates";
import { cn, fmt } from "@/lib/utils";
import { DEFAULT_DECORATION, useEditorStore, useGameEditor, type OutputMode } from "@/stores/editor-store";
import { PosterPreview } from "./poster-preview";
import { useGrid } from "./use-grid";
import { useRequireSkins } from "./use-step-guard";

const c = copy.editor.checkout;

/** ข้อมูลการชำระที่ใช้ร่วมกันระหว่างหน้า checkout และแถบล่าง */
export function useCheckout(game: GameSlug) {
  const { doc } = useGameEditor(game);
  const { skins, viewCols } = useGrid(game);
  const output: OutputMode = doc.output ?? "clean";
  const skinCost = Math.round(skins.length * PRICE_PER_SKIN * 100) / 100;
  const { cfg, template } = useEditorTemplates(game);
  const templateFee = cfg[template].price;
  const loggedIn = useSession().status === "authenticated";
  const signature = posterSignature(game, doc, viewCols);
  const paid = useAccountStore((s) => s.account?.paidSignatures.includes(signature) ?? false);
  const total = paid ? 0 : payableTotal(skins.length, template, output, cfg);
  const balance = useBalance();
  const after = Math.round((balance - total) * 100) / 100;
  return { output, skinCost, templateFee, templateName: cfg[template].name, template, cfg, total, balance, after, paid, loggedIn, short: loggedIn && after < 0 ? -after : 0 };
}

function Row({ label, sub, value, className }: { label: string; sub?: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
      </div>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** Step 4: ชำระเงิน — สรุปรายการ / เลือกแบบไฟล์ / ยอดก่อน-หลังชำระ */
export function CheckoutStep({ game }: { game: GameSlug }) {
  const ready = useRequireSkins(game);
  const { doc } = useGameEditor(game);
  const { skins, viewCols } = useGrid(game);
  const setOutput = useEditorStore((s) => s.setOutput);
  const k = useCheckout(game);

  if (!ready) {
    return <div role="status" aria-busy className="m-6 aspect-[4/3] max-w-2xl animate-pulse rounded-2xl bg-surface-2 lg:mx-auto" />;
  }

  const templateName = k.templateName;
  const decoration = { ...DEFAULT_DECORATION, ...doc.decoration };

  return (
    <div className="lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="editor-canvas flex min-w-0 flex-col items-center gap-4 p-5 sm:p-8 lg:overflow-y-auto lg:p-10">
        <div className="w-full max-w-[34rem]"><p className="text-[10px] font-semibold tracking-widest text-primary">04 / EXPORT</p><h1 className="mt-1 text-lg font-bold sm:text-xl">ป้ายของคุณพร้อมแล้ว</h1></div>
        <PosterPreview game={game} skinIds={skins} cols={viewCols} template={doc.template} decoration={decoration} className="max-w-[34rem]" />
        <p className="text-center text-xs text-muted-foreground">{copy.editor.template.previewNote}</p>
      </section>

      <aside className="border-t border-border bg-surface p-5 sm:p-6 lg:overflow-y-auto lg:border-t-0 lg:border-l">
        {!k.loggedIn && <p className="mb-4 rounded-xl bg-primary-soft p-3 text-xs leading-5 text-primary">เข้าสู่ระบบเพื่อดาวน์โหลดแบบไม่มีลายน้ำ · แบบมีลายน้ำดาวน์โหลดฟรีได้เลย</p>}
        {k.template === "b" && !doc.decoration?.banner && (
          <div role="status" className="mb-5 flex items-center gap-3 rounded-2xl bg-primary-soft p-3 text-primary-soft-foreground">
            <AlertCircle className="size-5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm font-medium">{c.noInfo}</p>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href={`/generate/${game}?step=decorate`}>{c.goDecorate}</Link>
            </Button>
          </div>
        )}
        <h2 className="mb-3 text-sm font-semibold">{c.summary}</h2>
        <div className="grid gap-3 rounded-2xl border border-border p-4">
          <Row label={c.skinsRow} sub={fmt(c.skinsFormula, { n: skins.length, price: PRICE_PER_SKIN })} value={formatCoinsFixed(k.skinCost)} />
          <Row label={fmt(c.templateRow, { name: templateName })} value={k.templateFee ? `+${formatCoinsFixed(k.templateFee)}` : c.free} />
        </div>

        <h2 className="mt-6 mb-2.5 text-sm font-semibold">{c.outputSection}</h2>
        <RadioCardGroup aria-label={c.outputAria} value={k.output} onValueChange={(v) => setOutput(game, v as OutputMode)}>
          {(["clean", "watermark"] as const).map((id) => {
            const price = id === "clean" ? payableTotal(skins.length, k.template, "clean", k.cfg) : 0;
            return (
              <RadioCard key={id} value={id} indicator="left">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold">{c[id].name}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums">{price ? fmt(c.coins, { n: formatCoinsFixed(price) }) : c.free}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{fmt(c[id].desc, { brand: BRAND_NAME })}</p>
              </RadioCard>
            );
          })}
        </RadioCardGroup>

        <div className="mt-6 grid gap-2 border-t border-border pt-5 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{c.total}</span>
            <span className="text-2xl font-bold tabular-nums">
              {k.total ? formatCoinsFixed(k.total) : c.free}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Wallet className="size-4" aria-hidden />
              {c.balance}
            </span>
            <span className="tabular-nums">{formatCoinsFixed(k.balance)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{c.after}</span>
            <span className={cn("font-semibold tabular-nums", k.short ? "text-danger" : "text-foreground")}>{formatCoinsFixed(k.after)}</span>
          </div>

          {k.short > 0 && (
            <div role="alert" className="mt-2 flex items-center gap-3 rounded-2xl bg-danger-soft p-3 text-danger">
              <AlertCircle className="size-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm font-medium">{fmt(c.short, { n: formatCoinsFixed(k.short) })}</p>
              <Button asChild size="sm" variant="danger" className="rounded-full">
                <Link href="/topup">{c.topup}</Link>
              </Button>
            </div>
          )}

          <ul className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
            {c.notes.map((n) => (
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
