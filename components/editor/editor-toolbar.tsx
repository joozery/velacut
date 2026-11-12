"use client";

import { Grid3x3, LayoutGrid, Redo2, Sparkles, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { copy } from "@/lib/copy";
import type { GameSlug } from "@/lib/games";
import { cn, fmt } from "@/lib/utils";
import { VIEW_COLS_MAX, VIEW_COLS_MIN, useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import { gridOptions } from "@/lib/grid-layout";
import { useGrid } from "./use-grid";
import { useEditorStep } from "./use-editor-step";

const t = copy.editor.toolbar;
const a = copy.editor.actions;
const soon = () => toast({ title: copy.toast.comingSoon });

function IconAction({ label, icon, onClick, disabled }: { label: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <Tooltip content={label}>
      {/* span ห่อไว้ให้ tooltip ยังทำงานตอนปุ่ม disabled */}
      <span className="inline-flex">
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick ?? soon} disabled={disabled}>
          {icon}
        </Button>
      </span>
    </Tooltip>
  );
}

/** ปุ่มมีข้อความบนจอใหญ่ / เหลือแค่ไอคอนบนมือถือ */
function LabeledAction({ label, icon, onClick, disabled, tone = "ghost" }: { label: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean; tone?: "ghost" | "soft" }) {
  return (
    <Button variant={tone} size="sm" onClick={onClick} disabled={disabled} aria-label={label} className="px-2.5 sm:px-3">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />;

function GridTools({ game }: { game: GameSlug }) {
  const { hydrated, skins, viewCols, canUndo, canRedo } = useGrid(game);
  const s = useEditorStore.getState;
  const empty = skins.length === 0;

  const sort = () => {
    if (skins.length < 2) return toast({ title: a.nothingToSort });
    s().sortByTier(game);
    toast({ title: a.sorted, variant: "success" });
  };

  const clear = () => {
    s().clear(game);
    toast({ title: a.cleared, description: a.clearedDesc });
  };

  return (
    <>
      <IconAction label={t.undo} icon={<Undo2 aria-hidden />} onClick={() => s().undo(game)} disabled={!hydrated || !canUndo} />
      <IconAction label={t.redo} icon={<Redo2 aria-hidden />} onClick={() => s().redo(game)} disabled={!hydrated || !canRedo} />
      <Divider />
      <LabeledAction label="เรียงสกิน" icon={<Sparkles aria-hidden />} onClick={sort} disabled={!hydrated || skins.length < 2} />
      <LabeledAction label={t.clear} icon={<Trash2 aria-hidden />} onClick={clear} disabled={!hydrated || empty} />
      {/* layout ของพื้นที่ทำงาน: คอลัมน์ × แถว เช่น 6×6, 12×4 */}
      <Select value={String(viewCols)} onValueChange={(v) => s().setViewCols(game, Number(v))} disabled={!hydrated}>
        <SelectTrigger size="sm" aria-label={t.columns} title={t.columns} className="ml-2 w-auto shrink-0 gap-1.5 bg-surface tabular-nums">
          <Grid3x3 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80 overflow-y-auto">
          {gridOptions(skins.length, VIEW_COLS_MIN, VIEW_COLS_MAX).map(({ cols, rows, exact }) => (
            <SelectItem key={cols} value={String(cols)} className="tabular-nums">
              {rows ? `${cols} × ${rows}` : `${cols} คอลัมน์`}
              {exact && <span className="ml-2 text-[10px] text-primary">พอดี</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

/** แถวหัวพื้นที่ทำงาน: ชื่อพื้นที่ (ซ้าย) + เครื่องมือของ step นั้น (ขวา) */
export function EditorToolbar() {
  const { step, game } = useEditorStep();
  const { skins } = useGrid(game.slug);
  const showTools = game.mode === "library" && (step === "grid" || step === "decorate");
  // หน้าเลือกแบบป้าย / ชำระเงิน ใช้พื้นที่เต็ม ไม่มีแถวเครื่องมือ
  if (game.mode === "library" && (step === "template" || step === "decorate" || step === "checkout")) return null;

  return (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 sm:px-5">
      <p className="flex shrink-0 items-center gap-2 text-xs font-semibold sm:text-sm">
        <span aria-hidden className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary"><LayoutGrid className="size-4" /></span>
        {game.mode === "library" && step === "grid" ? copy.editor.grid.boardLabel : copy.editor.steps[step]}
        {game.mode === "library" && step === "grid" && skins.length > 0 && (
          <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] text-primary tabular-nums">{fmt(copy.editor.bottomBar.skinCount, { n: skins.length })}</span>
        )}
      </p>
      {showTools && (
        <div role="toolbar" aria-label={t.label} className={cn("no-scrollbar ml-auto flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-surface-2/70 px-1")}>
          {step === "grid" && <GridTools game={game.slug} />}

        </div>
      )}
    </div>
  );
}
