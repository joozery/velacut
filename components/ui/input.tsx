import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-2xl border border-input bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:opacity-50 aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-24 py-3", className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

/** Input ที่มีไอคอนด้านหน้า เช่นช่องค้นหา */
export function InputWithIcon({
  icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted-foreground [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  );
}
