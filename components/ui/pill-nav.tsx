"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type PillNavItem = {
  href: string;
  label: string;
  /** prefix ที่ถือว่า active (เช่น /generate ครอบ /generate/rov) */
  match?: string;
  icon?: React.ReactNode;
};

export function PillNav({ items, className, "aria-label": ariaLabel }: { items: PillNavItem[]; className?: string; "aria-label"?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className={cn("no-scrollbar overflow-x-auto", className)}>
      <ul className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-soft-sm">
        {items.map((item) => {
          const match = item.match ?? item.href;
          const active = match === "/" ? pathname === "/" : pathname.startsWith(match);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors [&_svg]:size-4",
                  active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
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
