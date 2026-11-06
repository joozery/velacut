"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Images, Plus, UserRound, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "หน้าแรก", icon: House },
  { href: "/assets/rov", match: "/assets", label: "คลังภาพ", icon: Images },
  { href: "/generate/rov", match: "/generate", label: "สร้างป้าย", icon: Plus },
  { href: "/topup", label: "เติมคอยน์", icon: Wallet },
  { href: "/profile", label: "บัญชี", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return <nav aria-label="เมนูหลักบนมือถือ" className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgb(0_0_0/0.06)] backdrop-blur-xl md:hidden">
    <ul className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-center">
      {items.map(({ href, match, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(match ?? href);
        const create = href.startsWith("/generate");
        return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium transition-colors active:bg-primary-soft", active ? "text-primary" : "text-muted-foreground")}>
          <span className={cn("grid place-items-center", create ? "-mt-4 size-11 rounded-2xl bg-primary text-primary-foreground shadow-[0_4px_12px_rgb(20_99_232/0.25)]" : "h-7 w-12 rounded-full", active && !create && "bg-primary-soft")}><Icon className={create ? "size-6" : "size-5"} strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" /></span>
          {label}
        </Link></li>;
      })}
    </ul>
  </nav>;
}
