import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Check,
  Coins,
  Download,
  HelpCircle,
  History,
  ImagePlus,
  Layers,
  MessageCircle,
  MessagesSquare,
  ScanSearch,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { GameIcon } from "@/components/shared/game-icon";
import { POSTER_SPOTS, PosterMock } from "@/components/shared/poster-mock";
import { Logo } from "@/components/shared/logo";
import { DemoGrid } from "./demo-grid";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { copy } from "@/lib/copy";
import { featuredSkins, getCatalog } from "@/lib/catalog";
import { GAMES, type GameConfig } from "@/lib/games";
import { MOCK_STATS } from "@/lib/mock";
import { FREEFIRE_PRICE_PER_POSTER, PRICE_PER_SKIN, TEMPLATE_PRICES, discountPercent } from "@/lib/pricing";
import { formatCoins, formatInt } from "@/lib/format";
import { cn, fmt } from "@/lib/utils";

const L = copy.landing;

/* ─────────────── helpers ─────────────── */
function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-24 border-t border-border px-5 py-16 sm:px-10 sm:py-24", className)}>
      {children}
    </section>
  );
}

function SectionTitle({ title, highlight, description, className }: { title: string; highlight?: string; description?: string; className?: string }) {
  return (
    <Reveal className={cn("mx-auto max-w-2xl text-center", className)}>
      <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
        {title}
        {highlight && (
          <>
            <br />
            {highlight}
          </>
        )}
      </h2>
      {description && <p className="mt-3 text-base text-pretty text-muted-foreground">{description}</p>}
    </Reveal>
  );
}

function SideTitle({ title, line2, description, children }: { title: string; line2: string; description: string; children?: React.ReactNode }) {
  return (
    <Reveal>
      <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
        {title}
        <br />
        {line2}
      </h2>
      <p className="mt-4 max-w-sm text-muted-foreground">{description}</p>
      {children}
    </Reveal>
  );
}

/** สกินคละระดับสำหรับ demo กริด (เลือกฝั่ง server เพื่อไม่ต้องส่ง catalog ทั้งก้อนไป client) */
function demoSkins(game: "rov" | "mlbb", n: number) {
  const all = getCatalog(game).skins;
  const step = Math.max(1, Math.floor(all.length / n));
  return all.filter((_, i) => i % step === 0).slice(0, n);
}

const catalogStats = (g: GameConfig) => {
  if (g.mode !== "library") return null;
  const c = getCatalog(g.slug);
  return { heroes: c.heroes.length, skins: c.skins.length, preview: featuredSkins(c.game, 9) };
};

/* ─────────────── Hero ─────────────── */
export function Hero() {
  const totalSkins = GAMES.reduce((n, g) => n + (catalogStats(g)?.skins ?? 0), 0);
  return (
    <section className="relative overflow-hidden px-5 pt-14 pb-14 sm:px-10 sm:pt-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-white [mask-image:linear-gradient(to_bottom,black_75%,transparent)] dark:hidden"
      >
        <div className="absolute inset-0 bg-[url('/images/hero-white-gaming.webp')] bg-cover bg-top opacity-55 sm:opacity-85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_70%_at_50%_35%,white_20%,transparent_100%)]" />
      </div>
      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="enter" style={{ animationDelay: "0ms" }}>
        <Link
          href="/generate/rov"
          className="mb-6 inline-flex h-8 items-center gap-2 rounded-full border border-border bg-surface pr-3 pl-1 text-xs font-medium shadow-soft-sm transition-colors hover:bg-surface-2"
        >
          <Badge variant="primary" size="sm">{L.hero.badgeTag}</Badge>
          {L.hero.badge}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        </div>
        <div className="enter" style={{ animationDelay: "80ms" }}>
        <h1 className="text-4xl leading-[1.15] font-bold tracking-tight text-balance sm:text-6xl">
          {L.hero.title}
          <br />
          <span className="text-primary">{L.hero.titleHighlight}</span>
        </h1>
        </div>
        <div className="enter" style={{ animationDelay: "160ms" }}>
        <p className="mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">{L.hero.description}</p>
        </div>
        <div className="enter w-full sm:w-auto" style={{ animationDelay: "240ms" }}>
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/generate/rov">
              {L.hero.ctaPrimary}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="#showcase">{L.hero.ctaSecondary}</Link>
          </Button>
        </div>
        </div>
        <div className="enter" style={{ animationDelay: "320ms" }}>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {L.hero.points.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <span aria-hidden className="size-1 rounded-full bg-muted-foreground/60" />
              {fmt(p, { n: formatInt(totalSkins) })}
            </li>
          ))}
        </ul>
        </div>
      </div>

      <GameRows />
    </section>
  );
}

