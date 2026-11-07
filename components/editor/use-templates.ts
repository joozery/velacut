"use client";

import { useEffect } from "react";
import type { GameSlug } from "@/lib/games";
import { enabledTemplates, resolveTemplate } from "@/lib/templates";
import { useTemplates } from "@/components/shared/templates-provider";
import { useEditorStore, useGameEditor } from "@/stores/editor-store";

/** แบบป้ายที่ใช้ได้จริง — แบบที่เลือกไว้ถูกปิดจากหลังบ้าน จะสลับไปแบบแรกที่เปิดอยู่ */
export function useEditorTemplates(game: GameSlug) {
  const cfg = useTemplates();
  const { doc } = useGameEditor(game);
  const setTemplate = useEditorStore((s) => s.setTemplate);
  const template = resolveTemplate(cfg, doc.template);
  useEffect(() => {
    if (template !== doc.template) setTemplate(game, template);
  }, [game, template, doc.template, setTemplate]);
  return { cfg, template, list: enabledTemplates(cfg) };
}
