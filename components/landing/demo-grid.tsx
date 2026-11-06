"use client";

import { useId, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { copy } from "@/lib/copy";
import type { Skin } from "@/lib/catalog";
import { cn, fmt } from "@/lib/utils";

const f = copy.landing.features;


function SortableSkin({ skin, index }: { skin: Skin; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: skin.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("touch-manipulation", isDragging && "z-10")}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={fmt(f.demoDragHandle, { name: skin.name })}
        className={cn(
          "block w-full cursor-grab rounded-lg transition-[transform,box-shadow] active:cursor-grabbing",
          isDragging && "scale-105 shadow-soft-lg ring-2 ring-primary",
        )}
      >
        <SkinThumb skin={skin} index={index + 1} className="rounded-lg" />
      </button>
    </li>
  );
}

export function DemoGrid({ skins }: { skins: Skin[] }) {
  // id คงที่ระหว่าง server/client — ไม่งั้น dnd-kit ใช้ตัวนับ global (DndDescribedBy-N) แล้ว hydration ไม่ตรง
  const dndId = useId();
  const [items, setItems] = useState(skins);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setItems((prev) => arrayMove(prev, prev.findIndex((s) => s.id === active.id), prev.findIndex((s) => s.id === over.id)));
  };

  const aiSort = () => setItems((prev) => [...prev].sort((a, b) => b.tierRank - a.tierRank));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <GripVertical className="size-3.5" aria-hidden />
          {fmt(f.drag.toolbar, { game: "MLBB" })}
        </span>
        <Badge variant="outline" size="sm">{f.demoTag}</Badge>
      </div>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Button variant="soft" size="sm" onClick={aiSort}>
          <Sparkles aria-hidden />
          {copy.editor.toolbar.aiSort}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setItems(skins)}>
          <RotateCcw aria-hidden />
          {f.demoReset}
        </Button>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{fmt(f.demoCount, { n: items.length })}</span>
      </div>
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((s) => s.id)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-4 gap-1.5 px-4 pb-4 sm:grid-cols-8">
            {items.map((skin, i) => (
              <SortableSkin key={skin.id} skin={skin} index={i} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">{f.demoHint}</p>
    </div>
  );
}
