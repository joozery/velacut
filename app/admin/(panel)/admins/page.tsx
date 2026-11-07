import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { listAdmins } from "@/lib/server/admin";
import { requireAdminPage } from "@/lib/server/session";
import { Avatar } from "@/components/ui/avatar";
import { Card, PageTitle, formatDateTime } from "@/components/admin/ui";
import { AddAdminForm, AdminRowActions } from "@/components/admin/admin-manage";

export const metadata = { title: "ผู้ดูแลระบบ" };

const SOURCE = { env: "ADMIN_EMAILS", db: "ฐานข้อมูล", both: "ADMIN_EMAILS + ฐานข้อมูล" };
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "A";

export default async function AdminAdmins() {
  const [me, admins] = await Promise.all([requireAdminPage(), listAdmins()]);
  return (
    <>
      <PageTitle title="ผู้ดูแลระบบ" desc={`แอดมินทั้งหมด ${admins.length} คน — เข้าหลังบ้านได้ด้วยอีเมลและรหัสผ่านเท่านั้น`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border/70">
            {admins.map((a) => {
              const self = a.email === me.email;
              return (
                <li key={a.email} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  <Avatar src={a.image ?? undefined} fallback={initials(a.name)} alt={a.name} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {a.id ? <Link href={`/admin/users/${a.id}`} className="hover:text-primary">{a.name}</Link> : a.name}
                      {self && <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary-soft-foreground">คุณ</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5"><ShieldCheck className="size-3" aria-hidden />{SOURCE[a.source]}</span>
                      {!a.hasAccount ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">ยังไม่มีบัญชี — สมัครที่ /register</span>
                        : a.hasPassword ? <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-success"><KeyRound className="size-3" aria-hidden />มีรหัสผ่าน</span>
                        : <span className="rounded-full bg-danger-soft px-2 py-0.5 text-danger">ยังไม่มีรหัสผ่าน — เข้าหลังบ้านไม่ได้</span>}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {a.lastLoginAt ? `เข้าระบบล่าสุด ${formatDateTime(a.lastLoginAt)}` : "ยังไม่มีข้อมูลการเข้าระบบ"}
                      {a.grantedBy && ` · ให้สิทธิ์โดย ${a.grantedBy}${a.grantedAt ? ` เมื่อ ${formatDateTime(a.grantedAt)}` : ""}`}
                    </p>
                  </div>
                  {a.id && <AdminRowActions userId={a.id} name={a.name} canRevoke={a.source === "db" && !self} envLocked={a.source !== "db"} self={self} />}
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="grid content-start gap-4">
          <Card className="p-4 sm:p-5"><h2 className="text-sm font-semibold">เพิ่มแอดมิน</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">ถ้าอีเมลนี้มีบัญชีอยู่แล้ว จะให้สิทธิ์บัญชีเดิม ถ้ายังไม่มี จะสร้างบัญชีใหม่ด้วยชื่อและรหัสผ่านที่กรอก</p><AddAdminForm /></Card>
          <p className="px-1 text-[11px] leading-5 text-muted-foreground">แอดมินที่มาจาก <code className="rounded bg-surface-2 px-1">ADMIN_EMAILS</code> ถอดสิทธิ์จากหน้านี้ไม่ได้ ต้องแก้ไฟล์ env แล้วรีสตาร์ทเซิร์ฟเวอร์</p>
        </div>
      </div>
    </>
  );
}
