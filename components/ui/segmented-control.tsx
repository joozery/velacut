"use client";

import * as React from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
};

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  "aria-label"?: string;
  block?: boolean;
};

/** ตัวเลือกแบบแบ่งช่อง (เลือกได้ 1 ค่าเสมอ ไม่ยอมให้ว่าง) */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
  size = "md",
  block,
  ...rest
}: Props<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      aria-label={rest["aria-label"]}
      className={cn("inline-flex items-center gap-1 rounded-2xl bg-surface-2 p-1", block && "flex w-full", className)}
    >
      {options.map((opt) => (
        <ToggleGroup.Item
          key={opt.value}
          value={opt.value}
          aria-label={opt.ariaLabel}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium text-muted-foreground transition-colors",
            "hover:text-foreground data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-soft-sm",
            "focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-4",
            size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
            block && "flex-1",
          )}
        >
          {opt.icon}
          {opt.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
