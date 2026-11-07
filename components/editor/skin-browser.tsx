"use client";

/**
 * ชิ้นส่วนเลือกสกินที่ใช้ร่วมกันระหว่าง
 * - sidebar + แผงลอย (จอใหญ่)  → editor-sidebar.tsx
 * - bottom sheet (มือถือ)        → skin-picker.tsx
 * โมเดลเดียวกัน: แท็บ ฮีโร่ / ระดับ → เลือก "กลุ่ม" → แตะการ์ดสกินเพื่อ toggle
 */
import { useMemo } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronRight, Layers, SearchX } from "lucide-react";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { copy } from "@/lib/copy";
import type { Skin } from "@/lib/catalog";
import { useCatalog } from "@/components/shared/catalog-provider";
import type { GameSlug } from "@/lib/games";
import { MAX_SKINS } from "@/lib/pricing";
import { GAME_TIERS, type LibraryGame } from "@/lib/tiers";
import { cn, fmt } from "@/lib/utils";
import { useEditorStore, useGameEditor } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";

const c = copy.editor.picker;

export type BrowseTab = "heroes" | "tiers";
export type SkinGroup = { kind: "hero"; id: string } | { kind: "tier"; code: string };

const matches = (q: string, ...fields: string[]) => fields.some((f) => f.toLowerCase().includes(q));

/** สถานะการเลือก + action toggle (แจ้งเตือนเมื่อเต็ม) */
export function useSkinSelection(game: GameSlug) {
  const { doc } = useGameEditor(game);
  const toggleSkin = useEditorStore((s) => s.toggleSkin);
  const addSkins = useEditorStore((s) => s.addSkins);
  const setSkins = useEditorStore((s) => s.setSkins);
  const selected = useMemo(() => new Set(doc.skins), [doc.skins]);

  const toggle = (id: string) => {
    if (!toggleSkin(game, id).ok) toast({ title: fmt(c.maxReached, { n: MAX_SKINS }), variant: "error" });
  };
  /** เลือกทั้งกลุ่ม / ยกเลิกทั้งกลุ่ม */
  const toggleAll = (ids: string[]) => {
    if (ids.every((id) => selected.has(id))) {
      const drop = new Set(ids);
      setSkins(game, doc.skins.filter((id) => !drop.has(id)));
    } else {
      const want = ids.filter((id) => !selected.has(id));
      if (addSkins(game, want) < want.length) toast({ title: fmt(c.maxReached, { n: MAX_SKINS }), variant: "error" });
    }
  };
  return { selected, count: doc.skins.length, toggle, toggleAll };
}

/** สกินของกลุ่มที่เลือก (กรองตามคำค้นถ้าเป็นกลุ่มระดับ) */
export function useGroupSkins(game: GameSlug, group: SkinGroup | null, query: string): { title: string; skins: Skin[] } | null {
  const cat = useCatalog(game);
  return useMemo(() => {
    if (!group) return null;
    if (group.kind === "hero") {
      const hero = cat.heroById.get(group.id);
      return hero ? { title: hero.name, skins: hero.skinIds.map((id) => cat.skinById.get(id)!) } : null;
    }
    const q = query.trim().toLowerCase();
    const tier = GAME_TIERS[game as LibraryGame].find((t) => t.code === group.code);
    const skins = cat.skins.filter((s) => s.tier === group.code && (!q || matches(q, s.name, s.heroName)));
    return tier ? { title: tier.short === tier.label ? tier.label : `${tier.short} · ${tier.label}`, skins } : null;
  }, [cat, game, group, query]);
}

export function EmptyResult({ q }: { q: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">{fmt(c.noResults, { q })}</p>
      <p className="text-sm text-muted-foreground">{c.noResultsDesc}</p>
    </div>
  );
}

