"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLogout } from "@/components/auth/use-logout";
import { ArrowUpRight, FileImage, LogOut, History, House, Menu, MessageCircle, Sparkles, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { PillNavItem } from "@/components/ui/pill-nav";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "@/components/shared/logo";

const icons = { "/": House, "/generate": Sparkles, "/topup": Wallet, "/posters": FileImage, "/history": History, "/profile": UserRound, "/chat": MessageCircle };

export function MobileMenu({ items, className }: { items: PillNavItem[]; className?: string }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { logout, pending } = useLogout();
  const user = session?.user;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={copy.header.menu} className={cn("md:hidden", className)}>
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined} className="w-[min(360px,calc(100vw-20px))] max-w-none rounded-l-3xl border-t-4 border-t-primary">
        <SheetHeader className="gap-3 px-6 pt-6 pb-5">
          <SheetClose asChild><Logo className="w-fit [&_img]:h-[18px]" /></SheetClose>
          <div><SheetTitle className="mt-2 text-xl">ไปที่ไหนต่อดี?</SheetTitle><p className="mt-1 text-xs leading-5 text-muted-foreground">พื้นที่สร้างป้ายในสไตล์ของคุณ</p></div>
        </SheetHeader>
        <nav aria-label={copy.nav.mainNav} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-2">
          <ul className="grid gap-1.5">
            {items.map((item) => {
              const match = item.match ?? item.href;
              const active = match === "/" ? pathname === "/" : pathname.startsWith(match);
              const Icon = Object.entries(icons).find(([prefix]) => prefix === "/" ? item.href === "/" : item.href.startsWith(prefix))?.[1] ?? ArrowUpRight;
              return (
                <li key={item.href}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex min-h-14 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-colors",
                        active ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                      )}
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl [&_svg]:size-[18px]", active ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground group-hover:bg-surface")}>
                        {item.icon ?? <Icon aria-hidden />}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <ArrowUpRight className={cn("size-3.5", active ? "text-primary" : "text-muted-foreground/40")} aria-hidden />
                    </Link>
                  </SheetClose>
                </li>
              );
            })}
          </ul>
        </nav>
        {user ? (
          <div className="mx-4 mt-3 flex shrink-0 items-center gap-3 rounded-2xl border border-border px-4 py-3">
            <Avatar src={user.image ?? undefined} alt={user.name ?? "รูปโปรไฟล์"} fallback={(user.name ?? user.email ?? "?").trim().slice(0, 2).toUpperCase()} />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user.name}</span><span className="block truncate text-[11px] text-muted-foreground">{user.email}</span></span>
            <Button variant="ghost" size="sm" disabled={pending} onClick={logout} className="text-danger"><LogOut aria-hidden />{pending ? "กำลังออกจากระบบ…" : copy.header.logout}</Button>
          </div>
        ) : status !== "loading" && (
          <div className="mx-4 mt-3 grid shrink-0 grid-cols-2 gap-2">
            <SheetClose asChild><Button asChild variant="outline"><Link href="/register">สมัครสมาชิก</Link></Button></SheetClose>
            <SheetClose asChild><Button asChild><Link href={pathname === "/" ? "/login" : `/login?callbackUrl=${encodeURIComponent(pathname)}`}>{copy.header.login}</Link></Button></SheetClose>
          </div>
        )}
        <div className="mx-4 mt-3 mb-[max(1rem,env(safe-area-inset-bottom))] flex shrink-0 items-center justify-between rounded-2xl border border-border bg-surface-2/60 px-4 py-3">
          <span><span className="block text-xs font-medium">{copy.header.theme}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">ปรับหน้าจอให้สบายตา</span></span>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
