import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Headphones,
  Images,
  Check,
  Download,
  Layers,
  MessageCircle,
  ScanSearch,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { GameIcon } from "@/components/shared/game-icon";
import { PosterMock } from "@/components/shared/poster-mock";
import { DemoGrid } from "./demo-grid";
import { UiIcon } from "@/components/icons/ui-icon";
import { HeroLenis } from "./hero-lenis";
import { PriceCalculator } from "./price-calculator";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { copy } from "@/lib/copy";
import { featuredSkins, getCatalog } from "@/lib/catalog";
import { GAMES, type GameConfig } from "@/lib/games";
import { MOCK_STATS } from "@/lib/mock";
import { cn, fmt } from "@/lib/utils";

const L = copy.landing;

/* ─────────────── helpers ─────────────── */
function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-24 px-5 py-16 sm:px-10 sm:py-24", className)}>
      {children}
    </section>
  );
}

function SectionTitle({ title, highlight, description, className }: { title: string; highlight?: string; description?: string; className?: string }) {
  return (
    <Reveal className={cn("mx-auto max-w-7xl border-l-[3px] border-primary pl-5", className)}>
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

/** สกินคละระดับสำหรับ demo กริด (เลือกฝั่ง server เพื่อไม่ต้องส่ง catalog ทั้งก้อนไป client) */
function demoSkins(game: "mlbb", n: number) {
  const all = getCatalog(game).skins;
  const step = Math.max(1, Math.floor(all.length / n));
  return all.filter((_, i) => i % step === 0).slice(0, n);
}

const catalogStats = (g: GameConfig) => {
  if (g.mode !== "library") return null;
  const c = getCatalog(g.slug);
  return { heroes: c.heroes.length, skins: c.skins.length, preview: featuredSkins(c.game, 9) };
};

/* ─────────────── Studio introduction ─────────────── */
export function Hero() {
  const totalSkins = GAMES.reduce((n, game) => n + (catalogStats(game)?.skins ?? 0), 0);
  return <HeroLenis totalSkins={totalSkins} previewSkins={featuredSkins("mlbb", 4).map(({ id, image }) => ({ id, image }))} />;
}

/* ─────────────── Stats ─────────────── */
const STAT_ICONS = { users: "users", posters: "layout-grid", heroes: "swords", skins: "images" } as const;

export function Stats() {
  const lib = GAMES.map(catalogStats).filter(Boolean) as NonNullable<ReturnType<typeof catalogStats>>[];
  const values: Record<string, number> = {
    users: MOCK_STATS.users,
    posters: MOCK_STATS.posters,
    heroes: lib.reduce((n, s) => n + s.heroes, 0),
    skins: lib.reduce((n, s) => n + s.skins, 0),
  };
  return (
    <section aria-label={fmt(L.stats.aria, { brand: copy.brand.name })} className="px-5 pt-8 pb-2 sm:px-10 sm:pt-10 sm:pb-4">
      <Stagger
        as="ul"
        gap={0.07}
        className="mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-soft-sm lg:grid-cols-4"
      >
        {L.stats.items.map((s, i) => (
          <StaggerItem
            as="li"
            key={s.key}
            className={cn(
              "group flex items-center gap-3 p-4 sm:gap-4 sm:p-6",
              // เส้นคั่น: มือถือ 2×2 / จอใหญ่ 4 ช่องแนวนอน
              i % 2 === 0 && "border-r border-border",
              i < 2 && "border-b border-border lg:border-b-0",
              i === 1 && "lg:border-r",
            )}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:-translate-y-0.5 sm:size-12">
              <UiIcon name={STAT_ICONS[s.key]} className="size-6 sm:size-7" />
            </span>
            <div className="min-w-0">
              <p className="text-xl leading-none font-bold tracking-tight tabular-nums sm:text-[28px]">
                <CountUp value={values[s.key]} />
                {s.key === "users" || s.key === "posters" ? <span className="text-primary">+</span> : null}
              </p>
              <p className="mt-1.5 text-xs font-semibold sm:text-sm">{s.label}</p>
              <p className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">{s.sub}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

/* ─────────────── Showcase ─────────────── */
type CalloutKey = keyof typeof L.showcase.callouts;
/** ภาพป้ายตัวอย่างใน section 01 (public/logo/bannerexam.png, 1641×959) */
const SHOWCASE_POSTER = { src: "/logo/bannerexam.png", width: 1641, height: 959 } as const;

/**
 * ตำแหน่งหมุดบนภาพป้าย (x/y เป็น % ของภาพ) เรียงตามลำดับในรายการด้านขวา
 * หมุดที่ชี้ข้อความวางคร่อมขอบภาพหรือขอบกรอบ เพื่อไม่ให้บังตัวหนังสือ
 */
const MARKERS: { key: CalloutKey; part: "banner" | "grid"; x: number; y: number }[] = [
  { key: "details", part: "banner", x: 0, y: 25 },
  { key: "price", part: "banner", x: 23.5, y: 72 },
  { key: "skins", part: "grid", x: 0, y: 50 },
  { key: "hero", part: "banner", x: 57, y: 12 },
  { key: "rank", part: "banner", x: 100, y: 62 },
];

/** สกินในกริดใต้ป้าย: มือถือ 8 × 2, จอใหญ่ 12 × 2 */
const SHOWCASE_SKINS = featuredSkins("mlbb", 24, 2);

function ShowcaseMarkers({ part }: { part: "banner" | "grid" }) {
  return (
    <ol aria-hidden className="pointer-events-none absolute inset-0">
      {MARKERS.map((m, i) =>
        m.part === part ? (
          <li
            key={m.key}
            className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground shadow-[0_0_0_4px_rgb(20_99_232/0.25)] ring-2 ring-white"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            {String(i + 1).padStart(2, "0")}
          </li>
        ) : null,
      )}
    </ol>
  );
}

export function Showcase() {
  const sc = L.showcase;
  return (
    <Section id="showcase" className="overflow-x-clip bg-surface py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-16">
        {/* ป้ายตัวอย่าง + หมุดเลข 01–05 ชี้ส่วนต่างๆ */}
        <Reveal className="relative mx-auto w-full max-w-[34rem]">
          <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-primary/10 blur-3xl" />
          <figure className="relative">
            <div role="img" aria-label={sc.alt} className="rounded-xl bg-zinc-950 shadow-soft-lg">
              {/* ส่วนหัวป้าย: ข้อมูลไอดี ราคา ตัวละคร แรงค์ */}
              <div className="relative">
                <Image
                  src={SHOWCASE_POSTER.src}
                  width={SHOWCASE_POSTER.width}
                  height={SHOWCASE_POSTER.height}
                  alt=""
                  sizes="(min-width: 640px) 544px, 100vw"
                  className="block h-auto w-full rounded-t-xl"
                />
                <ShowcaseMarkers part="banner" />
              </div>
              {/* กริดสกินในไอดี (การ์ดตัวละครอื่นๆ) */}
              <div className="relative">
                <div aria-hidden className="grid grid-cols-8 gap-px overflow-hidden rounded-b-xl bg-black/60 p-px sm:grid-cols-12">
                  {SHOWCASE_SKINS.map((x, i) => (
                    <SkinThumb key={x.id} skin={x} index={i + 1} compact hideTier size="xs" className={cn("rounded-[3px]", i >= 16 && "hidden sm:block")} sizes="48px" />
                  ))}
                </div>
                <ShowcaseMarkers part="grid" />
              </div>
            </div>
            <figcaption className="mt-3 text-center text-[11px] text-muted-foreground">{sc.caption}</figcaption>
          </figure>
        </Reveal>

        <div>
          <p className="mb-4 font-mono text-[11px] tracking-widest text-primary">{sc.eyebrow}</p>
          <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            {sc.heading}
            <br />
            {sc.headingLine2}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">{sc.lead}</p>
          <Stagger as="ol" gap={0.06} className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-x-6">
            {MARKERS.map((m, i) => {
              const item = sc.callouts[m.key];
              return (
                <StaggerItem as="li" key={m.key} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-mono text-[10px] font-bold text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.desc}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
          <Button asChild size="lg" className="group mt-8 h-12 rounded-xl px-6 shadow-[0_10px_30px_-10px_rgb(20_99_232/0.7)]">
            <Link href="/generate/mlbb">
              {sc.cta}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────── Features (bento) ─────────────── */
function BentoCard({ title, desc, className, children }: { title: string; desc: string; className?: string; children: React.ReactNode }) {
  return (
    <StaggerItem
      className={cn(
        "flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 transition-[box-shadow,border-color] duration-300 hover:border-primary/40 hover:shadow-soft sm:p-6",
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
  const detected = featuredSkins("mlbb", 4, 4);
  return (
    <Section id="features" className="bg-background">
      <SectionTitle title={f.title} highlight={f.titleHighlight} description={f.description} />
      <Stagger gap={0.1} className="mx-auto mt-12 grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
        <BentoCard title={f.drag.title} desc={f.drag.desc} className="lg:col-span-2">
          <DemoGrid skins={demoSkins("mlbb", 16)} />
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

        <BentoCard title={f.library.title} desc={f.library.desc} className="lg:col-span-2">
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
  const icons = [ScanSearch, Layers, Download];
  return (
    <Section id="steps" className="bg-surface py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div><p className="mb-2 font-mono text-[9px] tracking-[0.16em] text-primary">02 — THE CREATIVE PROCESS</p><h2 className="text-2xl leading-snug font-bold tracking-tight sm:text-[28px]">จากสกินที่สะสม<br className="sm:hidden" /><span className="text-primary sm:ml-2">สู่ป้ายที่พร้อมส่งต่อ</span></h2></div>
          <p className="max-w-xs text-xs leading-5 text-muted-foreground">{L.steps.description}</p>
        </div>
        <Stagger as="ol" gap={0.08} className="mt-5 grid overflow-hidden rounded-2xl border border-border bg-surface-2/35 md:grid-cols-3">
          {L.steps.items.map((step, i) => {
            const Icon = icons[i];
            return <StaggerItem as="li" key={step.title} className={cn("flex items-start gap-3 p-4 sm:p-5", i > 0 && "border-t border-border md:border-t-0 md:border-l")}>
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-primary/10 bg-surface text-primary"><Icon className="size-[18px]" strokeWidth={1.7} aria-hidden /></span>
              <div className="min-w-0"><p className="font-mono text-[8px] font-medium tracking-wider text-primary/70">STEP 0{i + 1}</p><h3 className="mt-1 text-sm font-semibold">{step.title}</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{step.desc}</p></div>
            </StaggerItem>;
          })}
        </Stagger>
      </div>
    </Section>
  );
}

/* ─────────────── Pricing ─────────────── */
export function Pricing() {
  const p = L.pricing;
  return (
    <Section id="pricing" className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
        <Reveal>
          <p className="mb-3 font-mono text-[11px] tracking-widest text-primary">{p.eyebrow}</p>
          <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            {p.title}
            <br />
            <span className="text-primary">{p.titleLine2}</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">{p.description}</p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {p.perks.map((perk) => (
              <li key={perk.title} className="flex gap-3 rounded-xl border border-border bg-surface px-3.5 py-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{perk.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{perk.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <Link href="/topup" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Wallet className="size-4" aria-hidden />
            {p.topup}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <PriceCalculator />
        </Reveal>
      </div>
    </Section>
  );
}

/* ─────────────── FAQ ─────────────── */
export function Faq() {
  const q = L.faq;
  return (
    <Section id="faq" className="relative isolate overflow-hidden bg-[#f5f8ff] py-8 text-[#111b35] sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20"><Image src="/images/faq-reference-background-v1.webp" alt="" fill sizes="(max-width: 1023px) 1600px, 100vw" className="object-cover object-right opacity-50 lg:object-center lg:opacity-100" /></div>
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-4 -z-10 hidden text-[130px] leading-none font-black tracking-tighter text-[#1463e8]/5 italic select-none lg:block">FAQ</span>
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-3"><span aria-hidden className="h-px w-9 bg-gradient-to-r from-transparent to-[#1463e8]" /><span className="rounded-full bg-[linear-gradient(120deg,#159bff,#0643dc)] px-5 py-1 text-[11px] font-bold tracking-wide text-white">FAQ</span><span aria-hidden className="h-px w-9 bg-gradient-to-l from-transparent to-[#1463e8]" /></div>
        <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">คำถามที่<span className="text-[#1463e8]">พบบ่อย</span></h2>
        <p className="mt-3 text-xs leading-6 text-[#576178] sm:text-sm">{q.description}</p>
      </div>

      <div className="relative mx-auto mt-7 grid max-w-7xl grid-cols-[minmax(0,1fr)] items-stretch gap-5 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-9 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside aria-label="ติดต่อทีมงานเพิ่มเติม" className="order-2 flex min-w-0 flex-col justify-end lg:order-1 lg:min-h-[25rem]">
          <div className="relative overflow-hidden rounded-2xl border border-[#79b5ff]/60 bg-[linear-gradient(145deg,rgba(24,58,112,0.98),rgba(5,21,51,0.98))] p-5 text-center text-white shadow-[0_0_24px_rgb(20_99_232/0.17),inset_0_1px_0_rgb(174_215_255/0.25)] sm:p-6">
            <div aria-hidden className="pointer-events-none absolute inset-x-8 -bottom-6 h-10 bg-[#1463e8]/40 blur-2xl" />
            <div className="flex items-center justify-center gap-2"><Headphones className="size-6 shrink-0 text-[#bddcff]" strokeWidth={1.7} aria-hidden /><h3 className="text-lg font-bold">{q.supportTitle}</h3></div>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-blue-100/75">หากไม่พบคำตอบที่ต้องการ สามารถติดต่อทีมงานได้เลย</p>
            <Link href="/chat" className="relative mt-4 flex min-h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(110deg,#13b9f0,#0754f4)] px-3 text-xs font-semibold text-white shadow-[0_4px_16px_rgb(0_89_255/0.3)] transition-[filter] hover:brightness-110"><MessageCircle className="size-4" aria-hidden />{q.contact}<ArrowRight className="size-4" aria-hidden /></Link>
          </div>
        </aside>

        <Accordion type="single" collapsible defaultValue="q0" aria-label="คำถามที่พบบ่อย" className="order-1 min-w-0 lg:order-2">
          <div className="grid gap-2.5">
            {q.items.map((item, i) => (
              <AccordionItem key={item.q} value={`q${i}`} className="group/faq overflow-hidden rounded-2xl border-[#cbdcf8] bg-white/95 shadow-[0_2px_5px_rgb(20_75_160/0.08)] transition-[border-color,box-shadow] hover:border-[#93baff] data-[state=open]:border-[#3d92ff] data-[state=open]:shadow-[0_4px_16px_rgb(20_99_232/0.12)]">
                <AccordionTrigger className="min-h-14 gap-3 px-4 py-3 text-[#111b35] hover:text-[#1463e8] data-[state=open]:rounded-b-none data-[state=open]:bg-[linear-gradient(110deg,#13b5f5_0%,#0759ef_25%,#12377f_100%)] data-[state=open]:text-white data-[state=open]:hover:text-white sm:px-5 [&>span:last-child]:bg-transparent [&>span:last-child]:size-6">
                  <span className="flex min-w-0 flex-1 items-center gap-3"><span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-[#1463e8] text-base leading-none font-bold text-white transition-colors group-data-[state=open]/faq:bg-white/85 group-data-[state=open]/faq:text-[#1463e8]">?</span><span className="min-w-0 text-[13px] leading-6 font-semibold sm:text-[15px]">{item.q}</span></span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4 pb-5 sm:px-5"><div className="flex items-center gap-5"><p className="flex-1 text-xs leading-7 text-[#33445f] sm:text-[13px]">{item.a}</p>{i === 0 && <span aria-hidden className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#4387fb] sm:grid"><Images className="size-8" strokeWidth={1.4} /></span>}</div></AccordionContent>
              </AccordionItem>
            ))}
          </div>
        </Accordion>
      </div>
    </Section>
  );
}

/* ─────────────── Final CTA ─────────────── */
export function FinalCta() {
  const c = L.finalCta;
  return (
    <Section id="start-creating" className="bg-background pb-6 sm:pb-6">
      <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-2xl bg-ink px-6 py-10 text-white sm:px-12 sm:py-14">
        <Image src="/images/final-cta-blue-background-v2.webp" alt="" fill sizes="(max-width: 640px) 1200px, 1280px" className="pointer-events-none object-cover object-[72%_center] sm:object-center" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(18,27,48,0.94)_0%,rgba(18,27,48,0.75)_40%,rgba(18,27,48,0.12)_100%)] sm:bg-[linear-gradient(to_right,rgba(18,27,48,0.7)_0%,rgba(18,27,48,0.3)_45%,transparent_100%)]" />
        <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div><p className="mb-5 font-mono text-[10px] tracking-[0.2em] text-accent">YOUR NEXT GREAT POSTER STARTS HERE.</p><h2 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">{c.title}<br /><span className="text-accent">{c.titleLine2}</span></h2><p className="mt-5 max-w-md text-sm leading-6 text-white/65">{c.description}</p></div>
          <div className="flex flex-col gap-2.5">{GAMES.map((game) => <Link key={game.slug} href={`/generate/${game.slug}`} className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#1463e8] shadow-soft transition-colors hover:bg-blue-50"><GameIcon game={game} className="size-8 rounded-lg" /><span className="min-w-0 flex-1">เริ่มออกแบบ {game.shortName}</span><ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" /></Link>)}</div>
        </div>
      </div>
    </Section>
  );
}
