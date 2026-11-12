"use client";

import { LayoutGrid } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copy } from "@/lib/copy";
import { gridOptions } from "@/lib/grid-layout";
import { VIEW_COLS_MAX, VIEW_COLS_MIN } from "@/stores/editor-store";

/** ใช้จำนวนคอลัมน์เดียวกับ slider และตัวอย่างป้าย */
export function LayoutSelect({
  cols,
  count = 0,
  onChange,
  disabled,
  placeholder = copy.editor.toolbar.layout,
}: {
  cols: number;
  /** จำนวนสกิน — ใช้คำนวณจำนวนแถว */
  count?: number;
  onChange: (cols: number) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Select value={String(cols)} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
      <SelectTrigger size="sm" aria-label="จำนวนคอลัมน์ของป้าย" className="h-10 min-w-24 shrink-0 gap-1.5 rounded-full tabular-nums sm:min-w-28">
        <LayoutGrid className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent side="top" className="max-h-80 overflow-y-auto">
        {gridOptions(count, VIEW_COLS_MIN, VIEW_COLS_MAX).map(({ cols: c, rows, exact }) => (
          <SelectItem key={c} value={String(c)} className="tabular-nums">
            {rows ? `${c} × ${rows}` : `${c} คอลัมน์`}
            {exact && <span className="ml-2 text-[10px] text-primary">พอดี</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
