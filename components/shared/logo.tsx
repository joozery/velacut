"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import logoLight from "@/public/logo/logo-light.png";
import logoDark from "@/public/logo/logo-dark.png";
import { useAppearance } from "./appearance-provider";

/** โลโก้ 2 เวอร์ชัน: ตัวอักษรกรมท่า (light) / ตัวอักษรขาว (dark) — สลับด้วย class dark */
export function Logo({ className, ...props }: Omit<ComponentProps<typeof Link>, "href" | "children">) {
  const site = useAppearance();
  const img = "h-[18px] w-auto sm:h-7";
  return (
    <Link href="/" aria-label={`${site.name} — ${copy.nav.home}`} className={cn("inline-flex shrink-0 items-center rounded-lg", className)} {...props}>
      <Image src={site.logoLight === "/logo/logo-light.png" ? logoLight : site.logoLight} alt={site.name} width={900} height={122} unoptimized priority className={cn(img, "dark:hidden")} />
      <Image src={site.logoDark === "/logo/logo-dark.png" ? logoDark : site.logoDark} alt="" aria-hidden width={900} height={122} unoptimized priority className={cn(img, "hidden dark:block")} />
    </Link>
  );
}
