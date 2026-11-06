"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { EDITOR_STEPS } from "@/lib/games";
import { MIN_SKINS } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useGrid } from "./use-grid";
import { useEditorStep } from "./use-editor-step";

const labels = ["จัดสกิน", "แบบป้าย", "ตกแต่ง", "ดาวน์โหลด"];

export function EditorMobileSteps() {
  const { game, index, href } = useEditorStep();
  const { hydrated, skins } = useGrid(game.slug);
  if (game.mode !== "library") return null;
  return (
    <nav aria-label="ขั้นตอนสร้างป้าย" className="shrink-0 border-b border-border bg-surface px-2 py-2 lg:border-0 lg:bg-transparent lg:px-6 lg:py-3">
      <ol className="mx-auto grid max-w-3xl grid-cols-4 gap-1 lg:gap-3">
        {EDITOR_STEPS.map((step, i) => {
          const active = i === index;
          const blocked = i > 0 && (!hydrated || skins.length < MIN_SKINS);
          const content = <><span className={cn("grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold", active ? "bg-primary text-primary-foreground" : i < index ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted-foreground")}>{i < index ? <Check className="size-3" aria-hidden /> : i + 1}</span><span>{labels[i]}</span></>;
          const className = cn("flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-[10px] font-medium transition-colors min-[375px]:text-[11px] lg:gap-2 lg:text-xs", active ? "bg-primary-soft text-primary-soft-foreground ring-1 ring-primary/15" : "text-muted-foreground hover:bg-surface-2", blocked && "opacity-50");
          return <li key={step}>{blocked ? <span aria-disabled="true" className={className}>{content}</span> : <Link href={href(step)} aria-current={active ? "step" : undefined} className={className}>{content}</Link>}</li>;
        })}
      </ol>
    </nav>
  );
}
