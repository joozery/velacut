"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { PillNavItem } from "@/components/ui/pill-nav";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export function MobileMenu({ items, className }: { items: PillNavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={copy.header.menu} className={cn("md:hidden", className)}>
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader className="pt-5">
          <SheetTitle>{copy.nav.mainNav}</SheetTitle>
        </SheetHeader>
        <nav aria-label={copy.nav.mainNav} className="min-h-0 flex-1 overflow-y-auto px-3">
          <ul className="grid gap-1">
            {items.map((item) => {
              const match = item.match ?? item.href;
              const active = match === "/" ? pathname === "/" : pathname.startsWith(match);
              return (
                <li key={item.href}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-12 items-center rounded-2xl px-4 text-base font-medium transition-colors",
                        active ? "bg-secondary text-secondary-foreground" : "hover:bg-surface-2",
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mx-4 mb-[max(1rem,env(safe-area-inset-bottom))] flex shrink-0 items-center justify-between rounded-2xl bg-surface-2 px-4 py-2">
          <span className="text-sm font-medium">{copy.header.theme}</span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
