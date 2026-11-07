import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getUserDetail, listTransactions } from "@/lib/server/admin";
import { requireAdminPage } from "@/lib/server/session";
import { formatCoinsFixed } from "@/lib/format";
import { Card, Pager, formatDateTime, qs } from "@/components/admin/ui";
import { TxTable } from "@/components/admin/tx-table";
import { AdjustWalletForm, AdminRoleToggle } from "@/components/admin/user-actions";
import { SignupSource, UserAvatar } from "@/components/admin/user-badges";

export const metadata = { title: "รายละเอียดผู้ใช้" };

export default async function AdminUserDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ id }, sp, me] = await Promise.all([params, searchParams, requireAdminPage()]);
  const user = await getUserDetail(decodeURIComponent(id));
  if (!user) notFound();
  const txs = await listTransactions({ userId: user.id, page: sp.page });
  const self = user.email === me.email;
  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><ChevronLeft className="size-3.5" aria-hidden />ผู้ใช้ทั้งหมด</Link>
      <header className="mb-6 flex items-center gap-4">
        <UserAvatar name={user.name} image={user.image} className="size-14 text-base" />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">{user.name}{user.admin && <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[10px] text-secondary-foreground">ADMIN</span>}</h1>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[["รวม", user.wallet.balance, ""], ["โอนได้", user.wallet.transferable, ""], ["โบนัส", user.wallet.bonus, "text-primary"]].map(([l, v, c]) => (
              <Card key={l as string} className="p-4"><p className="text-xs text-muted-foreground">{l}</p><p className={`mt-2 text-xl font-bold tabular-nums sm:text-2xl ${c}`}>{formatCoinsFixed(v as number)}</p></Card>
            ))}
          </div>
          <Card className="p-4">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">รหัสผู้ใช้</dt><dd className="mt-0.5 font-mono text-xs break-all select-all">{user.id}</dd></div>
              <div><dt className="text-xs text-muted-foreground">สมัครเมื่อ</dt><dd className="mt-0.5">{formatDateTime(user.createdAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">สมัครด้วย</dt><dd className="mt-1"><SignupSource providers={user.providers} /></dd></div>
              <div><dt className="text-xs text-muted-foreground">สิทธิ์ผู้ดูแล</dt><dd className="mt-1"><AdminRoleToggle userId={user.id} roleAdmin={user.roleAdmin} fromEnv={user.adminFromEnv} self={self} /></dd></div>
            </dl>
          </Card>
        </div>
        <Card className="p-4 sm:p-5"><h2 id="adjust" className="text-sm font-semibold">เพิ่ม / หักเครดิต</h2><p className="mt-1 text-xs text-muted-foreground">ใช้ชดเชย/แก้ไขยอด — ผู้ใช้จะเห็นในประวัติพร้อมเหตุผล</p><AdjustWalletForm userId={user.id} wallet={user.wallet} /></Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-border px-4 py-3 text-sm font-semibold">ประวัติรายการ</h2>
        <TxTable rows={txs.rows} showUser={false} showActions />
        <Pager page={txs.page} pages={txs.pages} total={txs.total} href={(p) => qs(`/admin/users/${user.id}`, { page: p })} />
      </Card>
    </>
  );
}
