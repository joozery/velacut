"use client";

import { useEffect, useId, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { m } from "framer-motion";
import { SkinThumb } from "@/components/shared/skin-thumb";
import { copy } from "@/lib/copy";
import type { Skin } from "@/lib/catalog";
import { useCatalog } from "@/components/shared/catalog-provider";
import type { GameSlug } from "@/lib/games";
import { cn, fmt } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";

const g = copy.editor.grid;
/** มือถือแสดงได้สูงสุดเท่านี้คอลัมน์ ไม่งั้นการ์ดเล็กเกินไป */
const MOBILE_MAX_COLS = 4;

/** true เมื่อจอกว้างตั้งแต่ sm (640px) — กริดเรนเดอร์หลัง hydrate อยู่แล้วจึงไม่มีปัญหา SSR */
function useIsWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

function SortableCard({ skin, index, onRemove }: { skin: Skin; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: skin.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative touch-manipulation", isDragging && "z-20")}
    >
      <div
        {...attributes}
        {...listeners}
        aria-label={fmt(g.dragAria, { name: skin.name, index })}
        className={cn(
          "cursor-grab rounded-xl transition-[transform,box-shadow] select-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          isDragging && "scale-105 shadow-soft-lg ring-2 ring-primary",
        )}
      >
        <m.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 28 }}>
          <SkinThumb skin={skin} hideTier size="lg" sizes="(min-width: 1024px) 18vw, 30vw" priority={index <= 6} watermark className="rounded-lg ring-1 ring-border" />
        </m.div>
      </div>
      {/* ปุ่มลบเป็น sibling ไม่ซ้อนใน element ที่ลากได้ */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={fmt(g.remove, { name: skin.name })}
        className={cn(
          "absolute top-1.5 right-1.5 z-10 grid size-7 place-items-center rounded-full bg-black/60 text-white shadow-soft backdrop-blur-sm transition-opacity",
          "hover:bg-danger hover:text-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring",
          // อุปกรณ์ที่มีเมาส์: โชว์ตอนชี้ / จอสัมผัส: โชว์ตลอด
          "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
          isDragging && "opacity-0",
        )}
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </li>
  );
}

export function SkinGrid({ game, skins, viewCols }: { game: GameSlug; skins: string[]; viewCols: number }) {
  // id คงที่ระหว่าง server/client (ดู demo-grid.tsx)
  const dndId = useId();
  const { skinById } = useCatalog(game);
  const moveSkin = useEditorStore((s) => s.moveSkin);
  const removeSkin = useEditorStore((s) => s.removeSkin);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // มือถือ: แตะค้างสั้นๆ ก่อนลาก เพื่อไม่ชนกับการเลื่อนหน้า
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const nameOf = (id: UniqueIdentifier) => skinById.get(String(id))?.name ?? "";
  const posOf = (id: UniqueIdentifier) => skins.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => fmt(g.dndPickedUp, { name: nameOf(active.id) }),
    onDragOver: ({ active, over }) => (over ? fmt(g.dndOver, { name: nameOf(active.id), index: posOf(over.id) }) : undefined),
    onDragEnd: ({ active, over }) => (over ? fmt(g.dndDropped, { name: nameOf(active.id), index: posOf(over.id) }) : undefined),
    onDragCancel: ({ active }) => fmt(g.dndCancel, { name: nameOf(active.id) }),
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) moveSkin(game, String(active.id), String(over.id));
  };

  const wide = useIsWide();
  const cols = wide ? viewCols : Math.min(viewCols, MOBILE_MAX_COLS);

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: { draggable: g.dndInstructions } }}
    >
      <SortableContext items={skins} strategy={rectSortingStrategy}>
        <ul className={cn("grid w-full", cols > 10 ? "gap-1.5 sm:gap-2" : "gap-2.5 sm:gap-4")} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {skins.map((id, i) => {
            const skin = skinById.get(id);
            if (!skin) return null;
            return <SortableCard key={id} skin={skin} index={i + 1} onRemove={() => removeSkin(game, id)} />;
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
