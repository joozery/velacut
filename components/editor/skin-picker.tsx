"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputWithIcon } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { getCatalog } from "@/lib/catalog";
import type { GameSlug } from "@/lib/games";
import { MAX_SKINS } from "@/lib/pricing";
import { fmt } from "@/lib/utils";
import {
  EmptyResult,
  HeroList,
  SkinTileGrid,
  TierList,
  useBrowseCounts,
  useGroupSkins,
  useSkinSelection,
  type BrowseTab,
  type SkinGroup,
} from "./skin-browser";

const c = copy.editor.picker;

/** หน้าต่างเลือกสกินแบบ bottom sheet (มือถือ / แท็บเล็ต) */
export function SkinPicker({ game, open, onOpenChange }: { game: GameSlug; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tab, setTab] = useState<BrowseTab>("heroes");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<SkinGroup | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selected, count, toggle, toggleAll } = useSkinSelection(game);
  const counts = useBrowseCounts(game);
  const current = useGroupSkins(game, group, query);

  const letters = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = getCatalog(game);
    const list = q
      ? cat.heroes.filter((h) => h.name.toLowerCase().includes(q) || h.skinIds.some((id) => cat.skinById.get(id)!.name.toLowerCase().includes(q)))
      : cat.heroes;
    return [...new Set(list.map((h) => h.letter))];
  }, [game, query]);

  const jumpTo = (letter: string) =>
    scrollRef.current?.querySelector<HTMLElement>(`[data-letter="${letter}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });

  const allPicked = !!current && current.skins.length > 0 && current.skins.every((s) => selected.has(s.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="h-[88dvh]">
        <SheetHeader>
          <SheetTitle>{c.title}</SheetTitle>
          <SheetDescription>{c.description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-5 pb-3">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as BrowseTab);
              setGroup(null);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="heroes" className="flex-1">
                {c.tabHeroes} <span className="tabular-nums opacity-60">{counts.heroes}</span>
              </TabsTrigger>
              <TabsTrigger value="tiers" className="flex-1">
                {c.tabTiers} <span className="tabular-nums opacity-60">{counts.tiers}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <InputWithIcon
            icon={<Search />}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (group?.kind === "hero") setGroup(null);
            }}
            placeholder={c.search}
            aria-label={c.searchAria}
            enterKeyHint="search"
          />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {current ? (
            <SheetBody>
              <div className="sticky top-0 z-10 -mx-5 mb-3 flex items-center gap-2 bg-surface px-5 py-2">
                <Button variant="ghost" size="icon-sm" aria-label={c.backToHeroes} onClick={() => setGroup(null)}>
                  <ChevronLeft aria-hidden />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{current.title}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {fmt(c.selectedOfHero, { selected: current.skins.filter((s) => selected.has(s.id)).length, total: current.skins.length })}
                  </p>
                </div>
                {current.skins.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => toggleAll(current.skins.map((s) => s.id))}>
                    {allPicked ? c.clearHero : c.selectAllHero}
                  </Button>
                )}
              </div>
              {current.skins.length ? (
                <SkinTileGrid skins={current.skins} selected={selected} onToggle={toggle} showHero={group?.kind === "tier"} />
              ) : (
                <EmptyResult q={query} />
              )}
            </SheetBody>
          ) : tab === "heroes" ? (
            <>
              <SheetBody ref={scrollRef} className="pr-11">
                <HeroList game={game} query={query} selected={selected} onOpen={(id) => setGroup({ kind: "hero", id })} />
              </SheetBody>
              {letters.length > 1 && (
                <nav aria-label={c.alphabet} className="absolute top-0 right-1.5 bottom-0 flex flex-col justify-center">
                  <ul className="no-scrollbar flex max-h-full flex-col items-center overflow-y-auto py-1">
                    {letters.map((letter) => (
                      <li key={letter}>
                        <button
                          type="button"
                          onClick={() => jumpTo(letter)}
                          aria-label={fmt(c.jumpTo, { letter })}
                          className="grid h-6 w-7 place-items-center rounded-md text-[11px] font-semibold text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {letter}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </>
          ) : (
            <SheetBody>
              <TierList game={game} query={query} selected={selected} onOpen={(code) => setGroup({ kind: "tier", code })} />
            </SheetBody>
          )}
        </div>

        <SheetFooter className="items-center">
          <p className="flex-1 text-sm font-medium tabular-nums" aria-live="polite">
            {fmt(c.totalSelected, { n: count, max: MAX_SKINS })}
          </p>
          <Button onClick={() => onOpenChange(false)}>{c.done}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
