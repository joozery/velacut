import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, CheckCircle2, CircleDashed, FileImage, Minus, Trophy, UserPlus, Users, Wallet } from "lucide-react";
import { listTransactions } from "@/lib/server/admin";
import { getDashboard } from "@/lib/server/dashboard";
import { formatBaht, formatCoinsFixed, formatInt } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";
import { TxTable } from "@/components/admin/tx-table";
import { SignupSource, UserAvatar } from "@/components/admin/user-badges";
import { cn } from "@/lib/utils";

export const metadata = { title: "ภาพรวม" };

const fmtDay = (s: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("th-TH", { ...o, timeZone: "Asia/Bangkok" }).format(new Date(`${s}T12:00:00+07:00`));
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  if (m < 1440) return `${Math.floor(m / 60)} ชม.ที่แล้ว`;
  return `${Math.floor(m / 1440)} วันที่แล้ว`;
};

function Delta({ now, prev, unit = "เมื่อวาน" }: { now: number; prev: number | undefined; unit?: string }) {
  if (prev === undefined) return null;
  if (prev === 0 && now === 0) return <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground"><Minus className="size-3" aria-hidden />เท่า{unit}</span>;
  const up = now >= prev;
  const pct = prev === 0 ? null : Math.round(((now - prev) / prev) * 100);
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums", up ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
      <Icon className="size-3" aria-hidden />{pct === null ? "ใหม่" : `${Math.abs(pct)}%`}<span className="font-normal opacity-80">vs {unit}</span>
    </span>
  );
}

function Kpi({ label, icon: Icon, value, foot, delta }: { label: string; icon: typeof Banknote; value: string; foot: React.ReactNode; delta?: React.ReactNode }) {
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-4" aria-hidden /></span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-[28px]">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">{delta}{foot}</div>
    </Card>
  );
}

function SectionHead({ title, href, link = "ดูทั้งหมด", children }: { title: string; href?: string; link?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
      {href && <Link href={href} className="flex items-center gap-1 text-xs text-primary hover:underline">{link}<ArrowRight className="size-3" aria-hidden /></Link>}
    </div>
  );
}

