"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export function Avatar({ src, fallback, alt, className }: { src?: string; fallback: string; alt: string; className?: string }) {
  return (
    <AvatarPrimitive.Root className={cn("inline-flex size-9 shrink-0 overflow-hidden rounded-full bg-secondary", className)}>
      {src && <AvatarPrimitive.Image src={src} alt={alt} className="size-full object-cover" />}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center text-xs font-semibold text-secondary-foreground">
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
