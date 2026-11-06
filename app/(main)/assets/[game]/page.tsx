import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Images, LayoutGrid, Search, SearchX, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GameIcon } from "@/components/shared/game-icon";
import { AssetCard } from "@/components/assets/asset-card";
import { SortSelect } from "@/components/assets/sort-select";
import { copy } from "@/lib/copy";
import { GAMES, getGame } from "@/lib/games";
import { assetsHref, pageList, queryAssets, type AssetQuery } from "@/lib/assets";
import { formatInt } from "@/lib/format";
import { cn, fmt } from "@/lib/utils";

const c = copy.library;

export function generateStaticParams() {
  return GAMES.map((g) => ({ game: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const game = getGame((await params).game);
  return game ? { title: fmt(c.title, { game: game.shortName }), description: c.description } : {};
}

const chip = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-medium transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-surface-2",
  );

export default async function AssetsPage({ params, searchParams }: { params: Promise<{ game: string }>; searchParams: Promise<AssetQuery> }) {
  const game = getGame((await params).game);
  if (!game) notFound();
  const result = queryAssets(game.slug, await searchParams);
  const portrait = game.slug === "mlbb";

  return (
    <div className="mx-auto max-w-7xl px-5 pt-8 pb-16 sm:px-10">
      {/* แถบบน */}
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft aria-hidden />
            {c.back}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href={`/generate/${game.slug}`}>
            <LayoutGrid aria-hidden />
            {fmt(c.makePoster, { game: game.shortName })}
          </Link>
        </Button>
      </div>

      {/* หัวหน้า */}
      <header className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-background p-5 sm:flex-row sm:p-8 sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            {c.eyebrow} · {game.shortName}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{fmt(c.title, { game: game.shortName })}</h1>
          <p className="mt-2 text-muted-foreground">{c.description}</p>
        </div>
        {result && (
          <div className="flex w-fit items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft-sm">
            <Images className="size-5 text-primary" aria-hidden />
            <div>
              <p className="text-xs text-muted-foreground">{c.totalFiles}</p>
              <p className="text-xl font-bold tabular-nums">{formatInt(result.grandTotal)}</p>
            </div>
          </div>
        )}
      </header>

      {/* เลือกเกม */}
      <nav aria-label={c.gamesAria} className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {GAMES.map((g) => (
          <Link key={g.slug} href={`/assets/${g.slug}`} aria-current={g.slug === game.slug ? "page" : undefined} className={cn(chip(g.slug === game.slug), "pl-1.5")}>
            <GameIcon game={g} className="size-6 rounded-full" />
            {g.shortName}
          </Link>
        ))}
      </nav>

      {!result ? (
        /* เกมที่ยังไม่มีคลังภาพ */
        <Card className="mt-8 flex flex-col items-center gap-3 border-dashed p-10 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Upload className="size-6" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold">{fmt(c.emptyTitle, { game: game.shortName })}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{c.emptyDesc}</p>
          <Button asChild className="mt-2 rounded-full">
            <Link href={`/generate/${game.slug}`}>{fmt(c.makePoster, { game: game.shortName })}</Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* ค้นหา + เรียง (form GET ทำงานได้แม้ไม่มี JS) */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <form action={`/assets/${game.slug}`} className="relative flex-1 sm:max-w-md" role="search">
              {result.sort !== "default" && <input type="hidden" name="sort" value={result.sort} />}
              {result.tier && <input type="hidden" name="tier" value={result.tier} />}
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                name="q"
                defaultValue={result.q}
                placeholder={c.search}
                aria-label={c.searchAria}
                enterKeyHint="search"
                className="h-11 w-full rounded-lg border border-input bg-surface pr-4 pl-11 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
              />
              <button type="submit" className="sr-only">{c.searchSubmit}</button>
            </form>
            <SortSelect game={game.slug} value={result.sort} q={result.q} tier={result.tier} />
          </div>

          {/* chip กรองระดับ + จำนวน */}
          <nav aria-label={c.filterAria} className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            <Link href={assetsHref(game.slug, result, { tier: null, page: 1 })} aria-current={!result.tier ? "true" : undefined} className={chip(!result.tier)}>
              {c.all}
              <span className="tabular-nums opacity-70">{formatInt(result.searchCount)}</span>
            </Link>
            {result.tierCounts.map((t) => (
              <Link
                key={t.code}
                href={assetsHref(game.slug, result, { tier: t.code, page: 1 })}
                aria-current={result.tier === t.code ? "true" : undefined}
                title={t.label}
                className={chip(result.tier === t.code)}
              >
                {t.short === t.label ? t.label : `${t.short} · ${t.label}`}
                <span className="tabular-nums opacity-70">{formatInt(t.count)}</span>
              </Link>
            ))}
          </nav>

          {/* ผลลัพธ์ */}
          {result.items.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-2 py-12 text-center">
              <SearchX className="size-9 text-muted-foreground" aria-hidden />
              <p className="font-medium">{fmt(c.noResults, { q: result.q })}</p>
              <p className="text-sm text-muted-foreground">{c.noResultsDesc}</p>
              <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
                <Link href={`/assets/${game.slug}`}>{c.clearFilters}</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
                {fmt(c.results, { n: formatInt(result.total) })}
              </p>
              <ul className={cn("mt-3 grid gap-x-4 gap-y-6", portrait ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
                {result.items.map((item, i) => (
                  <AssetCard key={item.id} item={item} portrait={portrait} priority={i < 8} />
                ))}
              </ul>

              {/* แบ่งหน้า */}
              {result.pages > 1 && (
                <nav aria-label={c.pagination} className="mt-12 flex flex-wrap items-center justify-center gap-1">
                  <PageLink href={result.page > 1 ? assetsHref(game.slug, result, { page: result.page - 1 }) : undefined}>
                    <ChevronLeft className="size-4" aria-hidden />
                    {c.prev}
                  </PageLink>
                  {pageList(result.page, result.pages).map((n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} aria-hidden className="px-2 text-muted-foreground">…</span>
                    ) : (
                      <PageLink key={n} href={assetsHref(game.slug, result, { page: n })} current={n === result.page} label={fmt(c.page, { n })}>
                        {n}
                      </PageLink>
                    ),
                  )}
                  <PageLink href={result.page < result.pages ? assetsHref(game.slug, result, { page: result.page + 1 }) : undefined}>
                    {c.next}
                    <ChevronRight className="size-4" aria-hidden />
                  </PageLink>
                </nav>
              )}
            </>
          )}
          <p className="mt-10 text-center text-xs text-muted-foreground">{c.credit}</p>
        </>
      )}
    </div>
  );
}

function PageLink({ href, current, label, children }: { href?: string; current?: boolean; label?: string; children: React.ReactNode }) {
  const cls = cn(
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-3 text-sm font-medium tabular-nums transition-colors",
    current ? "bg-secondary text-secondary-foreground" : "hover:bg-surface-2",
    !href && "pointer-events-none opacity-40",
  );
  if (!href) return <span className={cls} aria-disabled>{children}</span>;
  return (
    <Link href={href} aria-label={label} aria-current={current ? "page" : undefined} className={cls} scroll>
      {children}
    </Link>
  );
}
