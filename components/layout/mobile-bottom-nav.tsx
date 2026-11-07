"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, Plus, UserRound, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "หน้าแรก", icon: House },
  { href: "/topup", label: "เติมเครดิต", icon: Wallet },
  { href: "/generate/mlbb", match: "/generate", label: "สร้างป้าย", icon: Plus },
  { href: "/history", label: "ประวัติ", icon: History },
  { href: "/profile", label: "บัญชี", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return <nav aria-label="เมนูหลักบนมือถือ" className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgb(0_0_0/0.06)] backdrop-blur-xl md:hidden">
    <ul className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-center">
      {items.map(({ href, match, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(match ?? href);
        const create = href.startsWith("/generate");
        return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium transition-colors active:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", create ? "-mt-5 gap-1.5 font-bold text-primary" : active ? "text-primary" : "text-muted-foreground")}>
          <span className={cn("grid place-items-center", create ? "size-14 rounded-2xl bg-primary text-primary-foreground ring-[5px] ring-surface shadow-[0_6px_18px_rgb(47_120_245/0.35)] transition-transform active:scale-95" : "h-7 w-12 rounded-lg", active && !create && "bg-primary-soft")}><Icon className={create ? "size-7" : "size-5"} strokeWidth={create || active ? 2.2 : 1.7} aria-hidden="true" /></span>
          {label}
        </Link></li>;
      })}
    </ul>
  </nav>;
}
