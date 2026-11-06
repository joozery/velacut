import Image from "next/image";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import logoLight from "@/public/logo/logo-light.png";
import logoDark from "@/public/logo/logo-dark.png";

/** โลโก้ 2 เวอร์ชัน: ตัวอักษรกรมท่า (light) / ตัวอักษรขาว (dark) — สลับด้วย class dark */
export function Logo({ className }: { className?: string }) {
  const img = "h-[18px] w-auto sm:h-7";
  return (
    <Link href="/" aria-label={copy.header.logoAria} className={cn("inline-flex shrink-0 items-center rounded-lg", className)}>
      <Image src={logoLight} alt={copy.brand.name} priority className={cn(img, "dark:hidden")} />
      <Image src={logoDark} alt="" aria-hidden priority className={cn(img, "hidden dark:block")} />
    </Link>
  );
}
