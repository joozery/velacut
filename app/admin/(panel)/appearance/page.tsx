import Link from "next/link";
import { getAppearance } from "@/lib/server/appearance";
import { requireAdminPage } from "@/lib/server/session";
import { storageConfigured } from "@/lib/server/storage";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { AppearanceForm } from "@/components/admin/appearance-form";

export const metadata = { title: "ตกแต่งหน้าบ้าน" };
export default async function AdminAppearance({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAdminPage();
  const [{ value, meta }, { tab }] = await Promise.all([getAppearance(), searchParams]);
  return <>
    <PageTitle title="ตกแต่งหน้าบ้าน" desc={meta ? `บันทึกล่าสุด ${formatDateTime(meta.updatedAt)} · ${meta.updatedBy}` : "ปรับแบรนด์ สี และเนื้อหาหน้าแรกของเว็บ"}>
      <Link href="/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm hover:bg-surface-2">เปิดหน้าบ้าน ↗</Link>
    </PageTitle>
    <AppearanceForm key={tab ?? "brand"} initial={value} uploadReady={storageConfigured()} initialTab={tab} />
  </>;
}
