"use client";

import { useEffect, useId, useState } from "react";
import { ImageUp, Loader2, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { copy } from "@/lib/copy";
import type { GameSlug } from "@/lib/games";
import { MAX_UPLOAD_BYTES } from "@/lib/limits";
import { cn, fmt } from "@/lib/utils";
import { useEditorStore, useGameEditor } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";

const d = copy.editor.detect;

type Phase = { kind: "idle" } | { kind: "running" } | { kind: "done"; skinIds: string[] } | { kind: "error"; message: string };

export function DetectDialog({ game, open, onOpenChange }: { game: GameSlug; open: boolean; onOpenChange: (open: boolean) => void }) {
  const inputId = useId();
  const { doc } = useGameEditor(game);
  const addSkins = useEditorStore((s) => s.addSkins);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  // ล้าง object URL เมื่อเปลี่ยนไฟล์หรือปิด
  useEffect(() => {
    if (!file) return setPreviewUrl(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = () => {
    setFile(null);
    setPhase({ kind: "idle" });
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setPhase({ kind: "error", message: d.errorType });
    if (f.size > MAX_UPLOAD_BYTES) return setPhase({ kind: "error", message: d.errorSize });
    setFile(f);
    setPhase({ kind: "idle" });
  };

  const run = async () => {
    if (!file) return;
    setPhase({ kind: "running" });
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("game", game);
      const res = await fetch("/api/detect", { method: "POST", body });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        const message = err.error === "too_large" ? d.errorSize : err.error === "invalid_type" ? d.errorType : d.errorServer;
        return setPhase({ kind: "error", message });
      }
      const data = (await res.json()) as { skinIds: string[] };
      setPhase({ kind: "done", skinIds: data.skinIds });
    } catch {
      setPhase({ kind: "error", message: d.errorServer });
    }
  };

  const confirmAdd = () => {
    if (phase.kind !== "done") return;
    const n = addSkins(game, phase.skinIds);
    toast({ title: fmt(d.added, { n }), variant: "success" });
    onOpenChange(false);
    reset();
  };

  const newCount = phase.kind === "done" ? phase.skinIds.filter((id) => !doc.skins.includes(id)).length : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{d.title}</DialogTitle>
            <Badge variant="soft" size="sm">{d.beta}</Badge>
          </div>
          <DialogDescription>{d.description}</DialogDescription>
        </DialogHeader>

        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={cn(
            "relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
            dragOver ? "border-primary bg-primary-soft" : "border-input bg-surface-2 hover:border-primary/60",
          )}
        >
          <input
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL ใช้ next/image ไม่ได้ */}
              <img src={previewUrl} alt={d.previewAlt} className="max-h-56 rounded-xl object-contain" />
              <span className="text-xs text-muted-foreground">
                {file?.name} · {d.change}
              </span>
            </>
          ) : (
            <>
              <span className="grid size-12 place-items-center rounded-2xl bg-surface text-primary shadow-soft-sm">
                <ImageUp className="size-6" aria-hidden />
              </span>
              <span className="font-medium">{dragOver ? d.dropActive : d.dropTitle}</span>
              <span className="text-xs text-muted-foreground">{d.dropHint}</span>
            </>
          )}
        </label>

        <div aria-live="polite" className="text-sm empty:hidden">
          {phase.kind === "error" && <p className="rounded-xl bg-danger-soft px-4 py-3 text-danger">{phase.message}</p>}
          {phase.kind === "done" && (
            <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-success">
              <Sparkles className="size-4" aria-hidden />
              {fmt(d.found, { n: phase.skinIds.length })} · {fmt(d.foundNew, { n: newCount })}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{d.stubNote}</p>

        <DialogFooter>
          {phase.kind === "done" ? (
            <Button onClick={confirmAdd} disabled={newCount === 0}>{d.add}</Button>
          ) : (
            <Button onClick={run} disabled={!file || phase.kind === "running"}>
              {phase.kind === "running" ? <Loader2 className="animate-spin" aria-hidden /> : <ScanSearch aria-hidden />}
              {phase.kind === "running" ? d.running : d.run}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
