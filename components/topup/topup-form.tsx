"use client";

import { useId, useState } from "react";
import Image from "next/image";
import type { PaymentMethodsPublic } from "@/lib/payments";
import { ArrowRight, Check, CircleHelp, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { UiIcon } from "@/components/icons/ui-icon";
import { CoinIcon } from "@/components/shared/coin";
import { copy } from "@/lib/copy";
import { formatCoins, formatCoinsFixed, formatInt } from "@/lib/format";
import { activePackages, quoteTopup, type TopupConfig } from "@/lib/topup";
import { createTopupAction } from "@/app/actions/account";
import type { TopupTicket } from "@/lib/account";
import { useAccountStore } from "@/stores/account-store";
import { toast } from "@/stores/toast-store";
import { cn, fmt } from "@/lib/utils";
import { QrDialog } from "./qr-dialog";
import { TrueMoneyDialog } from "./truemoney-dialog";

const t = copy.topup;
const CUSTOM = "custom";

type Method = "promptpay" | "truemoney" | "truemoney_wallet";
const METHODS: Method[] = ["promptpay", "truemoney_wallet", "truemoney"];

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex items-start justify-between gap-3 text-xs leading-5"><span className="text-muted-foreground">{label}</span><span className={cn("shrink-0 font-semibold tabular-nums", accent && "text-primary")}>{value}</span></div>;
}

const LOGOS: Record<Method, { src: string; w: number; h: number; alt: string }> = {
  promptpay: { src: "/images/payments/promptpay.webp", w: 643, h: 216, alt: "PromptPay พร้อมเพย์" },
  truemoney: { src: "/images/payments/truemoney.webp", w: 220, h: 43, alt: "TrueMoney" },
  truemoney_wallet: { src: "/images/payments/truemoney.webp", w: 220, h: 43, alt: "TrueMoney Wallet" },
};

