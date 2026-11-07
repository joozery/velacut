"use client";

import { useRef, useState, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderPoster, savePoster } from "@/lib/poster-download";
import type { PosterOrder } from "@/lib/account";
import { toast } from "@/stores/toast-store";
import { PosterPreview } from "./poster-preview";
import { DEFAULT_DECORATION } from "@/stores/editor-store";

export function OrderDownload({ order, label = "ดาวน์โหลดซ้ำฟรี", className, variant, size }: { order: PosterOrder; label?: string } & Pick<ComponentProps<typeof Button>, "className" | "variant" | "size">) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const download = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const node = ref.current?.firstElementChild;
      if (!(node instanceof HTMLElement)) throw new Error("เตรียมป้ายไม่สำเร็จ");
      const blob = await renderPoster(node, order.doc.output === "watermark");
      savePoster(blob, `velacut-${order.game}-${order.id.slice(-8)}.png`);
    } catch (e) {
      toast({ title: "ดาวน์โหลดไม่สำเร็จ", description: e instanceof Error ? e.message : "กรุณาลองใหม่", variant: "error" });
    } finally { lock.current = false; setBusy(false); }
  };
  return <><Button disabled={busy} onClick={download} className={className} variant={variant} size={size} aria-label={label === "" ? "ดาวน์โหลด PNG" : undefined}>{busy ? <Loader2 className="animate-spin" /> : <Download />}{label}</Button>{busy && createPortal(<div aria-hidden ref={ref} className="pointer-events-none fixed top-0 left-[-20000px] w-[1080px]"><PosterPreview game={order.game} skinIds={order.doc.skins} cols={order.cols} template={order.doc.template} decoration={{ ...DEFAULT_DECORATION, ...order.doc.decoration }} className="rounded-none shadow-none" /></div>, document.body)}</>;
}
