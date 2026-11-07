import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { UiIcon, type UiIconName } from "@/components/icons/ui-icon";
import { TopupForm } from "@/components/topup/topup-form";
import { WalletCard } from "@/components/topup/wallet-card";
import { copy } from "@/lib/copy";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTopupConfig } from "@/lib/server/settings";
import { getPaymentMethods } from "@/lib/server/payments";

export const metadata: Metadata = { title: copy.topup.title, description: copy.topup.description };
const t = copy.topup;
const STEP_ICONS: UiIconName[] = ["qr-code", "clock", "badge-check"];

export default async function TopupPage() {
  if (!(await auth())?.user) redirect("/login?callbackUrl=%2Ftopup");
  const [config, methods] = await Promise.all([getTopupConfig(), getPaymentMethods()]);
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-8 sm:pt-8">
        <nav aria-label="เส้นทางหน้าเติมเครดิต" className="mb-6 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Link href="/" className="hover:text-primary">หน้าแรก</Link><ChevronRight className="size-3" aria-hidden /><span aria-current="page">เติมเครดิต</span><Link href="/history" className="ml-auto hidden min-h-8 items-center gap-1.5 text-[11px] font-medium hover:text-primary sm:inline-flex"><History className="size-3.5" aria-hidden />ประวัติการเติม</Link></nav>
        <header className="relative isolate mb-6 flex min-h-40 items-center overflow-hidden rounded-2xl border border-primary/15 bg-[#edf4ff] p-5 dark:bg-surface sm:min-h-44 sm:p-7">
          <Image src="/images/topup-coins-background-v1.webp" alt="" fill priority sizes="(max-width: 640px) 100vw, 1100px" className="pointer-events-none object-cover object-right opacity-100 dark:opacity-40" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.85)_40%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(to_right,var(--surface)_0%,transparent_100%)]" />
          <div className="relative z-10 max-w-[80%] sm:max-w-[65%]"><p className="mb-2 font-mono text-[9px] font-medium tracking-[0.18em] text-primary">YOUR CREATIVE BALANCE</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">เติมเครดิต<span className="text-primary"> พร้อมสร้างป้าย</span></h1><p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm">เลือกจำนวนที่ใช่ รับโบนัสเพิ่ม แล้วกลับไปสร้างป้ายในสไตล์คุณ</p></div>
        </header>
        <WalletCard />
        <TopupForm config={config} methods={methods}>
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-sm font-semibold">{t.stepsTitle}</h2>
            <ol className="mt-5 grid gap-5 sm:grid-cols-3">
              {t.steps.map((step, i) => <li key={step.title} className="flex gap-3 sm:flex-col"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-primary"><UiIcon name={STEP_ICONS[i]} className="size-5" /></span><div><p className="text-xs font-semibold"><span className="mr-1.5 text-primary">0{i + 1}</span>{step.title}</p><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{step.desc}</p></div></li>)}
            </ol>
          </section>
        </TopupForm>
      </div>
    </div>
  );
}