export function TopupForm({ config, methods, children }: { config: TopupConfig; methods: PaymentMethodsPublic; children?: React.ReactNode }) {
  const packages = activePackages(config);
  const { minBaht: CUSTOM_MIN_BAHT, maxBaht: CUSTOM_MAX_BAHT } = config.custom;
  const { bonusPct: FIRST_TOPUP_BONUS_PCT, minBaht: FIRST_TOPUP_MIN_BAHT } = config.firstTopup;
  const balance = useAccountStore((s) => s.account?.wallet.balance ?? 0);
  const firstTopup = useAccountStore((s) => s.account?.firstTopup ?? false);
  const customId = useId();
  const [selected, setSelected] = useState<string>(() => (packages.find((p) => p.tag === "popular") ?? packages[0])?.id ?? CUSTOM);
  const [custom, setCustom] = useState(() => String(Math.min(Math.max(300, config.custom.minBaht), config.custom.maxBaht)));
  const [qr, setQr] = useState<TopupTicket | null>(null);
  const [creating, setCreating] = useState(false);
  const [method, setMethod] = useState<Method>("promptpay");
  const [tmOpen, setTmOpen] = useState(false);
  const pkg = packages.find((p) => p.id === selected);
  const customBaht = Math.floor(Number(custom));
  const customValid = Number.isFinite(customBaht) && customBaht >= CUSTOM_MIN_BAHT && customBaht <= CUSTOM_MAX_BAHT;
  const baht = pkg ? pkg.baht : customValid ? customBaht : 0;
  const quote = quoteTopup(config, baht, pkg?.bonus ?? 0, firstTopup);
  const canPay = baht > 0;
  const startPromptPay = async () => {
    if (creating) return;
    setCreating(true);
    const r = await createTopupAction({ ...(pkg ? { packageId: pkg.id } : { baht }), method: method === "truemoney_wallet" ? "truemoney_wallet" : "promptpay" }).catch(() => null);
    setCreating(false);
    if (!r?.ok) return toast({ title: r?.error ?? "สร้างคำสั่งเติมไม่สำเร็จ กรุณาลองใหม่", variant: "error" });
    setQr(r.data);
  };

  return (
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      <section aria-labelledby={`${customId}-packages`} className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:col-start-1">
        <div className="mb-5 flex items-center justify-between gap-3"><div><h2 id={`${customId}-packages`} className="text-base font-bold">{t.packagesTitle}</h2><p className="mt-1 text-[11px] text-muted-foreground">เลือกยอดที่ต้องการเติม · 1 บาท = {formatCoins(config.coinPerBaht)} เครดิต</p></div><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary"><UiIcon name="coins" className="size-5" /></span></div>

        {firstTopup && config.firstTopup.enabled && FIRST_TOPUP_BONUS_PCT > 0 && <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/10 bg-primary-soft px-3 py-3 sm:px-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-primary"><UiIcon name="gift" look="glass" className="size-6" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-primary-soft-foreground">เติมครั้งแรก รับเพิ่ม <span className="text-base font-bold">{FIRST_TOPUP_BONUS_PCT}%</span></p><p className="mt-0.5 text-[10px] leading-5 text-muted-foreground">เมื่อเติมตั้งแต่ {FIRST_TOPUP_MIN_BAHT} บาท · รับเพิ่มจากโบนัสแพ็กเกจ</p></div><Sparkles className="hidden size-5 text-primary/60 sm:block" aria-hidden /></div>}

        <RadioCardGroup aria-label={t.packagesAria} value={selected} onValueChange={setSelected} className="grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
          {packages.map((p) => {
            const received = quoteTopup(config, p.baht, p.bonus, firstTopup);
            const extra = received.bonus + received.promo;
            const checked = selected === p.id;
            return <RadioCard key={p.id} value={p.id} hideIndicator aria-label={`${p.baht} บาท รับ ${received.total} เครดิต`} className="rounded-xl p-3 data-[state=checked]:bg-primary-soft/35 data-[state=checked]:shadow-none">
              <span className="flex items-center justify-between gap-1"><span className="flex items-center gap-1.5"><CoinIcon className="hidden size-4 shrink-0 sm:block" /><span className="text-lg leading-none font-bold tracking-tight tabular-nums sm:text-[22px]">{formatInt(p.baht)}<span className="ml-1 text-[10px] font-medium text-muted-foreground">บาท</span></span></span><span className={cn("grid size-3.5 shrink-0 place-items-center rounded-full border", checked ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{checked && <Check className="size-2" aria-hidden />}</span></span>
              <span className="mt-2 flex min-h-4 flex-wrap items-center gap-1 text-[9px]">{p.tag ? <span className={cn("rounded px-1 py-0.5 font-medium", p.tag === "popular" ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground")}>{t.tags[p.tag]}</span> : null}{extra > 0 && <span className="font-medium text-primary">+{formatInt(extra)} โบนัส</span>}</span>
              <span className="mt-2 flex items-baseline justify-between gap-1 border-t border-border/80 pt-2"><span className="text-[10px] text-muted-foreground">ได้รับ</span><span className="text-xs font-bold tabular-nums">{formatInt(received.total)} <span className="text-[9px] font-normal text-muted-foreground">เครดิต</span></span></span>
            </RadioCard>;
          })}
          {config.custom.enabled && <RadioCard value={CUSTOM} hideIndicator className="col-span-2 flex items-center gap-3 rounded-xl border-dashed px-4 py-3 data-[state=checked]:border-solid data-[state=checked]:shadow-none sm:col-span-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-primary"><UiIcon name="hand-coins" className="size-5" /></span><span className="flex-1"><span className="block text-xs font-semibold">{t.custom}</span><span className="mt-1 block text-[10px] text-muted-foreground">ตั้งแต่ {CUSTOM_MIN_BAHT}–{formatInt(CUSTOM_MAX_BAHT)} บาท</span></span><span className={cn("grid size-4 place-items-center rounded-full border", selected === CUSTOM ? "border-primary bg-primary text-primary-foreground" : "border-input")}>{selected === CUSTOM ? <Check className="size-2.5" aria-hidden /> : null}</span>
          </RadioCard>}
        </RadioCardGroup>
        {config.custom.enabled && selected === CUSTOM && <div className="mt-3 rounded-xl border border-primary/20 bg-primary-soft/25 p-4"><label htmlFor={customId} className="mb-2 block text-xs font-semibold">{t.customLabel}</label><div className="relative"><span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">฿</span><input id={customId} inputMode="numeric" autoFocus value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, "").slice(0, 5))} aria-invalid={!customValid} aria-describedby={`${customId}-hint`} className="h-12 w-full rounded-lg border border-input bg-surface pr-4 pl-8 text-base tabular-nums focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring aria-[invalid=true]:border-danger" /></div><p id={`${customId}-hint`} className={cn("mt-2 text-[10px] leading-5", customValid ? "text-muted-foreground" : "text-danger")}>{fmt(customValid ? t.customHint : t.customError, { min: CUSTOM_MIN_BAHT, max: formatInt(CUSTOM_MAX_BAHT) })}</p></div>}
      </section>

      <aside aria-label={t.summaryTitle} className="min-w-0 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-sm font-bold">{t.summaryTitle}</h2><span className="text-[9px] font-medium tracking-widest text-muted-foreground">TOP UP</span></div>
          <div className="p-5">
            <div className="relative isolate overflow-hidden rounded-xl bg-[#1463e8] p-5 text-white"><div aria-hidden className="absolute -top-8 -right-5 -z-10 size-36 rounded-full border-[18px] border-white/10" /><p className="text-[11px] text-white/75">{t.rowTotal}</p><p aria-live="polite" aria-atomic="true" className="mt-2 flex items-baseline gap-2 text-[42px] leading-none font-bold tracking-tight tabular-nums"><span>{formatInt(quote.total)}</span><span className="text-xs font-medium tracking-normal text-white/80">เครดิต</span></p><p className="mt-3 text-[10px] text-white/65">รวมโบนัสที่ได้รับจากรายการนี้แล้ว</p></div>
            <div className="mt-5 grid gap-3"><SummaryRow label={t.rowPackage} value={fmt(t.price, { n: formatInt(quote.baht) })} /><SummaryRow label={t.rowCoins} value={formatInt(quote.coins)} />{quote.bonus > 0 && <SummaryRow label={t.rowBonus} value={`+${formatInt(quote.bonus)}`} accent />}{quote.promo > 0 && <SummaryRow label={fmt(t.rowPromo, { pct: FIRST_TOPUP_BONUS_PCT })} value={`+${formatInt(quote.promo)}`} accent />}</div>
            <div className="mt-5 border-t border-dashed border-border pt-4"><SummaryRow label={t.rowAfter} value={`${formatCoinsFixed(balance + quote.total)} เครดิต`} /></div>
            {/* ช่องทางชำระ */}
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold">{t.methodTitle}</p>
              <RadioCardGroup aria-label={t.methodAria} value={method} onValueChange={(v) => setMethod(v as Method)} className="grid-cols-1 gap-2">
                {METHODS.map((m) => {
                  const checked = method === m;
                  const unavailable = m === "truemoney_wallet" ? !methods.truemoneyWalletEnabled : m === "truemoney" ? !methods.truemoneyEnabled : false;
                  return (
                    <RadioCard key={m} value={m} disabled={unavailable} hideIndicator className="flex flex-col items-start gap-2 rounded-xl p-3 data-[state=checked]:bg-primary-soft/35 data-[state=checked]:shadow-none">
                      <span className="flex w-full items-center justify-between">
                        <span className="grid h-8 w-[4.5rem] place-items-center rounded-lg border border-border bg-white px-1.5">
                          <Image src={LOGOS[m].src} alt={LOGOS[m].alt} width={LOGOS[m].w} height={LOGOS[m].h} className="h-auto max-h-6 w-full object-contain" />
                        </span>
                        <span className={cn("grid size-3.5 shrink-0 place-items-center rounded-full border", checked ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                          {checked && <Check className="size-2" aria-hidden />}
                        </span>
                      </span>
                      <span>
                        <span className="block text-xs leading-4 font-semibold">{t.methods[m].name}</span>
                        <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{unavailable ? "ยังไม่เปิดให้บริการ" : t.methods[m].desc}</span>
                      </span>
                    </RadioCard>
                  );
                })}
              </RadioCardGroup>
            </div>
            <Button
              size="lg"
              block
              className={cn("mt-4 h-12 rounded-xl text-sm", method !== "promptpay" && "bg-[#ff8200] text-white hover:bg-[#e67500]")}
              disabled={!canPay || creating || (method === "truemoney_wallet" && !methods.truemoneyWalletEnabled) || (method === "truemoney" && !methods.truemoneyEnabled)}
              onClick={() => (method === "truemoney" ? setTmOpen(true) : void startPromptPay())}
            >
              {creating ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <UiIcon name={method !== "promptpay" ? "wallet-balance" : "qr-code"} className="size-5" />}
              {fmt(t.payWith[method], { n: formatInt(baht) })}
              <ArrowRight className="ml-auto size-4" aria-hidden />
            </Button>
            <p className="mt-3 flex items-start justify-center gap-1.5 text-[10px] leading-5 text-muted-foreground"><ShieldCheck className="mt-1 size-3 shrink-0" aria-hidden />{t.secure}</p>
          </div>
          <p className="flex items-start gap-2 border-t border-border bg-surface-2/50 px-5 py-3 text-[10px] leading-5 text-muted-foreground"><CircleHelp className="mt-1 size-3 shrink-0" aria-hidden />{method === "truemoney" ? t.truemoney.note : method === "truemoney_wallet" ? t.walletTransfer.description : t.qrSample}</p>
        </div>
      </aside>

      <div className="grid min-w-0 gap-5 lg:col-start-1">
        {children}
      </div>
      <TrueMoneyDialog open={tmOpen} onOpenChange={setTmOpen} baht={baht} coins={quote.total} enabled={methods.truemoneyEnabled} />
      <QrDialog ticket={qr} onClose={() => setQr(null)} onRenew={() => void startPromptPay()} slipEnabled={methods.slipEnabled} />
    </div>
  );
}
