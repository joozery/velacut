"use client";

import * as React from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dropdown = DM.Root;
export const DropdownTrigger = DM.Trigger;
export const DropdownGroup = DM.Group;
export const DropdownSub = DM.Sub;
export const DropdownRadioGroup = DM.RadioGroup;

const contentCls =
  "z-50 min-w-52 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 text-foreground shadow-soft-lg data-[state=open]:animate-pop";
const itemCls =
  "relative flex h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm outline-none select-none transition-colors data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground";

export function DropdownContent({ className, sideOffset = 8, align = "end", ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content sideOffset={sideOffset} align={align} className={cn(contentCls, className)} {...props} />
    </DM.Portal>
  );
}

export function DropdownItem({ className, destructive, ...props }: React.ComponentProps<typeof DM.Item> & { destructive?: boolean }) {
  return <DM.Item className={cn(itemCls, destructive && "text-danger [&_svg]:text-danger", className)} {...props} />;
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn("px-3 py-2 text-xs font-medium text-muted-foreground", className)} {...props} />;
}

export function DropdownSeparator({ className, ...props }: React.ComponentProps<typeof DM.Separator>) {
  return <DM.Separator className={cn("my-1.5 h-px bg-border", className)} {...props} />;
}

export function DropdownRadioItem({ className, children, ...props }: React.ComponentProps<typeof DM.RadioItem>) {
  return (
    <DM.RadioItem className={cn(itemCls, "pr-8", className)} {...props}>
      {children}
      <DM.ItemIndicator className="absolute right-3">
        <Circle className="size-2! fill-primary text-primary!" />
      </DM.ItemIndicator>
    </DM.RadioItem>
  );
}

export function DropdownCheckboxItem({ className, children, ...props }: React.ComponentProps<typeof DM.CheckboxItem>) {
  return (
    <DM.CheckboxItem className={cn(itemCls, "pr-8", className)} {...props}>
      {children}
      <DM.ItemIndicator className="absolute right-3">
        <Check className="text-primary!" />
      </DM.ItemIndicator>
    </DM.CheckboxItem>
  );
}

export function DropdownSubTrigger({ className, children, ...props }: React.ComponentProps<typeof DM.SubTrigger>) {
  return (
    <DM.SubTrigger className={cn(itemCls, "data-[state=open]:bg-surface-2", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </DM.SubTrigger>
  );
}

export function DropdownSubContent({ className, ...props }: React.ComponentProps<typeof DM.SubContent>) {
  return (
    <DM.Portal>
      <DM.SubContent sideOffset={6} className={cn(contentCls, "min-w-40", className)} {...props} />
    </DM.Portal>
  );
}
