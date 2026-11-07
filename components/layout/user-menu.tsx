"use client";

import Link from "next/link";
import { useLogout } from "@/components/auth/use-logout";
import { useTheme } from "next-themes";
import { ChevronDown, FileImage, History, LogOut, Monitor, Moon, Palette, Send, Sun, User, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export function UserMenu({ user, showLabel = false }: { user: { name: string; email: string; image?: string | null }; showLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { logout, pending } = useLogout();
  const c = copy.header;

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={c.userMenuAria}
        className={cn("rounded-full ring-offset-2 transition-shadow hover:ring-2 hover:ring-border focus-visible:outline-2 focus-visible:outline-ring", showLabel && "inline-flex h-9 items-center gap-1.5 border border-border bg-surface py-1 pr-2 pl-1")}
      >
        <Avatar src={user.image ?? undefined} fallback={initials(user.name)} alt={user.name} className={showLabel ? "size-7" : undefined} />
        {showLabel && <><span className="hidden text-xs font-medium 2xl:inline">บัญชี</span><ChevronDown className="size-3 text-muted-foreground" aria-hidden /></>}
      </DropdownTrigger>
      <DropdownContent className="w-60">
        <DropdownLabel className="flex flex-col gap-0.5 py-2.5">
          <span className="text-sm font-semibold text-foreground">{user.name}</span>
          <span className="truncate font-normal">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/profile"><User aria-hidden />{c.profile}</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/posters"><FileImage aria-hidden />ป้ายของฉัน</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/history"><History aria-hidden />{c.history}</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/topup"><Wallet aria-hidden />{c.topup}</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/profile#transfer"><Send aria-hidden />{copy.topup.transfer.title}</Link>
        </DropdownItem>
        <DropdownSub>
          <DropdownSubTrigger><Palette aria-hidden />{c.theme}</DropdownSubTrigger>
          <DropdownSubContent>
            <DropdownRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownRadioItem value="light"><Sun aria-hidden />{copy.theme.light}</DropdownRadioItem>
              <DropdownRadioItem value="dark"><Moon aria-hidden />{copy.theme.dark}</DropdownRadioItem>
              <DropdownRadioItem value="system"><Monitor aria-hidden />{copy.theme.system}</DropdownRadioItem>
            </DropdownRadioGroup>
          </DropdownSubContent>
        </DropdownSub>
        <DropdownSeparator />
        <DropdownItem destructive disabled={pending} onSelect={(event) => { event.preventDefault(); logout(); }}>
          <LogOut aria-hidden />{pending ? "กำลังออกจากระบบ…" : c.logout}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
