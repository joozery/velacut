"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CoinBalance } from "./coin-balance";
import { UserMenu } from "./user-menu";
import { copy } from "@/lib/copy";

/** ยอดเครดิต + เมนูผู้ใช้ หรือปุ่มเข้าสู่ระบบ — อ่าน session ฝั่ง client จึงใช้ในหน้า static ได้ */
export function AccountActions() {
  const { data, status } = useSession();
  const pathname = usePathname();
  const user = data?.user;
  if (status === "loading") return <span className="h-9 w-24 animate-pulse rounded-full bg-surface-2" aria-hidden />;
  if (!user) {
    return (
      <Button asChild size="sm" className="rounded-full">
        <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>{copy.header.login}</Link>
      </Button>
    );
  }
  return (
    <>
      <CoinBalance />
      <UserMenu user={{ name: user.name ?? user.email ?? "", email: user.email ?? "", image: user.image }} />
    </>
  );
}
