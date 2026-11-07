"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GameSlug } from "@/lib/games";
import { getCatalog } from "@/lib/catalog";
import { MAX_SKINS, type TemplateId } from "@/lib/pricing";
import type { RankId } from "@/lib/ranks";

/**
 * เอกสารที่ undo/redo ได้ — Phase 3 จะเพิ่ม template / decoration เข้ามาใน type นี้
 */
export type Decoration = {
  code: string;
  heroes: number;
  price: number;
  winrate: number;
  matches: number;
  down: number;
  honor: number;
  tagline: string;
  accent: string;
  coverId: string;
  /** แรงค์ของไอดี (ตราแรงค์ในเกม) — ไม่เลือก = ไม่แสดงบนป้าย */
  rank?: RankId;
};

export const DEFAULT_DECORATION: Decoration = { code: "", heroes: 0, price: 0, winrate: 0, matches: 0, down: 0, honor: 0, tagline: "พร้อมเปลี่ยนเมลทันที", accent: "#fcd34d", coverId: "" };

export type EditorDoc = {
  /** id สกินตามลำดับในกริด */
  skins: string[];
  /** จำนวนคอลัมน์ที่ผู้ใช้เลือก (null = ให้ระบบเลือก) */
  cols: number | null;
  /** แบบป้าย (step template) */
  template: TemplateId;
  decoration?: Decoration;
  /** รูปแบบไฟล์ที่จะดาวน์โหลด (step checkout) — clean = ไม่มีลายน้ำ (ตัดเครดิต), watermark = ฟรีแบบมีลายน้ำ */
  output?: OutputMode;
};

export type OutputMode = "clean" | "watermark";

export type GameEditorState = {
  doc: EditorDoc;
  past: EditorDoc[];
  future: EditorDoc[];
  /** จำนวนคอลัมน์ในพื้นที่ทำงาน (ค่าแสดงผล ไม่ใช่ layout ของภาพจริง และไม่เก็บใน history) */
  viewCols: number;
};

const HISTORY_LIMIT = 50;
export const DEFAULT_VIEW_COLS = 6;
export const VIEW_COLS_MIN = 2;
export const VIEW_COLS_MAX = 10;

const EMPTY_DOC: EditorDoc = { skins: [], cols: null, template: "none" };
export const EMPTY_GAME_STATE: GameEditorState = { doc: EMPTY_DOC, past: [], future: [], viewCols: DEFAULT_VIEW_COLS };

type Result = { ok: true } | { ok: false; reason: "max" };

type EditorStore = {
  games: Partial<Record<GameSlug, GameEditorState>>;
  hasHydrated: boolean;

  toggleSkin: (game: GameSlug, skinId: string) => Result;
  addSkins: (game: GameSlug, skinIds: string[]) => number;
  setSkins: (game: GameSlug, skinIds: string[]) => void;
  removeSkin: (game: GameSlug, skinId: string) => void;
  moveSkin: (game: GameSlug, fromId: string, toId: string) => void;
  clear: (game: GameSlug) => void;
  sortByTier: (game: GameSlug) => void;
  setCols: (game: GameSlug, cols: number) => void;
  setTemplate: (game: GameSlug, template: TemplateId) => void;
  setDecoration: (game: GameSlug, patch: Partial<Decoration>) => void;
  setOutput: (game: GameSlug, output: OutputMode) => void;
  setViewCols: (game: GameSlug, cols: number) => void;
  /** โหลดป้ายที่เคยสร้างกลับมาแก้ไข (undo ได้) */
  loadDoc: (game: GameSlug, doc: EditorDoc, viewCols: number) => void;
  undo: (game: GameSlug) => void;
  redo: (game: GameSlug) => void;
};

const sameDoc = (a: EditorDoc, b: EditorDoc) =>
  a.cols === b.cols && a.template === b.template && a.output === b.output && JSON.stringify(a.decoration) === JSON.stringify(b.decoration) && a.skins.length === b.skins.length && a.skins.every((s, i) => s === b.skins[i]);