/** การ์ดสกินที่แตะเพื่อ toggle */
export function SkinTile({ skin, selected, onToggle, showHero }: { skin: Skin; selected: boolean; onToggle: () => void; showHero?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={fmt(c.selectSkin, { name: skin.name, hero: skin.heroName })}
      onClick={onToggle}
      className={cn(
        "relative block w-full rounded-xl transition-[transform,box-shadow] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        selected && "ring-3 ring-primary ring-offset-2 ring-offset-surface",
      )}
    >
      <SkinThumb skin={skin} showHero={showHero} hideTier sizes="150px" />
      <AnimatePresence>
        {selected && (
          <m.span
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 grid place-items-center rounded-xl bg-primary/25"
          >
            <m.span
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.4 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"
            >
              <Check className="size-5" />
            </m.span>
          </m.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function SkinTileGrid({
  skins,
  selected,
  onToggle,
  showHero,
  className,
}: {
  skins: Skin[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  showHero?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-3 gap-2.5 sm:grid-cols-4", className)}>
      {skins.map((s) => (
        <li key={s.id}>
          <SkinTile skin={s} selected={selected.has(s.id)} onToggle={() => onToggle(s.id)} showHero={showHero} />
        </li>
      ))}
    </ul>
  );
}

/** จุดบนรูป = มีสกินจากกลุ่มนี้อยู่ในกริดแล้ว */
function PickedDot() {
  return <span aria-hidden className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-surface bg-primary" />;
}

/** "12 สกิน" หรือ "7/17 สกิน" เมื่อเลือกไปแล้ว */
function PickedCount({ picked, total }: { picked: number; total: number }) {
  return picked > 0 ? (
    <span className="block text-xs font-medium text-foreground tabular-nums">
      <span className="text-primary">{picked}</span>/{fmt(c.heroSkins, { n: total })}
    </span>
  ) : (
    <span className="block text-xs text-muted-foreground tabular-nums">{fmt(c.heroSkins, { n: total })}</span>
  );
}

const rowCls = (active: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring",
    active ? "bg-primary-soft" : "hover:bg-surface-2",
  );

/** รายชื่อฮีโร่ (จัดกลุ่มตามตัวอักษร) */
export function HeroList({
  game,
  query,
  activeId,
  selected,
  onOpen,
  onHover,
  letterHeaders = true,
}: {
  game: GameSlug;
  query: string;
  activeId?: string;
  selected: Set<string>;
  onOpen: (id: string) => void;
  /** เรียกเมื่อเมาส์ชี้ (ไม่รวม touch/ปากกา) */
  onHover?: (id: string) => void;
  letterHeaders?: boolean;
}) {
  const cat = useCatalog(game);
  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const list = q
      ? cat.heroes.filter((h) => matches(q, h.name) || h.skinIds.some((id) => matches(q, cat.skinById.get(id)!.name)))
      : cat.heroes;
    const map = new Map<string, typeof list>();
    for (const h of list) map.set(h.letter, [...(map.get(h.letter) ?? []), h]);
    return [...map.entries()];
  }, [cat, q]);

  if (!groups.length) return <EmptyResult q={query} />;
  return (
    <>
      {groups.map(([letter, heroes]) => (
        <section key={letter} data-letter={letter} aria-label={letter} className="scroll-mt-1">
          {letterHeaders && (
            <h3 className="sticky top-0 z-10 -mx-1 bg-surface px-1 py-1.5 text-xs font-bold text-muted-foreground">{letter}</h3>
          )}
          <ul className="mb-1 grid gap-0.5">
            {heroes.map((h) => {
              const count = h.skinIds.filter((id) => selected.has(id)).length;
              const active = activeId === h.id;
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(h.id)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && onHover?.(h.id)}
                    aria-expanded={active}
                    className={rowCls(active)}
                  >
                    <span className="relative shrink-0">
                      <SkinThumb skin={{ ...cat.skinById.get(h.skinIds[0])!, ...(h.image ? { image: h.image } : {}) }} compact hideTier sizes="48px" className="w-11 rounded-lg" />
                      {count > 0 && <PickedDot />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{h.name}</span>
                      <PickedCount picked={count} total={h.skinIds.length} />
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}

/** รายการระดับสกิน พร้อมจำนวน */
export function TierList({
  game,
  query,
  activeCode,
  selected,
  onOpen,
  onHover,
}: {
  game: GameSlug;
  query: string;
  activeCode?: string;
  selected: Set<string>;
  onOpen: (code: string) => void;
  onHover?: (code: string) => void;
}) {
  const cat = useCatalog(game);
  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () =>
      GAME_TIERS[game as LibraryGame]
        .map((t) => {
          const skins = cat.skins.filter((s) => s.tier === t.code && (!q || matches(q, s.name, s.heroName)));
          return { ...t, total: skins.length, picked: skins.filter((s) => selected.has(s.id)).length };
        })
        .filter((t) => t.total > 0),
    [cat, game, q, selected],
  );
  if (!rows.length) return <EmptyResult q={query} />;
  return (
    <ul className="grid gap-0.5">
      {rows.map((t) => (
        <li key={t.code}>
          <button
            type="button"
            onClick={() => onOpen(t.code)}
            onPointerEnter={(e) => e.pointerType === "mouse" && onHover?.(t.code)}
            aria-expanded={activeCode === t.code}
            className={rowCls(activeCode === t.code)}
          >
            <span className={cn("relative grid h-11 w-11 shrink-0 place-items-center rounded-lg text-[11px] font-bold", t.className)}>
              {t.short.length > 4 ? <Layers className="size-4" aria-hidden /> : t.short}
              {t.picked > 0 && <PickedDot />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{t.label}</span>
              <PickedCount picked={t.picked} total={t.total} />
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** จำนวนฮีโร่ / ระดับ (ใช้บนแท็บ) */
export function useBrowseCounts(game: GameSlug) {
  const cat = useCatalog(game);
  return useMemo(
    () => ({ heroes: cat.heroes.length, tiers: GAME_TIERS[game as LibraryGame].filter((t) => cat.skins.some((s) => s.tier === t.code)).length }),
    [cat, game],
  );
}
