"use client";

import { useMemo } from "react";
import type { GameSlug } from "@/lib/games";
import { resolveLayout } from "@/lib/grid-layout";
import { useEditorStore, useGameEditor } from "@/stores/editor-store";

/** state กริดที่คำนวณแล้ว (layout ที่ใช้จริง + undo/redo ได้ไหม) */
export function useGrid(game: GameSlug) {
  const state = useGameEditor(game);
  const hydrated = useEditorStore((s) => s.hasHydrated);
  const { skins, cols } = state.doc;
  const layout = useMemo(() => resolveLayout(skins.length, cols), [skins.length, cols]);
  return {
    hydrated,
    skins,
    layout,
    viewCols: state.viewCols,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

/** ลิงก์แชร์: ตัด prefix ชื่อเกมออกให้ลิงก์สั้นลง */
export const encodeShare = (game: GameSlug, skins: string[]) => skins.map((id) => id.replace(`${game}-`, "")).join(",");
export const decodeShare = (game: GameSlug, value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${game}-${s}`);
