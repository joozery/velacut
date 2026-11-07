import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Logo } from "@/components/shared/logo";
import { AdminFooterLinks, AdminNav } from "@/components/admin/admin-nav";
import { requireAdminPage } from "@/lib/server/session";
import { collections } from "@/lib/server/collections";

export const metadata: Metadata = { title: { default: "หลังบ้าน", template: "%s · หลังบ้าน VELACUT" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const { txs } = await collections();
  const pending = await txs.countDocuments({ kind: "topup", status: "pending", "topup.expiresAt": { $gte: new Date() } });
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5"><Logo className="[&_img]:h-[18px]" /><span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-secondary-foreground">ADMIN</span></div>
        <div className="flex-1 overflow-y-auto px-3 py-4"><AdminNav pending={pending} /></div>
        <div className="border-t border-border p-3"><AdminFooterLinks /></div>
      </aside>
      <div className="min-w-0">
        {/* useSearchParams ต้องอยู่ใน Suspense */}
        <Suspense fallback={<div className="h-16 border-b border-border bg-surface" />}>
          <AdminHeader admin={{ name: admin.name, email: admin.email, image: admin.image }} pending={pending} />
        </Suspense>
        <main id="main" className="px-4 py-6 sm:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
