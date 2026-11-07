"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBalance } from "@/stores/account-store";
import { FileImage, History, House, LogIn, Plus, Send, Wallet } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { CoinIcon } from "@/components/shared/coin";
import { PillNav, type PillNavItem } from "@/components/ui/pill-nav";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";

const NAV: PillNavItem[] = [
  { href: "/", label: copy.nav.home, icon: <House aria-hidden /> },
  { href: "/topup", label: copy.nav.topup, icon: <Wallet aria-hidden /> },
  { href: "/posters", label: "ป้ายของฉัน", icon: <FileImage aria-hidden /> },
  { href: "/history", label: copy.nav.history, icon: <History aria-hidden /> },
];
const MOBILE_NAV: PillNavItem[] = [
  ...NAV,
  { href: "/profile", label: copy.header.profile },
  { href: "/profile#transfer", label: copy.topup.transfer.title, icon: <Send aria-hidden /> },
  { href: "/chat", label: copy.nav.chat },
];

export function SiteHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const user = session?.user;
  const loginHref = pathname === "/" ? "/login" : `/login?callbackUrl=${encodeURIComponent(pathname)}`;
  const balance = useBalance();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/95 pt-[env(safe-area-inset-top)] shadow-[0_2px_16px_rgb(20_40_80/0.025)] backdrop-blur-xl">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2 px-4 lg:hidden">
        <MobileMenu items={MOBILE_NAV} className="size-10 rounded-full bg-primary-soft text-primary md:inline-flex" />
        <Logo className="mx-auto [&_img]:h-4 min-[375px]:[&_img]:h-[18px]" />
        <Link href="/topup" aria-label={`กระเป๋าเครดิต ${formatCoinsFixed(balance)} เครดิต เติมเครดิต`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary/10 bg-primary-soft/60 px-2.5 text-primary">
          <CoinIcon className="size-4" /><span className="text-[11px] font-bold tabular-nums">{formatCoinsFixed(balance)}</span><Plus className="size-3" aria-hidden />
        </Link>
      </div>

      <div className="mx-auto hidden h-[60px] max-w-7xl items-center gap-6 px-6 lg:flex xl:gap-9">
        <div className="shrink-0"><Logo className="[&_img]:h-5" /></div>
        <PillNav items={NAV} aria-label={copy.nav.mainNav} className="ml-auto" />
        <div className="flex shrink-0 items-center gap-3 border-l border-border pl-5">
          <Link href="/topup" aria-label={copy.header.topupAria} className="group inline-flex h-9 items-center gap-2.5 rounded-xl border border-primary/10 bg-primary-soft/60 pr-2 pl-3 transition-colors hover:bg-primary-soft">
            <CoinIcon className="size-5" />
            <span className="text-[13px] font-bold tabular-nums">{formatCoinsFixed(balance)}</span>
            <span className="ml-1 grid size-7 place-items-center rounded-lg bg-surface text-primary ring-1 ring-primary/10 group-hover:bg-primary group-hover:text-primary-foreground"><Plus className="size-3.5" aria-hidden /></span>
          </Link>
          {user ? (
            <UserMenu user={{ name: user.name ?? user.email ?? "", email: user.email ?? "", image: user.image }} showLabel />
          ) : status === "loading" ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-surface-2" aria-hidden />
          ) : (
            <Link href={loginHref} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"><LogIn className="size-3.5" aria-hidden />{copy.header.login}</Link>
          )}
        </div>
      </div>
    </header>
  );
}
