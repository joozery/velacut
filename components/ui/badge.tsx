import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-surface-2 text-foreground",
        primary: "bg-primary text-primary-foreground",
        soft: "bg-primary-soft text-primary-soft-foreground",
        dark: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-surface text-foreground",
        success: "bg-success-soft text-success",
        danger: "bg-danger-soft text-danger",
      },
      size: {
        sm: "h-5 px-2 text-[11px]",
        md: "h-7 px-3 text-xs",
        lg: "h-8 px-3.5 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
