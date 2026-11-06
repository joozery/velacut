"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export function RadioCardGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2.5", className)} {...props} />;
}

/** การ์ดที่ทั้งใบเป็นปุ่ม radio — วงกลม indicator อยู่มุมขวาบน (ค่าเริ่มต้น) หรือซ้ายบน */
export function RadioCard({
  className,
  children,
  hideIndicator,
  indicator = "right",
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & { hideIndicator?: boolean; indicator?: "left" | "right" }) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "group relative w-full rounded-2xl border-2 border-border bg-surface p-4 text-left transition-[border-color,box-shadow,background-color]",
        !hideIndicator && indicator === "left" && "pl-12",
        "hover:border-surface-3 data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft/40 data-[state=checked]:shadow-soft",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {!hideIndicator && (
        <span
          aria-hidden
          className={cn(
            "absolute top-4 flex size-5 items-center justify-center rounded-full border-2 border-input transition-colors group-data-[state=checked]:border-primary",
            indicator === "left" ? "left-4" : "right-4",
          )}
        >
          <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-primary" />
        </span>
      )}
      {children}
    </RadioGroupPrimitive.Item>
  );
}
