import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,box-shadow,transform] select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-soft-sm hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground shadow-soft-sm hover:bg-secondary-hover",
        outline: "border border-border bg-surface text-foreground hover:bg-surface-2",
        soft: "bg-primary-soft text-primary-soft-foreground hover:brightness-95",
        ghost: "text-foreground hover:bg-surface-2",
        danger: "bg-danger text-white hover:brightness-95",
        link: "text-primary underline-offset-4 hover:underline px-0! h-auto!",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-sm [&_svg]:size-4",
        md: "h-11 rounded-xl px-5 text-sm [&_svg]:size-4",
        lg: "h-13 rounded-xl px-7 text-base [&_svg]:size-5",
        icon: "size-11 rounded-xl [&_svg]:size-5",
        "icon-sm": "size-9 rounded-lg [&_svg]:size-4",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, block, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}
