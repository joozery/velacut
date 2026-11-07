"use client";

import { useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Select ของระบบสำหรับฟอร์มกรองแบบ GET — Radix สร้าง input ซ่อนตาม `name` ให้ฟอร์มส่งค่าได้
 * เลือกแล้วส่งฟอร์มทันที (รีเซ็ตกลับหน้า 1)
 */
export function FilterSelect({ name, defaultValue, options, label, className }: { name: string; defaultValue: string; options: [string, string][]; label: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span ref={ref} className="contents">
      <Select name={name} defaultValue={defaultValue} onValueChange={() => requestAnimationFrame(() => ref.current?.closest("form")?.requestSubmit())}>
        <SelectTrigger aria-label={label} size="sm" className={cn("h-10 w-full rounded-xl sm:w-40", className)}><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </span>
  );
}
