"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { GameSelect } from "./game-select";
import { useEditorStep } from "./use-editor-step";

/** ปุ่มย้อนกลับ (ไป step ก่อนหน้า หรือหน้าแรก) + breadcrumb "สร้างกริด / ROV ▾" */
export function EditorCrumbs() {
  const { game, step, prev, href } = useEditorStep();
  const backHref = game.mode === "library" && prev ? href(prev) : "/";
  const label = game.mode === "upload" ? copy.editor.breadcrumbGenerate : copy.editor.steps[step];
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Button asChild variant="ghost" size="icon-sm">
        <Link href={backHref} aria-label={copy.editor.backAria}>
          <ArrowLeft aria-hidden />
        </Link>
      </Button>
      <nav aria-label={copy.editor.breadcrumbAria} className="min-w-0">
        <ol className="flex items-center gap-1 text-sm">
          <li aria-current="step" className="hidden truncate text-muted-foreground sm:block">{label}</li>
          <li aria-hidden className="hidden text-muted-foreground/60 sm:block">/</li>
          <li><GameSelect value={game.slug} /></li>
        </ol>
      </nav>
    </div>
  );
}
