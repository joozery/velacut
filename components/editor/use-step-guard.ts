"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import type { GameSlug } from "@/lib/games";
import { MIN_SKINS } from "@/lib/pricing";
import { fmt } from "@/lib/utils";
import { toast } from "@/stores/toast-store";
import { useGrid } from "./use-grid";

/**
 * step หลังกริด (template / decorate / checkout) ต้องมีสกินครบขั้นต่ำ
 * ไม่ครบ → เด้งกลับไปหน้าจัดกริด
 * @returns true เมื่อพร้อมแสดงผล (hydrate แล้ว + สกินครบ)
 */
export function useRequireSkins(game: GameSlug) {
  const router = useRouter();
  const { hydrated, skins } = useGrid(game);
  const ok = skins.length >= MIN_SKINS;
  const redirected = useRef(false);

  useEffect(() => {
    if (!hydrated || ok || redirected.current) return;
    redirected.current = true;
    toast({ title: fmt(copy.editor.template.redirect, { n: MIN_SKINS }) });
    router.replace(`/generate/${game}?step=grid`);
  }, [hydrated, ok, game, router]);

  return hydrated && ok;
}
