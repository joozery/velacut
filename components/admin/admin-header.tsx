"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronRight, ExternalLink, LogOut, Menu, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminFooterLinks, AdminNav } from "./admin-nav";
import { cn } from "@/lib/utils";

const TITLES: [string, string][] = [
  ["/admin/appearance", "ตกแต่งหน้าบ้าน"],
  ["/admin/finance", "รายงานการเงิน"],
  ["/admin/topups", "คำสั่งเติมเงิน"],
  ["/admin/users/", "รายละเอียดผู้ใช้"],
  ["/admin/users", "ผู้ใช้"],
  ["/admin/transactions", "รายการทั้งหมด"],
  ["/admin/admins", "ผู้ดูแลระบบ"],
  ["/admin/settings", "ตั้งค่าเครดิต"],
  ["/admin/payments", "ช่องทางชำระเงิน"],
  ["/admin/promo", "โปรโมชัน"],
  ["/admin/daily", "เช็กอินรายวัน"],
  ["/admin", "ภาพรวม"],
];

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "A";

type Admin = { name: string; email: string; image?: string | null };

export function AdminHeader({ admin, pending }: { admin: Admin; pending: number }) {
  const pathname = usePathname();
  const q = useSearchParams().get("q") ?? "";
  const title = TITLES.find(([p]) => (p === "/admin" ? pathname === p : pathname.startsWith(p)))?.[1] ?? "หลังบ้าน";
  const sub = pathname.startsWith("/admin/users/") ? { href: "/admin/users", label: "ผู้ใช้" } : null;
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-8">
        {/* มือถือ: เปิดเมนูด้านข้าง */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="เปิดเมนูผู้ดูแล" className="lg:hidden"><Menu aria-hidden /></Button>
          </SheetTrigger>
          <SheetContent side="right" aria-describedby={undefined} className="w-[min(300px,calc(100vw-20px))] max-w-none rounded-l-3xl">
            <div className="flex items-center gap-2.5 px-5 pt-6 pb-4"><SheetClose asChild><Logo className="[&_img]:h-[18px]" /></SheetClose><span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-secondary-foreground">ADMIN</span></div>
            <SheetTitle className="sr-only">เมนูผู้ดูแล</SheetTitle>
            <div className="flex-1 px-3">
              <AdminNav pending={pending} vertical />
            </div>
            <div className="border-t border-border p-3"><AdminFooterLinks /></div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <nav aria-label="เส้นทาง" className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
            <Link href="/admin" className="hover:text-primary">หลังบ้าน</Link>
            {sub && <><ChevronRight className="size-3" aria-hidden /><Link href={sub.href} className="hover:text-primary">{sub.label}</Link></>}
          </nav>
          <p className="truncate text-sm font-semibold sm:text-base">{title}</p>
        </div>

        <form action="/admin/transactions" role="search" className="relative hidden md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input key={q} name="q" defaultValue={pathname === "/admin/transactions" ? q : ""} aria-label="ค้นหารายการ" placeholder="ค้นหาอีเมล เลขอ้างอิง ยอดโอน" className="h-10 w-64 rounded-xl border border-input bg-surface-2/50 pr-3 pl-9 text-sm placeholder:text-xs placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring xl:w-80" />
        </form>

        <Link href="/admin/topups" aria-label={pending ? `คำสั่งเติมรอยืนยัน ${pending} รายการ` : "ไม่มีคำสั่งเติมรอยืนยัน"} className={cn("relative grid size-9 place-items-center rounded-lg transition-colors hover:bg-surface-2", pending ? "text-foreground" : "text-muted-foreground")}>
          <Bell className="size-[18px]" aria-hidden />
          {pending > 0 && <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white tabular-nums ring-2 ring-surface">{pending > 99 ? "99+" : pending}</span>}
        </Link>
        <ThemeToggle />

        <Dropdown>
          <DropdownTrigger aria-label="เมนูบัญชีผู้ดูแล" className="flex items-center gap-2 rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-border focus-visible:outline-2 focus-visible:outline-ring sm:rounded-xl sm:py-1 sm:pr-2.5 sm:pl-1">
            <Avatar src={admin.image ?? undefined} fallback={initials(admin.name)} alt={admin.name} className="size-8" />
            <span className="hidden max-w-36 text-left sm:block"><span className="block truncate text-xs font-semibold">{admin.name}</span><span className="block truncate text-[10px] text-muted-foreground">ผู้ดูแลระบบ</span></span>
          </DropdownTrigger>
          <DropdownContent className="w-60">
            <DropdownLabel className="flex flex-col gap-0.5 py-2.5"><span className="text-sm font-semibold text-foreground">{admin.name}</span><span className="truncate font-normal">{admin.email}</span></DropdownLabel>
            <DropdownSeparator />
            <DropdownItem asChild><Link href="/" target="_blank"><ExternalLink aria-hidden />เปิดหน้าเว็บ</Link></DropdownItem>
            <DropdownSeparator />
            <DropdownItem destructive onSelect={() => signOut({ redirectTo: "/admin/login" })}><LogOut aria-hidden />ออกจากระบบ</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
      {/* มือถือ: ช่องค้นหาเต็มความกว้าง */}
      <form action="/admin/transactions" role="search" className="relative px-4 pb-3 md:hidden">
        <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-[calc(50%+6px)] text-muted-foreground" aria-hidden />
        <input key={q} name="q" defaultValue={pathname === "/admin/transactions" ? q : ""} aria-label="ค้นหารายการ" placeholder="ค้นหาอีเมล เลขอ้างอิง ยอดโอน" className="h-10 w-full rounded-xl border border-input bg-surface-2/50 pr-3 pl-9 text-base placeholder:text-xs placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring" />
      </form>
    </header>
  );
}
