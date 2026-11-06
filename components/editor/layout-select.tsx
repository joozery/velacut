"use client";

import { LayoutGrid } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copy } from "@/lib/copy";
import { VIEW_COLS_MAX, VIEW_COLS_MIN } from "@/stores/editor-store";

/** ใช้จำนวนคอลัมน์เดียวกับ slider และตัวอย่างป้าย */
export function LayoutSelect({
  cols,
  onChange,
  disabled,
  placeholder = copy.editor.toolbar.layout,
}: {
  cols: number;
  onChange: (cols: number) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const opts = Array.from({ length: VIEW_COLS_MAX - VIEW_COLS_MIN + 1 }, (_, i) => i + VIEW_COLS_MIN);
  return (
    <Select value={String(cols)} onValueChange={(v) => onChange(Number(v))} disabled={disabled}>
      <SelectTrigger size="sm" aria-label="จำนวนคอลัมน์ของป้าย" className="h-10 min-w-24 shrink-0 gap-1.5 rounded-full tabular-nums sm:min-w-28">
        <LayoutGrid className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent side="top">
        {opts.map((o) => (
          <SelectItem key={o} value={String(o)}>
            {o} คอลัมน์
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
