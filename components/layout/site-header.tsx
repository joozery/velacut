import { Logo } from "@/components/shared/logo";
import { PillNav, type PillNavItem } from "@/components/ui/pill-nav";
import { CoinBalance } from "./coin-balance";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { copy } from "@/lib/copy";
import { MOCK_USER } from "@/lib/mock";

const NAV: PillNavItem[] = [
  { href: "/", label: copy.nav.home },
  { href: "/generate/rov", label: copy.nav.generate, match: "/generate" },
  { href: "/assets/rov", label: copy.nav.assets, match: "/assets" },
  { href: "/topup", label: copy.nav.topup },
  { href: "/history", label: copy.nav.history },
];

/** Mobile app bar; floating capsule navigation on desktop. */
export function SiteHeader() {
  // Phase 4: ดึง session + wallet จริง
  const user = MOCK_USER;
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:border-0 md:bg-transparent md:px-4 md:pt-3 md:backdrop-blur-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 md:h-14 md:rounded-full md:border md:border-border md:bg-surface/85 md:pr-2 md:pl-5 md:shadow-soft md:backdrop-blur-md">
        <Logo className="[&_img]:h-4 min-[375px]:[&_img]:h-[18px] md:[&_img]:h-7" />
        <PillNav
          items={NAV}
          aria-label={copy.nav.mainNav}
          className="mx-auto hidden md:block [&_ul]:border-0 [&_ul]:bg-transparent [&_ul]:shadow-none"
        />
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0 md:gap-1.5">
          <div className="md:hidden">
            <CoinBalance balance={user.wallet.balance} showTopup={false} className="h-9 gap-0 border-0 bg-surface-2 px-2 shadow-none [&>span]:text-xs" />
          </div>
          <div className="hidden items-center gap-1.5 md:flex">
            <ThemeToggle />
            <CoinBalance balance={user.wallet.balance} className="h-10" />
            <UserMenu user={user} />
          </div>
          <MobileMenu className="size-11 rounded-2xl border border-border/70 bg-surface" items={[
            ...NAV,
            { href: "/profile", label: copy.header.profile },
            { href: "/chat", label: copy.nav.chat },
          ]} />
        </div>
      </div>
    </header>
  );
}
