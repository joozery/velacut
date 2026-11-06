"use client";

import { useState } from "react";
import { Grid2x2, Grid3x3, Redo2, ScanSearch, Share2, Sparkles, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { copy } from "@/lib/copy";
import type { GameSlug } from "@/lib/games";
import { cn, fmt } from "@/lib/utils";
import { VIEW_COLS_MAX, VIEW_COLS_MIN, useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import { DetectDialog } from "./detect-dialog";
import { encodeShare, useGrid } from "./use-grid";
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
  const [detectOpen, setDetectOpen] = useState(false);
  const empty = skins.length === 0;

  const share = async () => {
    if (empty) return toast({ title: a.shareEmpty });
    const url = `${window.location.origin}/generate/${game}?step=grid&s=${encodeURIComponent(encodeShare(game, skins))}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: a.shareCopied, description: a.shareCopiedDesc, variant: "success" });
    } catch {
      toast({ title: a.shareFailed, variant: "error" });
    }
  };

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
      <LabeledAction label={t.aiSort} icon={<Sparkles aria-hidden />} onClick={sort} disabled={!hydrated || skins.length < 2} />
      <LabeledAction label={t.detect} icon={<ScanSearch aria-hidden />} onClick={() => setDetectOpen(true)} disabled={!hydrated} />
      <LabeledAction label={t.share} icon={<Share2 aria-hidden />} onClick={share} disabled={!hydrated || empty} />
      <LabeledAction label={t.clear} icon={<Trash2 aria-hidden />} onClick={clear} disabled={!hydrated || empty} />
      {/* จำนวนคอลัมน์ในพื้นที่ทำงาน */}
      <div className="ml-2 hidden h-9 w-52 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 md:flex" title={t.columns}>
        <Grid2x2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Slider
          value={[viewCols]}
          onValueChange={([v]) => s().setViewCols(game, v)}
          min={VIEW_COLS_MIN}
          max={VIEW_COLS_MAX}
          step={1}
          thumbLabel={t.columns}
          disabled={!hydrated}
        />
        <Grid3x3 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="w-4 text-right text-sm font-semibold tabular-nums">{viewCols}</span>
      </div>
      <DetectDialog game={game} open={detectOpen} onOpenChange={setDetectOpen} />
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
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 sm:px-5">
      <p className="flex shrink-0 items-center gap-2 text-sm font-medium">
        <span aria-hidden className="size-1.5 rounded-full bg-primary" />
        {game.mode === "library" && step === "grid" ? copy.editor.grid.boardLabel : copy.editor.steps[step]}
        {game.mode === "library" && step === "grid" && skins.length > 0 && (
          <span className="text-muted-foreground tabular-nums">{fmt(copy.editor.bottomBar.skinCount, { n: skins.length })}</span>
        )}
      </p>
      {showTools && (
        <div role="toolbar" aria-label={t.label} className={cn("no-scrollbar ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto")}>
          {step === "grid" && <GridTools game={game.slug} />}

        </div>
      )}
    </div>
  );
}