export default async function AdminDashboard() {
  const [d, pending, recent] = await Promise.all([getDashboard(), listTransactions({ kind: "topup", status: "pending" }), listTransactions({})]);
  const { stats: s, today: t, yesterday: y, month: m } = d;
  const max = Math.max(1, ...d.days.map((x) => x.revenue));
  const chartTotal = d.days.reduce((a, x) => a + x.revenue, 0);
  const methodTotal = m.promptpay + m.truemoney;
  const ppPct = methodTotal ? Math.round((m.promptpay / methodTotal) * 100) : 0;
  const avgTicket = m.topups ? m.revenue / m.topups : 0;
  const statusOk = d.status.filter((x) => x.ok).length;

  return (
    <>
      <PageTitle title="ภาพรวม" desc={`${fmtDay(t.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · เวลาไทย`}>
        <div className="flex gap-2">
          <Link href="/admin/finance" className="h-10 content-center rounded-xl border border-border bg-surface px-4 text-sm hover:bg-surface-2">รายงานการเงิน</Link>
          <Link href="/admin/topups" className="h-10 content-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">คำสั่งเติมเงิน</Link>
        </div>
      </PageTitle>

      {s.pendingTopups > 0 && (
        <Link href="/admin/topups?status=pending" className="mb-5 flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft/50 px-4 py-3 text-sm transition-colors hover:bg-danger-soft">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger text-white"><AlertTriangle className="size-4" aria-hidden /></span>
          <span className="min-w-0 flex-1"><b className="text-danger">มีคำสั่งเติม {formatInt(s.pendingTopups)} รายการรอยืนยัน</b><span className="block text-xs text-muted-foreground">ตรวจยอดโอนให้ตรงกับเศษสตางค์ แล้วกดยืนยันเพื่อเพิ่มเครดิตให้ผู้ใช้</span></span>
          <ArrowRight className="size-4 shrink-0 text-danger" aria-hidden />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="ยอดเติมวันนี้" icon={Banknote} value={`฿${formatBaht(t.revenue)}`} delta={<Delta now={t.revenue} prev={y?.revenue} />} foot={<span>{formatInt(t.topups)} รายการ · {formatInt(t.payers)} คน</span>} />
        <Kpi label="ผู้ใช้งานวันนี้" icon={Users} value={formatInt(t.active)} delta={<Delta now={t.active} prev={y?.active} />} foot={<span>สมัครใหม่ {formatInt(t.newUsers)} · ทั้งหมด {formatInt(s.users)}</span>} />
        <Kpi label="ป้ายที่สร้างวันนี้" icon={FileImage} value={formatInt(t.posters)} delta={<Delta now={t.posters} prev={y?.posters} />} foot={<span>ใช้ {formatCoinsFixed(t.spent)} เครดิต · รวม {formatInt(s.posters)} ป้าย</span>} />
        <Kpi label="เครดิตคงค้างในระบบ" icon={Wallet} value={formatCoinsFixed(s.coinsTransferable + s.coinsBonus)} foot={<span>โอนได้ {formatCoinsFixed(s.coinsTransferable)} · โบนัส {formatCoinsFixed(s.coinsBonus)}</span>} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <SectionHead title="ยอดเติมเงิน 14 วันล่าสุด" href="/admin/finance" link="รายงานเต็ม" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div><p className="text-xs text-muted-foreground">รวม 14 วัน</p><p className="text-xl font-bold tabular-nums">฿{formatBaht(chartTotal)}</p></div>
              <div className="flex gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />PromptPay</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-400" />TrueMoney</span></div>
            </div>
            <div className="mt-5 flex h-48 items-end gap-1.5 border-b border-border sm:gap-2.5" role="img" aria-label="กราฟยอดเติมเงินรายวัน 14 วันล่าสุด แยก PromptPay และ TrueMoney">
              {d.days.map((x, i) => {
                const last = i === d.days.length - 1;
                return (
                  <div key={x.date} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-max -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] leading-5 text-background shadow-lg group-hover:block">
                      <b>{fmtDay(x.date, { day: "numeric", month: "short" })}</b> · ฿{formatBaht(x.revenue)}<br />PromptPay ฿{formatBaht(x.promptpay)} · TrueMoney ฿{formatBaht(x.truemoney)}<br />{formatInt(x.topups)} รายการ · ป้าย {formatInt(x.posters)}
                    </div>
                    {x.revenue === 0
                      ? <div className="h-1 rounded-t bg-surface-2" />
                      : <div className={cn("flex flex-col overflow-hidden rounded-t-md transition-opacity group-hover:opacity-80", !last && "opacity-90")} style={{ height: `${Math.max(2, (x.revenue / max) * 100)}%` }}>
                          <div className="bg-orange-400" style={{ flexGrow: x.truemoney }} />
                          <div className="bg-primary" style={{ flexGrow: x.promptpay }} />
                        </div>}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-1.5 text-center text-[10px] text-muted-foreground sm:gap-2.5">
              {d.days.map((x, i) => <span key={x.date} className={cn("flex-1 tabular-nums", i % 2 === 1 && i !== d.days.length - 1 && "max-sm:invisible", i === d.days.length - 1 && "font-semibold text-foreground")}>{i === d.days.length - 1 ? "วันนี้" : fmtDay(x.date, { day: "numeric" })}</span>)}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <SectionHead title="สรุป 30 วัน" />
          <div className="grid gap-4 p-4 sm:p-5">
            <div><p className="text-xs text-muted-foreground">ยอดเติมสำเร็จ</p><p className="text-2xl font-bold tabular-nums">฿{formatBaht(m.revenue)}</p></div>
            <div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">{methodTotal > 0 && <><div className="bg-primary" style={{ width: `${ppPct}%` }} /><div className="bg-orange-400" style={{ width: `${100 - ppPct}%` }} /></>}</div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>PromptPay ฿{formatBaht(m.promptpay)}{methodTotal > 0 && ` · ${ppPct}%`}</span><span>TrueMoney ฿{formatBaht(m.truemoney)}</span></div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["รายการเติม", formatInt(m.topups)],
                ["คนเติมเงิน", formatInt(m.payers)],
                ["เฉลี่ย/รายการ", `฿${formatBaht(avgTicket)}`],
                ["ผู้ใช้งาน", formatInt(m.active)],
                ["สมัครใหม่", formatInt(m.newUsers)],
                ["ป้ายที่สร้าง", formatInt(m.posters)],
              ].map(([k, v]) => <div key={k} className="rounded-xl bg-surface-2/60 px-3 py-2"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>)}
            </dl>
            <p className="text-[11px] text-muted-foreground">อัตราคนเติม/ผู้ใช้งาน {m.active ? Math.round((m.payers / m.active) * 100) : 0}% · ใช้เครดิตสร้างป้าย {formatCoinsFixed(m.spent)}</p>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="overflow-hidden">
          <SectionHead title="เติมเงินสูงสุด 30 วัน"><Trophy className="ml-auto size-4 text-amber-500" aria-hidden /></SectionHead>
          {d.topPayers.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">ยังไม่มีการเติมเงินในช่วงนี้</p> : (
            <ol className="divide-y divide-border">
              {d.topPayers.map((u, i) => (
                <li key={u.id}>
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/60 sm:px-5">
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold", i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-zinc-300 text-zinc-800" : i === 2 ? "bg-orange-300 text-orange-900" : "bg-surface-2 text-muted-foreground")}>{i + 1}</span>
                    <UserAvatar name={u.name} image={u.image} className="size-8" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{u.name}</span><span className="block truncate text-[11px] text-muted-foreground">{u.email}</span></span>
                    <span className="text-right"><span className="block text-sm font-semibold tabular-nums">฿{formatBaht(u.baht)}</span><span className="block text-[11px] text-muted-foreground">{formatInt(u.count)} ครั้ง</span></span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="overflow-hidden">
          <SectionHead title="สมาชิกใหม่ล่าสุด" href="/admin/users" />
          <ul className="divide-y divide-border">
            {d.recentUsers.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/60 sm:px-5">
                  <UserAvatar name={u.name} image={u.image} className="size-8" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{u.name}</span><span className="block truncate text-[11px] text-muted-foreground">{ago(u.createdAt)}</span></span>
                  <SignupSource providers={u.providers} compact />
                </Link>
              </li>
            ))}
            {d.recentUsers.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground"><UserPlus className="mx-auto mb-2 size-5" aria-hidden />ยังไม่มีสมาชิก</li>}
          </ul>
        </Card>

        <Card className="overflow-hidden lg:col-span-2 xl:col-span-1">
          <SectionHead title="สถานะระบบ"><span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums", statusOk === d.status.length ? "bg-success-soft text-success" : "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300")}>เปิด {statusOk}/{d.status.length}</span></SectionHead>
          <ul className="divide-y divide-border">
            {d.status.map((x) => (
              <li key={x.label}>
                <Link href={x.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-2/60 sm:px-5">
                  {x.ok ? <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="เปิดใช้" /> : <CircleDashed className="size-4 shrink-0 text-muted-foreground" aria-label="ปิดอยู่" />}
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{x.label}</span><span className="block truncate text-[11px] text-muted-foreground">{x.detail}</span></span>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {pending.rows.length > 0 && (
        <Card className="mt-5 overflow-hidden">
          <SectionHead title="คำสั่งเติมรอยืนยัน" href="/admin/topups"><span className="ml-1 mr-auto grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white tabular-nums">{pending.total}</span></SectionHead>
          <TxTable rows={pending.rows.slice(0, 5)} showActions />
        </Card>
      )}
      <Card className="mt-5 overflow-hidden">
        <SectionHead title="รายการล่าสุด" href="/admin/transactions" />
        <TxTable rows={recent.rows.slice(0, 8)} />
      </Card>
    </>
  );
}
