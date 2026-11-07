"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PosterPreview } from "@/components/editor/poster-preview";
import { OrderDownload } from "@/components/editor/order-download";
import { useTemplates } from "@/components/shared/templates-provider";
import type { PosterOrder } from "@/lib/account";
import { formatCoinsFixed } from "@/lib/format";
import { DEFAULT_DECORATION, useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const day = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" });
const time = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

const titleOf = (o: PosterOrder) => o.doc.decoration?.code || `ป้าย ${o.doc.skins.length} สกิน`;

function Thumb({ order }: { order: PosterOrder }) {
  return (
    <div className="h-full w-full overflow-hidden">
      <PosterPreview game={order.game} skinIds={order.doc.skins} cols={order.cols} template={order.doc.template} decoration={{ ...DEFAULT_DECORATION, ...order.doc.decoration }} className="pointer-events-none rounded-none shadow-none" />
    </div>
  );
}

function OutputChip({ watermark }: { watermark: boolean }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", watermark ? "bg-surface-2 text-muted-foreground" : "bg-primary-soft text-primary")}>{watermark ? "มีลายน้ำ" : "ไม่มีลายน้ำ"}</span>;
}

/** ตารางป้ายของฉัน — ดูตัวอย่างใหญ่ / ดาวน์โหลดซ้ำ / โหลดเข้า editor */
export function PostersTable({ posters }: { posters: PosterOrder[] }) {
  const router = useRouter();
  const templates = useTemplates();
  const [view, setView] = useState<PosterOrder | null>(null);
  const edit = (o: PosterOrder) => {
    useEditorStore.getState().loadDoc(o.game, o.doc, o.cols);
    toast({ title: "โหลดป้ายเข้า editor แล้ว", description: "แก้ไขแล้วดาวน์โหลดใหม่ได้เลย", variant: "success" });
    router.push(`/generate/${o.game}?step=grid`);
  };
  const tplName = (o: PosterOrder) => templates[o.doc.template]?.name ?? o.doc.template;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* จอใหญ่: ตาราง */}
        <table className="hidden w-full text-sm md:table">
          <thead className="border-b border-border bg-surface-2/60 text-left text-[11px] text-muted-foreground">
            <tr>
              <th scope="col" className="w-20 px-4 py-2.5 font-medium">ตัวอย่าง</th>
              <th scope="col" className="px-3 py-2.5 font-medium">ป้าย</th>
              <th scope="col" className="px-3 py-2.5 font-medium">แบบป้าย</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">สกิน</th>
              <th scope="col" className="px-3 py-2.5 font-medium">ไฟล์</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">ราคา</th>
              <th scope="col" className="px-3 py-2.5 font-medium">วันที่สร้าง</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium"><span className="sr-only">จัดการ</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {posters.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-surface-2/40">
                <td className="px-4 py-2.5">
                  <button type="button" onClick={() => setView(o)} aria-label={`ดูตัวอย่าง ${titleOf(o)}`} className="group relative block h-14 w-14 overflow-hidden rounded-lg border border-border bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring">
                    <Thumb order={o} />
                    <span className="absolute inset-0 grid place-items-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"><Maximize2 className="size-4" aria-hidden /></span>
                  </button>
                </td>
                <td className="max-w-[220px] px-3 py-2.5">
                  <p className="truncate font-medium">{titleOf(o)}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{o.id}</p>
                </td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">{tplName(o)}</td>
                <td className="px-3 py-2.5 text-right text-xs tabular-nums">{o.doc.skins.length}</td>
                <td className="px-3 py-2.5"><OutputChip watermark={o.doc.output === "watermark"} /></td>
                <td className="px-3 py-2.5 text-right text-xs whitespace-nowrap tabular-nums">{o.amount ? formatCoinsFixed(o.amount) : <span className="text-success">ฟรี</span>}</td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap"><p>{day.format(new Date(o.date))}</p><p className="text-[11px] text-muted-foreground">{time.format(new Date(o.date))} น.</p></td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    <OrderDownload order={o} label="ดาวน์โหลด" size="sm" className="text-xs" />
                    <Button size="icon-sm" variant="outline" onClick={() => edit(o)} aria-label={`แก้ไขต่อ ${titleOf(o)}`} title="แก้ไขต่อ"><PencilLine aria-hidden /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* มือถือ: แถวแบบย่อ */}
        <ul className="divide-y divide-border md:hidden">
          {posters.map((o) => (
            <li key={o.id} className="flex items-center gap-3 p-3">
              <button type="button" onClick={() => setView(o)} aria-label={`ดูตัวอย่าง ${titleOf(o)}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2"><Thumb order={o} /></button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{titleOf(o)}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{tplName(o)} · {o.doc.skins.length} สกิน · {o.amount ? `${formatCoinsFixed(o.amount)} เครดิต` : "ฟรี"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><OutputChip watermark={o.doc.output === "watermark"} />{day.format(new Date(o.date))}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <OrderDownload order={o} label="" size="icon-sm" />
                <Button size="icon-sm" variant="outline" onClick={() => edit(o)} aria-label={`แก้ไขต่อ ${titleOf(o)}`}><PencilLine aria-hidden /></Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={!!view} onOpenChange={(v) => { if (!v) setView(null); }}>
        <DialogContent className="max-w-lg">
          {view && (
            <>
              <DialogHeader>
                <DialogTitle>{titleOf(view)}</DialogTitle>
                <DialogDescription>{tplName(view)} · {view.doc.skins.length} สกิน · {day.format(new Date(view.date))} {time.format(new Date(view.date))} น.</DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-surface-2/60 p-2">
                <PosterPreview game={view.game} skinIds={view.doc.skins} cols={view.cols} template={view.doc.template} decoration={{ ...DEFAULT_DECORATION, ...view.doc.decoration }} className="pointer-events-none rounded-lg shadow-none" />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => edit(view)}><PencilLine aria-hidden />แก้ไขต่อ</Button>
                <OrderDownload order={view} label="ดาวน์โหลด PNG" />
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
