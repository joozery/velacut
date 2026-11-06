"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import { fmt } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import { decodeShare } from "./use-grid";
import { useEditorStep } from "./use-editor-step";

/**
 * - โหลด state จาก sessionStorage หลัง mount (กัน hydration mismatch)
 * - นำเข้ากริดจากลิงก์แชร์ (?s=...)
 * - คีย์ลัด Undo / Redo
 */
export function EditorHydrator() {
  const router = useRouter();
  const { game, href } = useEditorStep();
  const hydrated = useEditorStore((s) => s.hasHydrated);
  const imported = useRef(false);

  useEffect(() => {
    void useEditorStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!hydrated || imported.current || game.mode !== "library") return;
    const shared = new URLSearchParams(window.location.search).get("s");
    if (!shared) return;
    imported.current = true;
    const ids = decodeShare(game.slug, shared);
    useEditorStore.getState().setSkins(game.slug, ids);
    const n = useEditorStore.getState().games[game.slug]?.doc.skins.length ?? 0;
    toast({ title: copy.editor.actions.imported, description: fmt(copy.editor.actions.importedDesc, { n }), variant: "success" });
    router.replace(href("grid"), { scroll: false });
  }, [hydrated, game, href, router]);

  useEffect(() => {
    if (game.mode !== "library") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable=true], [role=dialog]")) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      const { undo, redo } = useEditorStore.getState();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo(game.slug);
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo(game.slug);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  return null;
}
