"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import { DialogOverlay } from "./dialog";

/** Sheet = Dialog ที่เลื่อนขึ้นจากด้านล่าง (bottom sheet) หรือด้านขวา */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const sheetVariants = cva(
  "fixed z-50 flex flex-col border-border bg-surface shadow-soft-lg outline-none",
  {
    variants: {
      side: {
        bottom:
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl border-t pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down md:mx-auto md:max-w-2xl",
        right:
          "inset-y-0 right-0 h-full w-[88%] max-w-md border-l data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right",
      },
    },
    defaultVariants: { side: "bottom" },
  },
);

export function SheetContent({
  side,
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {side !== "right" && (
          <div aria-hidden className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-surface-3" />
        )}
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            aria-label={copy.common.close}
            className="absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 px-5 pt-2 pb-3 pr-14", className)} {...props} />;
}
export function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-5", className)} {...props} />;
}
export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex gap-2 border-t border-border px-5 py-3", className)} {...props} />;
}
export function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}
export function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
