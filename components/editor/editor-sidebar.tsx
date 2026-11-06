"use client";

import { useEffect, useRef, useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Layers, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copy } from "@/lib/copy";
import { cn, fmt } from "@/lib/utils";
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
import { useEditorStep } from "./use-editor-step";

const c = copy.editor.picker;
/** หน่วงเวลาก่อนเปิดแผงเมื่อชี้ (กันแผงสลับไปมาตอนลากเมาส์ผ่านหลายแถว) */
const OPEN_DELAY = 110;
/** หน่วงเวลาก่อนปิดเมื่อเมาส์ออก (เผื่อเวลาเลื่อนจากรายการไปที่แผง) */
const CLOSE_DELAY = 300;

/**
 * แถบคลังสกินด้านซ้าย (จอใหญ่เท่านั้น) — กดฮีโร่/ระดับ แล้วแผงสกินลอยออกมาด้านขวา
 * มือถือใช้ SkinPicker (bottom sheet) แทน
 */
export function EditorSidebar() {
  const { game, step } = useEditorStep();
  if (game.mode !== "library" || step !== "grid") return null;
  return <SidebarInner key={game.slug} game={game.slug} />;
}

function SidebarInner({ game }: { game: ReturnType<typeof useEditorStep>["game"]["slug"] }) {
  const [tab, setTab] = useState<BrowseTab>("heroes");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<SkinGroup | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { selected, toggle, toggleAll } = useSkinSelection(game);
  const counts = useBrowseCounts(game);
  const current = useGroupSkins(game, group, query);
  const allPicked = !!current && current.skins.length > 0 && current.skins.every((s) => selected.has(s.id));

  // ── hover intent: ชี้แล้วเปิด / ออกจากทั้งรายการและแผงแล้วปิด
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cancelClose = () => clearTimeout(closeTimer.current);
  const hoverOpen = (g: SkinGroup) => {
    cancelClose();
    clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setGroup(g), OPEN_DELAY);
  };
  const scheduleClose = () => {
    clearTimeout(openTimer.current);
    cancelClose();
    closeTimer.current = setTimeout(() => setGroup(null), CLOSE_DELAY);
  };
  useEffect(() => () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  return (
    <PopoverPrimitive.Root open={!!current} onOpenChange={(o) => !o && setGroup(null)}>
      <PopoverPrimitive.Anchor asChild>
        <aside aria-label={c.sidebarAria} className="hidden w-[19rem] shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as BrowseTab);
              setGroup(null);
            }}
          >
            <TabsList className="h-auto w-full justify-start gap-4 rounded-none border-b border-border bg-transparent px-4 py-0">
              {(
                [
                  ["heroes", c.tabHeroes, counts.heroes, User],
                  ["tiers", c.tabTiers, counts.tiers, Layers],
                ] as const
              ).map(([value, label, n, Icon]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="-mb-px h-12 rounded-none border-b-2 border-transparent px-1 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  <Icon aria-hidden />
                  {label}
                  <span className="text-xs tabular-nums opacity-60">{n}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (group?.kind === "hero") setGroup(null);
                }}
                placeholder={tab === "heroes" ? c.searchHeroes : c.search}
                aria-label={c.searchAria}
                className="h-10 w-full rounded-full border border-input bg-surface-2/60 pr-3 pl-10 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
              />
            </div>
          </div>

          <div
            ref={listRef}
            onPointerLeave={(e) => e.pointerType === "mouse" && scheduleClose()}
            className="min-h-0 flex-1 overflow-y-auto px-2 py-2"
          >
            {tab === "heroes" ? (
              <HeroList
                game={game}
                query={query}
                selected={selected}
                letterHeaders={false}
                activeId={group?.kind === "hero" ? group.id : undefined}
                onOpen={(id) => {
                  clearTimeout(openTimer.current);
                  setGroup({ kind: "hero", id });
                }}
                onHover={(id) => hoverOpen({ kind: "hero", id })}
              />
            ) : (
              <TierList
                game={game}
                query={query}
                selected={selected}
                activeCode={group?.kind === "tier" ? group.code : undefined}
                onOpen={(code) => {
                  clearTimeout(openTimer.current);
                  setGroup({ kind: "tier", code });
                }}
                onHover={(code) => hoverOpen({ kind: "tier", code })}
              />
            )}
          </div>
        </aside>
      </PopoverPrimitive.Anchor>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="right"
          align="start"
          sideOffset={-4}
          alignOffset={60}
          collisionPadding={16}
          // คลิกฮีโร่อื่นในรายการ = สลับแผง ไม่ใช่ปิด
          onInteractOutside={(e) => {
            if (listRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerEnter={cancelClose}
          onPointerLeave={(e) => e.pointerType === "mouse" && scheduleClose()}
          className="z-40 flex max-h-[calc(100dvh-14rem)] w-[min(38rem,calc(100vw-22rem))] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-soft-lg outline-none data-[state=open]:animate-pop"
        >
          {current && (
            <>
              <div className="flex items-center gap-3 border-b border-border px-5 py-3">
                <p className="min-w-0 flex-1 truncate">
                  <span className="text-sm text-muted-foreground">{group?.kind === "hero" ? c.heroPanel : c.tierPanel}</span>{" "}
                  <span className="font-semibold">{current.title}</span>
                </p>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {fmt(c.selectedOfHero, { selected: current.skins.filter((s) => selected.has(s.id)).length, total: current.skins.length })}
                </span>
                {current.skins.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(current.skins.map((s) => s.id))}>
                    {allPicked ? c.clearHero : c.selectAllHero}
                  </Button>
                )}
                <PopoverPrimitive.Close asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={c.closePanel}>
                    <X aria-hidden />
                  </Button>
                </PopoverPrimitive.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {current.skins.length ? (
                  <SkinTileGrid
                    skins={current.skins}
                    selected={selected}
                    onToggle={toggle}
                    showHero={group?.kind === "tier"}
                    className={cn("grid-cols-3 sm:grid-cols-4")}
                  />
                ) : (
                  <EmptyResult q={query} />
                )}
              </div>
            </>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
