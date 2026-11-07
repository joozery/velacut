"use client";

import { useRouter } from "next/navigation";
import { PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PosterPreview } from "@/components/editor/poster-preview";
import { OrderDownload } from "@/components/editor/order-download";
import type { PosterOrder } from "@/lib/account";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { DEFAULT_DECORATION, useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const dt = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

export function PosterCard({ order }: { order: PosterOrder }) {
  const router = useRouter();
  const watermark = order.doc.output === "watermark";
  const templateName = copy.editor.template.options[order.doc.template]?.name ?? order.doc.template;
  const edit = () => {
    useEditorStore.getState().loadDoc(order.game, order.doc, order.cols);
    toast({ title: "โหลดป้ายเข้า editor แล้ว", description: "แก้ไขแล้วดาวน์โหลดใหม่ได้เลย", variant: "success" });
    router.push(`/generate/${order.game}?step=grid`);
  };
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-[0_8px_24px_rgb(17_17_20/0.06)]">
      <div className="relative bg-surface-2/60 p-3">
        <PosterPreview game={order.game} skinIds={order.doc.skins} cols={order.cols} template={order.doc.template} decoration={{ ...DEFAULT_DECORATION, ...order.doc.decoration }} className="pointer-events-none rounded-xl shadow-none" />
        <span className={cn("absolute top-5 left-5 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm", watermark ? "bg-surface text-muted-foreground" : "bg-primary text-primary-foreground")}>{watermark ? "มีลายน้ำ" : "ไม่มีลายน้ำ"}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">{order.doc.decoration?.code || `ป้าย ${order.doc.skins.length} สกิน`}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{templateName} · {order.doc.skins.length} สกิน · {order.amount ? `${formatCoinsFixed(order.amount)} เครดิต` : "ฟรี"}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{dt.format(new Date(order.date))} น. · <span className="font-mono">{order.id}</span></p>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 [&_button]:h-10 [&_button]:w-full [&_button]:rounded-xl [&_button]:px-3 [&_button]:text-xs">
          <OrderDownload order={order} label="ดาวน์โหลด" />
          <Button variant="outline" onClick={edit}><PencilLine aria-hidden />แก้ไขต่อ</Button>
        </div>
      </div>
    </article>
  );
}
