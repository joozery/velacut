import Link from "next/link";
import { ArrowUpRight, Search, SearchX, ShieldCheck, Users, UserRoundCheck } from "lucide-react";
import { listUsers } from "@/lib/server/admin";
import { formatCoinsFixed, formatInt } from "@/lib/format";
import { Card, FilterBar, PageTitle, Pager, fieldClass, formatDateTime, qs } from "@/components/admin/ui";
import { SignupSource, UserAvatar } from "@/components/admin/user-badges";
import { FilterSelect } from "@/components/admin/filter-select";
import { AdjustWalletDialog } from "@/components/admin/user-actions";

export const metadata = { title: "ผู้ใช้" };

type Params = { q?: string; page?: string; role?: string; provider?: string; sort?: string };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const role = ["admin", "member"].includes(sp.role ?? "") ? sp.role! : "all";
  const provider = ["google", "credentials"].includes(sp.provider ?? "") ? sp.provider! : "all";
  const sort = ["oldest", "name"].includes(sp.sort ?? "") ? sp.sort! : "newest";
  const data = await listUsers({ ...sp, role, provider, sort });
  const filtered = Boolean(sp.q?.trim() || role !== "all" || provider !== "all");
  const stats = [
    { label: "ผู้ใช้ทั้งหมด", value: data.summary.total, desc: "ทุกบัญชีในระบบ", icon: Users },
    { label: "ผู้ดูแลระบบ", value: data.summary.admins, desc: "บัญชีที่มีสิทธิ์แอดมิน", icon: ShieldCheck },
    { label: "เชื่อมต่อ Google", value: data.summary.google, desc: "รวมบัญชีที่ผูก Google เพิ่ม", icon: UserRoundCheck },
  ];
  return (
    <>
      <PageTitle title="ผู้ใช้" desc="ค้นหาบัญชี ตรวจสอบเครดิต และเปิดรายละเอียดเพื่อจัดการผู้ใช้">
        <Link href="/admin/admins" className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2"><ShieldCheck className="size-4" aria-hidden />จัดการแอดมิน</Link>
      </PageTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, desc, icon: Icon }) => <Card key={label} className="flex items-center gap-4 p-4 sm:block sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary sm:mb-4"><Icon className="size-5" aria-hidden /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatInt(value)} <span className="text-xs font-normal text-muted-foreground">บัญชี</span></p><p className="mt-1 text-[11px] text-muted-foreground">{desc}</p></div></Card>)}
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-4 sm:px-5"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">รายชื่อผู้ใช้</h2><span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{formatInt(data.total)}</span></div><p className="text-xs text-muted-foreground">ยอดเครดิตแสดงหน่วยคอยน์</p></div>
        <FilterBar action="/admin/users">
          <label className="relative min-w-0 flex-1"><span className="sr-only">ค้นหาชื่อ อีเมล หรือรหัสผู้ใช้</span><Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden /><input name="q" defaultValue={sp.q} placeholder="ค้นหาชื่อ อีเมล หรือรหัสผู้ใช้" className={`${fieldClass} w-full pl-9`} /></label>
          <FilterSelect key={`role-${role}`} name="role" defaultValue={role} label="สิทธิ์ผู้ใช้" options={[["all", "ทุกสิทธิ์"], ["member", "สมาชิก"], ["admin", "แอดมิน"]]} className="sm:w-32" />
          <FilterSelect key={`provider-${provider}`} name="provider" defaultValue={provider} label="ช่องทางเข้าสู่ระบบ" options={[["all", "ทุกช่องทาง"], ["google", "Google"], ["credentials", "อีเมล"]]} className="sm:w-32" />
          <FilterSelect key={`sort-${sort}`} name="sort" defaultValue={sort} label="เรียงลำดับ" options={[["newest", "สมัครล่าสุด"], ["oldest", "สมัครเก่าสุด"], ["name", "เรียงตามชื่อ"]]} className="sm:w-36" />
        </FilterBar>
        {filtered && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary-soft/30 px-4 py-3 text-xs"><span>พบ {formatInt(data.total)} บัญชี{sp.q?.trim() && <> สำหรับ “{sp.q.trim()}”</>}</span><Link href="/admin/users" className="font-medium text-primary hover:underline">ล้างตัวกรอง</Link></div>}
        {!data.rows.length ? <div className="flex flex-col items-center px-5 py-16 text-center"><SearchX className="mb-4 size-9 text-muted-foreground/60" aria-hidden /><h3 className="text-sm font-semibold">{filtered ? "ไม่พบผู้ใช้ที่ตรงกับตัวกรอง" : "ยังไม่มีผู้ใช้ในระบบ"}</h3><p className="mt-2 max-w-sm text-xs leading-6 text-muted-foreground">{filtered ? "ลองตรวจสอบชื่อ อีเมล หรือเปลี่ยนตัวกรองเพื่อดูบัญชีอื่น" : "บัญชีที่สมัครสมาชิกจะแสดงที่นี่ พร้อมข้อมูลช่องทางสมัครและเครดิต"}</p>{filtered && <Link href="/admin/users" className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">แสดงผู้ใช้ทั้งหมด</Link>}</div> : <>
          <div className="divide-y divide-border md:hidden">
            {data.rows.map((u) => <article key={u.id} className="p-4"><div className="flex items-center gap-3"><UserAvatar name={u.name} image={u.image} className="size-10" /><div className="min-w-0 flex-1"><Link href={`/admin/users/${u.id}`} className="block truncate text-sm font-semibold hover:text-primary">{u.name}</Link><p className="truncate text-xs text-muted-foreground">{u.email}</p></div>{u.admin && <span className="rounded-full bg-primary-soft px-2 py-1 text-[10px] font-medium text-primary">แอดมิน</span>}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><SignupSource providers={u.providers} compact /><span className="text-[11px] text-muted-foreground">{formatDateTime(u.createdAt)}</span></div><dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2/60 p-3">{[["โอนได้", u.transferable], ["โบนัส", u.bonus], ["รวม", u.balance]].map(([label, value]) => <div key={label}><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className="mt-1 text-xs font-semibold tabular-nums">{formatCoinsFixed(Number(value))}</dd></div>)}</dl><div className="mt-3 flex items-center justify-between gap-2"><AdjustWalletDialog user={u} /><Link href={`/admin/users/${u.id}`} className="flex items-center gap-1 text-xs font-medium text-primary">ดูรายละเอียด<ArrowUpRight className="size-3.5" aria-hidden /></Link></div></article>)}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <caption className="sr-only">รายชื่อผู้ใช้ ช่องทางสมัคร วันที่สมัคร และยอดเครดิต</caption>
              <thead className="bg-surface-2/50 text-[11px] text-muted-foreground"><tr>{["ผู้ใช้", "สมัครด้วย", "สมัครเมื่อ", "โอนได้", "โบนัส", "รวม", "จัดการ"].map((label, i) => <th key={label} scope="col" className={`px-4 py-3 font-medium ${i >= 3 ? "text-right" : ""}`}>{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-border/70">
                {data.rows.map((u) => <tr key={u.id} className="transition-colors hover:bg-surface-2/40"><td className="px-4 py-4"><Link href={`/admin/users/${u.id}`} className="group flex items-center gap-3"><UserAvatar name={u.name} image={u.image} /><span className="min-w-0"><span className="font-medium group-hover:text-primary">{u.name}</span>{u.admin && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[9px] text-primary">แอดมิน</span>}<span className="mt-0.5 block max-w-56 truncate text-xs text-muted-foreground" title={u.email}>{u.email}</span></span></Link></td><td className="px-4 py-4"><SignupSource providers={u.providers} compact /></td><td className="px-4 py-4 text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(u.createdAt)}</td><td className="px-4 py-4 text-right tabular-nums">{formatCoinsFixed(u.transferable)}</td><td className="px-4 py-4 text-right text-primary tabular-nums">{formatCoinsFixed(u.bonus)}</td><td className="px-4 py-4 text-right font-semibold tabular-nums">{formatCoinsFixed(u.balance)}</td><td className="px-4 py-4 text-right"><div className="inline-flex items-center gap-1.5"><AdjustWalletDialog user={u} compact /><Link href={`/admin/users/${u.id}`} aria-label={`ดูรายละเอียด ${u.name}`} className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary"><ArrowUpRight className="size-4" aria-hidden /></Link></div></td></tr>)}
              </tbody>
            </table>
          </div>
        </>}
        <Pager page={data.page} pages={data.pages} total={data.total} href={(p) => qs("/admin/users", { q: sp.q, role, provider, sort, page: p })} />
      </Card>
    </>
  );
}
