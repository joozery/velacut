"use client";

import Link from "next/link";
import { useDemoWallet } from "@/stores/checkout-store";
import { History, House, Plus, Wallet } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { CoinIcon } from "@/components/shared/coin";
import { PillNav, type PillNavItem } from "@/components/ui/pill-nav";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";
import { copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import { MOCK_USER } from "@/lib/mock";

const NAV: PillNavItem[] = [
  { href: "/", label: copy.nav.home, icon: <House aria-hidden /> },
  { href: "/topup", label: copy.nav.topup, icon: <Wallet aria-hidden /> },
  { href: "/history", label: copy.nav.history, icon: <History aria-hidden /> },
];
const MOBILE_NAV: PillNavItem[] = [
  ...NAV,
  { href: "/profile", label: copy.header.profile },
  { href: "/chat", label: copy.nav.chat },
];

export function SiteHeader() {
  const user = MOCK_USER;
  const balance = useDemoWallet();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/95 pt-[env(safe-area-inset-top)] shadow-[0_2px_16px_rgb(20_40_80/0.025)] backdrop-blur-xl">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2 px-4 lg:hidden">
        <MobileMenu items={MOBILE_NAV} className="size-10 rounded-full bg-primary-soft text-primary md:inline-flex" />
        <Logo className="mx-auto [&_img]:h-4 min-[375px]:[&_img]:h-[18px]" />
        <Link href="/topup" aria-label={`กระเป๋าคอยน์ ${formatCoinsFixed(balance)} คอยน์ เติมคอยน์`} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-primary/10 bg-primary-soft/60 px-2.5 text-primary">
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
          <UserMenu user={user} showLabel />
        </div>
      </div>
    </header>
  );
}
