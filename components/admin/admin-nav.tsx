"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowUpRight, CalendarCheck, ChartNoAxesCombined, Coins, CreditCard, Images, LayoutDashboard, LayoutTemplate, ListOrdered, LogOut, Megaphone, Paintbrush, QrCode, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/admin/finance", label: "รายงานการเงิน", icon: ChartNoAxesCombined },
  { href: "/admin/topups", label: "คำสั่งเติมเงิน", icon: QrCode },
  { href: "/admin/users", label: "ผู้ใช้", icon: Users },
  { href: "/admin/transactions", label: "รายการทั้งหมด", icon: ListOrdered },
  { href: "/admin/settings", label: "ตั้งค่าเครดิต", icon: Coins },
  { href: "/admin/templates", label: "เทมเพลตป้าย", icon: LayoutTemplate },
  { href: "/admin/appearance", label: "ตกแต่งหน้าบ้าน", icon: Paintbrush },
  { href: "/admin/library", label: "คลังฮีโร่และสกิน", icon: Images },
  { href: "/admin/payments", label: "ช่องทางชำระเงิน", icon: CreditCard },
  { href: "/admin/promo", label: "โปรโมชัน", icon: Megaphone },
  { href: "/admin/daily", label: "เช็กอินรายวัน", icon: CalendarCheck },
  { href: "/admin/admins", label: "ผู้ดูแลระบบ", icon: ShieldCheck },
];

export function AdminNav({ pending, vertical = false }: { pending: number; vertical?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูผู้ดูแล" className={cn("flex gap-1", vertical ? "flex-col" : "no-scrollbar overflow-x-auto lg:flex-col")}>
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors", active ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground")}>
            <Icon className="size-4" aria-hidden />
            {label}
            {href === "/admin/topups" && pending > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white tabular-nums">{pending}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminFooterLinks() {
  return (
    <div className="grid gap-1">
      <Link href="/" className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"><ArrowUpRight className="size-4" aria-hidden />ไปหน้าเว็บ</Link>
      <button type="button" onClick={() => signOut({ redirectTo: "/admin/login" })} className="flex h-9 items-center gap-2.5 rounded-xl px-3 text-left text-xs text-danger hover:bg-danger-soft"><LogOut className="size-4" aria-hidden />ออกจากระบบ</button>
    </div>
  );
}
