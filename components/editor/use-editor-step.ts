"use client";

import { useParams, useSearchParams } from "next/navigation";
import { EDITOR_STEPS, getGame, parseStep, type GameConfig } from "@/lib/games";

/** อ่านเกมจาก path และ step จาก ?step= */
export function useEditorStep() {
  const params = useParams<{ game: string }>();
  const search = useSearchParams();
  const game = getGame(params.game) as GameConfig;
  const step = parseStep(search.get("step"));
  const index = EDITOR_STEPS.indexOf(step);
  const next = EDITOR_STEPS[index + 1];
  const prev = EDITOR_STEPS[index - 1];
  const href = (s: string) => `/generate/${game.slug}?step=${s}`;
  return { game, step, index, next, prev, href };
}