/* ─────────────── Game rows ─────────────── */
function GameRows() {
  const g = L.gameRows;
  return (
    <div className="enter relative mx-auto mt-14 max-w-6xl scroll-mt-24 overflow-hidden rounded-3xl border border-border bg-surface shadow-soft" style={{ animationDelay: "380ms" }}>
      <span id="games" className="absolute -top-24" aria-hidden />
      <div className="flex items-center gap-2 border-b border-border bg-surface-2/60 px-5 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{g.title}</span>
        <span aria-hidden>/</span>
        <span>{fmt(g.count, { n: GAMES.length })}</span>
      </div>
      <ul className="divide-y divide-border">
        {GAMES.map((game, gi) => {
          const stats = catalogStats(game);
          return (
            <li key={game.slug} style={{ animationDelay: `${480 + gi * 90}ms` }} className="enter grid grid-cols-[minmax(0,1fr)] items-center gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto]">
              {/* ข้อมูลเกม */}
              <div className="flex items-center gap-3">
                <GameIcon game={game} />
                <div className="min-w-0">
                  <p className="text-lg font-semibold">{game.shortName}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats ? fmt(g.stats, { heroes: stats.heroes, skins: formatInt(stats.skins) }) : g.uploadDesc}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {stats ? fmt(g.perSkin, { n: PRICE_PER_SKIN }) : fmt(g.perPoster, { n: FREEFIRE_PRICE_PER_POSTER })}
                  </p>
                </div>
              </div>

              {/* แถบตัวอย่าง */}
              {stats ? (
                <ul
                  aria-label={fmt(g.stripLabel, { game: game.shortName })}
                  className="no-scrollbar flex gap-1.5 overflow-x-auto [mask-image:linear-gradient(to_right,black_80%,transparent)]"
                >
                  {stats.preview.map((s, i) => (
                    <li key={s.id} style={{ animationDelay: `${560 + gi * 90 + i * 35}ms` }} className="enter w-[4.5rem] shrink-0 transition-transform duration-300 hover:-translate-y-1">
                      <SkinThumb skin={s} index={i + 1} compact hideTier className="rounded-lg" priority={i < 3} sizes="72px" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div aria-hidden className="flex items-center gap-2">
                  {g.slots.map((slot) => (
                    <div key={slot} className="grid aspect-[3/4] w-14 shrink-0 place-items-center rounded-lg border border-dashed border-input text-muted-foreground">
                      <ImagePlus className="size-4" />
                    </div>
                  ))}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <div className="grid aspect-square w-20 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 font-mono text-[10px] text-muted-foreground">
                    {g.output}
                  </div>
                </div>
              )}

              {/* ปุ่ม */}
              <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1.5">
                <Button asChild className="rounded-full">
                  <Link href={`/generate/${game.slug}`}>
                    {g.cta}
                    <ArrowUpRight aria-hidden />
                  </Link>
                </Button>
                {stats && (
                  <Link href={`/assets/${game.slug}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Download className="size-3.5" aria-hidden />
                    {g.freeAssets}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─────────────── Stats ─────────────── */
export function Stats() {
  const lib = GAMES.map(catalogStats).filter(Boolean) as NonNullable<ReturnType<typeof catalogStats>>[];
  const values: Record<string, number> = {
    users: MOCK_STATS.users,
    posters: MOCK_STATS.posters,
    heroes: lib.reduce((n, s) => n + s.heroes, 0),
    skins: lib.reduce((n, s) => n + s.skins, 0),
  };
  return (
    <div className="border-t border-border">
    <dl className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4 md:border-x md:border-border">
      {L.stats.items.map((s, i) => (
        <div
          key={s.key}
          className={cn(
            "flex flex-col items-center gap-1 px-4 py-7 text-center",
            i % 2 === 0 && "border-r border-border",
            i < 2 && "border-b border-border md:border-b-0",
            i === 1 && "md:border-r",
          )}
        >
          <dd className="text-3xl font-semibold tabular-nums"><CountUp value={values[s.key]} /></dd>
          <dt className="text-sm text-muted-foreground">{s.label}</dt>
        </div>
      ))}
    </dl>
    </div>
  );
}

/* ─────────────── Showcase ─────────────── */
type CalloutKey = keyof typeof L.showcase.callouts;
const CALLOUTS: { key: CalloutKey; side: "left" | "right"; reach: number }[] = [
  { key: "details", side: "left", reach: 10 },
  { key: "price", side: "left", reach: 10 },
  { key: "skins", side: "left", reach: 48 },
  { key: "hero", side: "right", reach: 120 },
  { key: "rank", side: "right", reach: 52 },
];

/** กล่องคำอธิบาย + เส้นชี้เข้าไปยังจุดบนป้าย (เฉพาะจอใหญ่) */
function Callout({ k, side, reach }: { k: CalloutKey; side: "left" | "right"; reach: number }) {
  const c = L.showcase.callouts[k];
  const card = (
    <div className={cn("w-52 shrink-0 rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft-sm xl:w-56", side === "left" ? "text-right" : "text-left")}>
      <p className="text-sm font-semibold">{c.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
    </div>
  );
  const line = <span aria-hidden className="h-px min-w-6 flex-1 bg-input" />;
  const dot = <span aria-hidden className="relative z-10 size-3 shrink-0 rounded-full border-2 border-primary bg-white shadow-[0_0_0_4px_rgb(20_99_232/0.25)]" />;
  return (
    <div
      className="absolute z-10 flex -translate-y-1/2 items-center"
      style={{ top: `${POSTER_SPOTS[k]}%`, ...(side === "left" ? { left: 0, right: -reach } : { left: -reach, right: 0 }) }}
    >
      {side === "left" ? <>{card}{line}{dot}</> : <>{dot}{line}{card}</>}
    </div>
  );
}

export function Showcase() {
  const keys = CALLOUTS.map((c) => c.key);
  return (
    <Section id="showcase">
      <SectionTitle title={L.showcase.title} description={L.showcase.description} />
      <Reveal y={40} className="relative mx-auto mt-14 max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_26rem_minmax(0,1fr)] lg:gap-0">
        <div className="relative hidden lg:block">
          {CALLOUTS.filter((c) => c.side === "left").map((c) => <Callout key={c.key} k={c.key} side="left" reach={c.reach} />)}
        </div>
        <figure className="mx-auto w-full max-w-[26rem]">
          <PosterMock label={L.showcase.alt} />
        </figure>
        <div className="relative hidden lg:block">
          {CALLOUTS.filter((c) => c.side === "right").map((c) => <Callout key={c.key} k={c.key} side="right" reach={c.reach} />)}
        </div>
      </Reveal>
      <p className="mt-4 text-center text-xs text-muted-foreground">{L.showcase.caption}</p>

      {/* มือถือ / แท็บเล็ต: รายการคำอธิบายใต้ป้าย */}
      <Stagger as="ol" gap={0.06} className="mx-auto mt-10 max-w-md divide-y divide-border border-y border-border lg:hidden">
        {keys.map((k, i) => (
          <StaggerItem as="li" key={k} className="flex gap-4 py-4">
            <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="text-sm font-semibold">{L.showcase.callouts[k].title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{L.showcase.callouts[k].desc}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

/* ─────────────── Features (bento) ─────────────── */
function BentoCard({ title, desc, className, children }: { title: string; desc: string; className?: string; children: React.ReactNode }) {
  return (
    <StaggerItem
      className={cn(
        "flex flex-col gap-5 rounded-3xl border border-border bg-background p-5 transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-soft-lg sm:p-6",
        className,
      )}
    >
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </StaggerItem>
  );
}

function MiniPanel({ icon, label, tag, children }: { icon: React.ReactNode; label: string; tag?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5 [&_svg]:size-3.5">{icon}{label}</span>
        {tag && <Badge variant="outline" size="sm">{tag}</Badge>}
      </div>
      {children}
    </div>
  );
}

export function Features() {
  const f = L.features;
  const detected = featuredSkins("rov", 4, 4);
  return (
    <Section id="features">
      <SectionTitle title={f.title} highlight={f.titleHighlight} description={f.description} />
      <Stagger gap={0.1} className="mx-auto mt-12 grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
        <BentoCard title={f.drag.title} desc={f.drag.desc} className="lg:col-span-2">
          <DemoGrid skins={demoSkins("rov", 16)} />
        </BentoCard>

        <BentoCard title={f.detect.title} desc={f.detect.desc}>
          <MiniPanel icon={<ScanSearch aria-hidden />} label={f.detect.label} tag={f.sampleTag}>
            <Stagger as="ul" gap={0.12} delay={0.3} className="divide-y divide-border">
              {detected.map((s) => (
                <StaggerItem as="li" key={s.id} className="flex items-center gap-3 px-4 py-2">
                  <SkinThumb skin={s} compact hideTier className="w-8 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.name}</span>
                  <Check className="size-4 text-success" aria-hidden />
                </StaggerItem>
              ))}
            </Stagger>
            <p className="border-t border-border px-4 py-2 text-xs font-medium text-success">{fmt(f.detect.found, { n: detected.length })}</p>
          </MiniPanel>
        </BentoCard>

        <BentoCard title={f.decorate.title} desc={f.decorate.desc}>
          <MiniPanel icon={<Layers aria-hidden />} label={f.decorate.label} tag={f.sampleTag}>
            <div className="p-3">
              <PosterMock compact />
            </div>
            <ul className="flex justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {f.decorate.tags.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </MiniPanel>
        </BentoCard>

        <BentoCard title={f.upload.title} desc={f.upload.desc}>
          <div className="flex flex-col items-center gap-3 py-2">
            <div aria-hidden className="grid aspect-square w-40 grid-cols-3 content-center gap-2 rounded-2xl border border-border bg-surface p-3 shadow-soft-sm">
              {["01", "02", "03"].map((n) => (
                <div key={n} className="grid aspect-[3/5] place-items-center rounded-lg border border-dashed border-input font-mono text-[10px] text-muted-foreground">
                  <ImagePlus className="size-3.5" />
                  {n}
                </div>
              ))}
              <p className="col-span-3 text-center font-mono text-[10px] text-muted-foreground">{L.gameRows.output}</p>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImagePlus className="size-3.5" aria-hidden />
              {f.upload.from}
              <ArrowRight className="size-3.5" aria-hidden />
              {f.upload.to}
            </p>
          </div>
        </BentoCard>

        <BentoCard title={f.library.title} desc={f.library.desc}>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Download className="size-3.5" aria-hidden />{f.library.label}</span>
            <span>{f.library.free}</span>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {GAMES.map((g) => (
              <li key={g.slug}>
                <Link href={`/assets/${g.slug}`} className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2">
                  <GameIcon game={g} className="size-8 rounded-lg text-[9px]" />
                  <span className="flex-1">{g.name}</span>
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </BentoCard>
      </Stagger>
    </Section>
  );
}

/* ─────────────── Steps ─────────────── */
export function Steps() {
  return (
    <Section id="steps">
      <SectionTitle title={L.steps.title} description={L.steps.description} />
      <Stagger as="ol" gap={0.12} className="mx-auto mt-12 max-w-6xl border-b border-border">
        {L.steps.items.map((s, i) => (
          <StaggerItem as="li" key={s.title} className="grid grid-cols-[3rem_1fr] gap-x-4 gap-y-1 border-t border-border py-6 md:grid-cols-[4rem_14rem_1fr] md:items-center">
            <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-2xl font-semibold">{s.title}</h3>
            <p className="col-start-2 text-muted-foreground md:col-start-3">{s.desc}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

/* ─────────────── Pricing ─────────────── */
function PriceCell({ value, strike, badge, label, className }: { value: string; strike?: string; badge?: string; label: string; className?: string }) {
  return (
    <div className={cn("bg-surface p-5", className)}>
      <p className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {strike && <s className="text-sm text-muted-foreground">{strike}</s>}
        {badge && <Badge variant="danger" size="sm" className="self-center">{badge}</Badge>}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function Pricing() {
  const p = L.pricing;
  const coins = (n: number) => fmt(p.coins, { n: formatCoins(n) });
  const tpl = (id: "a" | "b") => {
    const { price, compareAtPrice } = TEMPLATE_PRICES[id];
    const off = discountPercent(price, compareAtPrice);
    return {
      value: fmt(p.plusCoins, { n: formatCoins(price) }),
      strike: compareAtPrice ? formatCoins(compareAtPrice) : undefined,
      badge: off ? fmt(p.discount, { n: off }) : undefined,
    };
  };
  return (
    <Section id="pricing">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.4fr]">
        <SideTitle title={p.title} line2={p.titleLine2} description={p.description}>
          <Link href="/topup" className="mt-5 inline-flex items-center gap-2 text-sm font-medium hover:text-primary">
            <Wallet className="size-4" aria-hidden />
            {p.topup}
          </Link>
        </SideTitle>
        <Reveal delay={0.1} className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          <PriceCell value={p.cells.free.value} label={p.cells.free.label} />
          <PriceCell value={coins(PRICE_PER_SKIN)} label={p.cells.rov} />
          <PriceCell value={coins(PRICE_PER_SKIN)} label={p.cells.mlbb} />
          <PriceCell value={coins(FREEFIRE_PRICE_PER_POSTER)} label={p.cells.freefire} />
          <PriceCell {...tpl("a")} label={p.cells.templateA} />
          <PriceCell {...tpl("b")} label={p.cells.templateB} />
          <PriceCell value={p.cells.watermark.value} label={p.cells.watermark.label} className="sm:col-span-2" />
        </Reveal>
      </div>
    </Section>
  );
}

/* ─────────────── FAQ ─────────────── */
const FAQ_ICONS = [Coins, Download, Calculator, History, ArrowLeftRight, Smartphone];

export function Faq() {
  const q = L.faq;
  return (
    <Section id="faq">
      <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Badge variant="soft" size="lg" className="mb-4">
          <HelpCircle aria-hidden />
          {fmt(q.badge, { n: q.items.length })}
        </Badge>
        <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{q.title}</h2>
        <p className="mt-3 text-pretty text-muted-foreground">{q.description}</p>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* รายการคำถาม */}
        <Accordion type="single" collapsible defaultValue="q0">
          <Stagger as="ul" gap={0.06} className="grid gap-3">
            {q.items.map((item, i) => {
              const Icon = FAQ_ICONS[i % FAQ_ICONS.length];
              return (
                <StaggerItem as="li" key={item.q}>
                  <AccordionItem
                    value={`q${i}`}
                    className="group/faq overflow-hidden transition-[border-color,background-color,box-shadow] duration-300 hover:border-primary/30 data-[state=open]:border-primary/40 data-[state=open]:bg-primary-soft/40 data-[state=open]:shadow-soft"
                  >
                    <AccordionTrigger className="gap-4 px-4 py-4 hover:text-foreground sm:px-5">
                      <span className="flex min-w-0 flex-1 items-center gap-3.5">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted-foreground transition-colors group-data-[state=open]/faq:bg-primary group-data-[state=open]/faq:text-primary-foreground">
                          <Icon className="size-[18px]" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                          <span className="block text-[15px] leading-snug font-semibold">{item.q}</span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pr-5 pb-5 pl-[4.375rem] text-[15px] leading-relaxed sm:pl-[4.625rem]">{item.a}</AccordionContent>
                  </AccordionItem>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Accordion>

        {/* การ์ดติดต่อทีมงาน */}
        <Reveal delay={0.15} className="lg:sticky lg:top-24">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-soft-lg">
            <div aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-primary/50 blur-3xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 size-40 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="relative">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <MessagesSquare className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{q.supportTitle}</h3>
              <p className="mt-2 text-sm text-white/70">{q.supportDesc}</p>
              <ul className="mt-5 grid gap-2.5 text-sm">
                {q.supportPoints.map((pt) => (
                  <li key={pt} className="flex items-center gap-2.5 text-white/85">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/90">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" block className="mt-6 rounded-full">
                <Link href="/chat">
                  <MessageCircle aria-hidden />
                  {q.contact}
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ─────────────── Final CTA ─────────────── */
export function FinalCta() {
  const c = L.finalCta;
  return (
    <Section className="relative isolate overflow-hidden bg-surface text-center dark:bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 dark:hidden">
        <Image
          src="/images/cta-skin-posters-white.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-50 sm:opacity-90"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_90%_at_50%_50%,white_35%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,white,transparent_18%,transparent_82%,white)]" />
      </div>
      <Stagger gap={0.1} className="relative mx-auto max-w-3xl">
      <StaggerItem><Logo className="mx-auto" /></StaggerItem>
      <StaggerItem>
      <h2 className="mt-6 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
        {c.title}
        <br />
        <span className="text-primary">{c.titleLine2}</span>
      </h2>
      </StaggerItem>
      <StaggerItem>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">{c.description}</p>
      </StaggerItem>
      <StaggerItem as="ul" className="mt-8 flex flex-wrap justify-center gap-3">
        {GAMES.map((g, i) => (
          <li key={g.slug}>
            <Button asChild variant={i === 0 ? "primary" : "outline"} className="rounded-full pl-1.5">
              <Link href={`/generate/${g.slug}`}>
                <GameIcon game={g} className="size-8 rounded-full text-[8px]" />
                {fmt(c.gameCta, { game: g.name })}
                <ArrowUpRight aria-hidden />
              </Link>
            </Button>
          </li>
        ))}
      </StaggerItem>
      </Stagger>
    </Section>
  );
}
