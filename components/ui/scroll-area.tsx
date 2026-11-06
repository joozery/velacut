"use client";

import * as React from "react";
import * as SA from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

export function ScrollArea({
  className,
  children,
  orientation = "vertical",
  viewportClassName,
  ...props
}: React.ComponentProps<typeof SA.Root> & { orientation?: "vertical" | "horizontal" | "both"; viewportClassName?: string }) {
  return (
    <SA.Root className={cn("relative overflow-hidden", className)} {...props}>
      <SA.Viewport className={cn("size-full rounded-[inherit]", viewportClassName)}>{children}</SA.Viewport>
      {(orientation === "vertical" || orientation === "both") && <ScrollBar orientation="vertical" />}
      {(orientation === "horizontal" || orientation === "both") && <ScrollBar orientation="horizontal" />}
      <SA.Corner />
    </SA.Root>
  );
}

function ScrollBar({ orientation }: { orientation: "vertical" | "horizontal" }) {
  return (
    <SA.Scrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none p-0.5 select-none",
        orientation === "vertical" ? "h-full w-2" : "h-2 flex-col",
      )}
    >
      <SA.Thumb className="relative flex-1 rounded-full bg-surface-3" />
    </SA.Scrollbar>
  );
}
