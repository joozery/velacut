"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type PillNavItem = {
  href: string;
  label: string;
  /** prefix ที่ถือว่า active (เช่น /generate ครอบ /generate/mlbb) */
  match?: string;
  icon?: React.ReactNode;
};

export function PillNav({ items, className, "aria-label": ariaLabel }: { items: PillNavItem[]; className?: string; "aria-label"?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className={cn("no-scrollbar overflow-x-auto", className)}>
      <ul className="inline-flex items-center gap-4 xl:gap-6">
        {items.map((item) => {
          const match = item.match ?? item.href;
          const active = match === "/" ? pathname === "/" : pathname.startsWith(match);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex h-[60px] items-center gap-1.5 border-b-2 px-0.5 pt-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:size-3.5 xl:text-[13px]",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
