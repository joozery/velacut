"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { History, LogOut, Monitor, Moon, Palette, Sun, User, Wallet } from "lucide-react";
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
import { toast } from "@/stores/toast-store";

export function UserMenu({ user }: { user: { name: string; email: string; initials: string } }) {
  const { theme, setTheme } = useTheme();
  const c = copy.header;

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={c.userMenuAria}
        className="rounded-full ring-offset-2 transition-shadow hover:ring-2 hover:ring-border focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Avatar fallback={user.initials} alt={user.name} />
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
          <Link href="/history"><History aria-hidden />{c.history}</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href="/topup"><Wallet aria-hidden />{c.topup}</Link>
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
        {/* Phase 4: เชื่อม Auth.js signOut() */}
        <DropdownItem destructive onSelect={() => toast({ title: copy.toast.comingSoon })}>
          <LogOut aria-hidden />{c.logout}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