const dedupe = (ids: string[]) => Array.from(new Set(ids));

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => {
      const getGame = (game: GameSlug) => get().games[game] ?? EMPTY_GAME_STATE;

      /** บันทึก doc ใหม่ + push history (ข้ามถ้าไม่มีอะไรเปลี่ยน) */
      const commit = (game: GameSlug, next: (doc: EditorDoc) => EditorDoc) => {
        const g = getGame(game);
        const doc = next(g.doc);
        if (sameDoc(doc, g.doc)) return;
        set((s) => ({
          games: {
            ...s.games,
            [game]: { ...g, doc, past: [...g.past, g.doc].slice(-HISTORY_LIMIT), future: [] },
          },
        }));
      };

      return {
        games: {},
        hasHydrated: false,

        toggleSkin: (game, skinId) => {
          const { skins } = getGame(game).doc;
          if (skins.includes(skinId)) {
            commit(game, (d) => ({ ...d, skins: d.skins.filter((id) => id !== skinId) }));
            return { ok: true };
          }
          if (skins.length >= MAX_SKINS) return { ok: false, reason: "max" };
          commit(game, (d) => ({ ...d, skins: [...d.skins, skinId] }));
          return { ok: true };
        },

        addSkins: (game, skinIds) => {
          const { skins } = getGame(game).doc;
          const fresh = dedupe(skinIds).filter((id) => !skins.includes(id));
          const room = Math.max(0, MAX_SKINS - skins.length);
          const toAdd = fresh.slice(0, room);
          if (toAdd.length) commit(game, (d) => ({ ...d, skins: [...d.skins, ...toAdd] }));
          return toAdd.length;
        },

        setSkins: (game, skinIds) => {
          const catalog = getCatalog(game);
          const valid = dedupe(skinIds).filter((id) => catalog.skinById.has(id)).slice(0, MAX_SKINS);
          commit(game, (d) => ({ ...d, skins: valid }));
        },

        removeSkin: (game, skinId) => commit(game, (d) => ({ ...d, skins: d.skins.filter((id) => id !== skinId) })),

        moveSkin: (game, fromId, toId) =>
          commit(game, (d) => {
            const from = d.skins.indexOf(fromId);
            const to = d.skins.indexOf(toId);
            if (from < 0 || to < 0 || from === to) return d;
            const skins = [...d.skins];
            skins.splice(to, 0, skins.splice(from, 1)[0]);
            return { ...d, skins };
          }),

        clear: (game) => commit(game, (d) => ({ ...EMPTY_DOC, template: d.template })),

        /** "AI เรียง": tier สูงก่อน, tier เท่ากันคงลำดับเดิม (stable sort) */
        sortByTier: (game) => {
          const { skinById } = getCatalog(game);
          commit(game, (d) => ({
            ...d,
            skins: d.skins
              .map((id, i) => ({ id, i, rank: skinById.get(id)?.tierRank ?? 0 }))
              .sort((a, b) => b.rank - a.rank || a.i - b.i)
              .map((x) => x.id),
          }));
        },

        setCols: (game, cols) => commit(game, (d) => ({ ...d, cols })),

        setTemplate: (game, template) => commit(game, (d) => ({ ...d, template })),
        setOutput: (game, output) => commit(game, (d) => ({ ...d, output })),
        setDecoration: (game, patch) => commit(game, (d) => ({ ...d, decoration: { ...DEFAULT_DECORATION, ...d.decoration, ...patch } })),

        loadDoc: (game, doc, viewCols) => {
          const catalog = getCatalog(game);
          const skins = dedupe(doc.skins).filter((id) => catalog.skinById.has(id)).slice(0, MAX_SKINS);
          commit(game, () => ({ ...EMPTY_DOC, ...structuredClone(doc), skins }));
          const g = getGame(game);
          set((s) => ({ games: { ...s.games, [game]: { ...g, viewCols: Math.min(VIEW_COLS_MAX, Math.max(VIEW_COLS_MIN, viewCols)) } } }));
        },

        setViewCols: (game, cols) =>
          set((s) => ({
            games: {
              ...s.games,
              [game]: { ...getGame(game), viewCols: Math.min(VIEW_COLS_MAX, Math.max(VIEW_COLS_MIN, Math.round(cols))) },
            },
          })),

        undo: (game) => {
          const g = getGame(game);
          const prev = g.past.at(-1);
          if (!prev) return;
          set((s) => ({
            games: { ...s.games, [game]: { ...g, doc: prev, past: g.past.slice(0, -1), future: [g.doc, ...g.future] } },
          }));
        },

        redo: (game) => {
          const g = getGame(game);
          const next = g.future[0];
          if (!next) return;
          set((s) => ({
            games: { ...s.games, [game]: { ...g, doc: next, past: [...g.past, g.doc], future: g.future.slice(1) } },
          }));
        },
      };
    },
    {
      name: "velacut-editor",
      // v2: เปลี่ยนจาก mock catalog → สกินจริง (id ใหม่ทั้งหมด) จึงล้าง state เก่า
      // v3: cardSize (%) → viewCols (คอลัมน์) — เก็บกริดเดิมไว้ ตั้งค่าคอลัมน์ใหม่
      // v4: เพิ่ม doc.template
      version: 4,
      migrate: (persisted, version) => {
        if (version < 2) return { games: {} };
        const games = (persisted as { games?: Record<string, Partial<GameEditorState>> }).games ?? {};
        const fixDoc = (d?: Partial<EditorDoc>): EditorDoc => ({ ...EMPTY_DOC, ...d });
        return {
          games: Object.fromEntries(
            Object.entries(games).map(([k, g]) => [
              k,
              {
                ...EMPTY_GAME_STATE,
                ...g,
                viewCols: version < 3 ? DEFAULT_VIEW_COLS : (g.viewCols ?? DEFAULT_VIEW_COLS),
                doc: fixDoc(g.doc),
                past: (g.past ?? []).map(fixDoc),
                future: (g.future ?? []).map(fixDoc),
              },
            ]),
          ),
        } as Pick<EditorStore, "games">;
      },
      storage: createJSONStorage(() => sessionStorage),
      // อ่าน sessionStorage หลัง mount เท่านั้น เพื่อไม่ให้ HTML จาก server กับ client ไม่ตรงกัน
      skipHydration: true,
      partialize: (s) => ({ games: s.games }),
      onRehydrateStorage: () => () => useEditorStore.setState({ hasHydrated: true }),
    },
  ),
);

/** state ของเกมเดียว (คืน object คงที่ถ้ายังไม่มี เพื่อไม่ให้ re-render วนลูป) */
export const useGameEditor = (game: GameSlug) => useEditorStore((s) => s.games[game] ?? EMPTY_GAME_STATE);
