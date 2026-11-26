"use client";

import { useMemo, useState, useTransition } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Loader2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSkinOrderAction } from "@/app/admin/library-actions";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

type Item = { id: string; name: string; hero: string; tier: string; image: string };
const PAGE = 100;

function Cell({ item, pos, onMove }: { item: Item; pos: number; onMove: (to: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("relative rounded-xl border border-border bg-surface p-1.5", isDragging && "z-20 shadow-lg ring-2 ring-primary")}>
      <div {...attributes} {...listeners} aria-label={`ลากเพื่อจัดลำดับ ${item.name}`} className="cursor-grab touch-none select-none active:cursor-grabbing">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin list of many small images */}
        <img src={item.image} alt="" loading="lazy" draggable={false} className="aspect-[200/325] w-full rounded-lg object-cover" />
        <p className="mt-1 truncate text-[11px] font-medium" title={`${item.name} · ${item.hero}`}>{item.name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{item.hero} · {item.tier}</p>
      </div>
      <label className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        ลำดับ
        <input
          key={pos}
          type="number"
          min={1}
          defaultValue={pos + 1}
          aria-label={`ย้าย ${item.name} ไปลำดับที่`}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          onBlur={(e) => { const n = Math.floor(Number(e.target.value)); if (Number.isFinite(n) && n >= 1 && n !== pos + 1) onMove(n - 1); else e.target.value = String(pos + 1); }}
          className="h-6 w-14 rounded-md border border-input bg-background px-1 text-center text-[11px] tabular-nums"
        />
      </label>
    </li>
  );
}

export function SkinOrderManager({ initial, customized }: { initial: Item[]; customized: boolean }) {
  const [saved, setSaved] = useState(initial.map((i) => i.id));
  const [list, setList] = useState(initial);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const dirty = useMemo(() => !customized || list.some((it, i) => it.id !== saved[i]), [list, saved, customized]);
  const pages = Math.ceil(list.length / PAGE);
  const term = q.trim().toLowerCase();
  const rows = useMemo(() => term
    ? list.map((it, pos) => ({ it, pos })).filter(({ it }) => `${it.name} ${it.hero}`.toLowerCase().includes(term)).slice(0, PAGE)
    : list.slice(page * PAGE, page * PAGE + PAGE).map((it, i) => ({ it, pos: page * PAGE + i })), [list, page, term]);

  const move = (from: number, to: number) => setList((l) => arrayMove(l, from, Math.min(l.length - 1, to)));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = list.findIndex((i) => i.id === active.id), to = list.findIndex((i) => i.id === over.id);
    if (from >= 0 && to >= 0) move(from, to);
  };
  const save = () => start(async () => {
    const r = await saveSkinOrderAction(list.map((i) => i.id)).catch(() => null);
    if (!r?.ok) { toast({ title: r?.error ?? "บันทึกไม่สำเร็จ", variant: "error" }); return; }
    setSaved(list.map((i) => i.id));
    toast({ title: "บันทึกลำดับแล้ว", description: `${r.data.count} สกิน · ปุ่มเรียงสกินของลูกค้าใช้ลำดับนี้ทันที`, variant: "success" });
  });

  return (
    <div className="grid gap-3 pb-24">
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อสกินหรือฮีโร่" aria-label="ค้นหาสกิน" className="h-10 pl-9" />
        </div>
        {!term && <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
          <Button type="button" size="icon-sm" variant="outline" aria-label="หน้าก่อนหน้า" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft /></Button>
          ลำดับ {page * PAGE + 1}–{Math.min(list.length, (page + 1) * PAGE)} จาก {list.length}
          <Button type="button" size="icon-sm" variant="outline" aria-label="หน้าถัดไป" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight /></Button>
        </div>}
      </Card>
      <p className="text-xs text-muted-foreground">ลากการ์ดเพื่อสลับตำแหน่งในหน้านี้ หรือพิมพ์เลขลำดับใต้การ์ดเพื่อย้ายข้ามหน้า (สกินลำดับ 1 อยู่บนสุดของป้าย) · สกินที่เพิ่มใหม่ภายหลังจะต่อท้ายอัตโนมัติ</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.it.id)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10">
            {rows.map(({ it, pos }) => <Cell key={it.id} item={it} pos={pos} onMove={(to) => move(pos, to)} />)}
          </ul>
        </SortableContext>
      </DndContext>
      {!rows.length && <p className="py-12 text-center text-sm text-muted-foreground">ไม่พบสกิน</p>}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-end gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
        {!customized && <p className="mr-auto text-xs text-muted-foreground">ยังไม่เคยบันทึก — ตอนนี้ใช้ลำดับตั้งต้น (ระดับสูงก่อน)</p>}
        <Button type="button" disabled={!dirty || pending} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึกลำดับ</Button>
      </div>
    </div>
  );
}
