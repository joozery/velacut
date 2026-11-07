import Link from "next/link";
import { listLibrary } from "@/lib/server/catalog";
import { requireAdminPage } from "@/lib/server/session";
import { storageConfigured } from "@/lib/server/storage";
import { Card, FilterBar, PageTitle, Pager, fieldClass, qs } from "@/components/admin/ui";
import { FilterSelect } from "@/components/admin/filter-select";
import { LibraryManager } from "@/components/admin/library-manager";

export const metadata = { title: "คลังฮีโร่และสกิน" };
type Params = { kind?: string; q?: string; hero?: string; status?: string; page?: string };
export default async function AdminLibrary({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const data = await listLibrary(sp);
  return <>
    <PageTitle title="คลังฮีโร่และสกิน" desc="จัดการชื่อ รูป และรายการที่แสดงในคลังของผู้ใช้"><Link href="/generate/mlbb" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm hover:bg-surface-2">เปิดหน้าสร้างป้าย ↗</Link></PageTitle>
    <div className="mb-5 grid grid-cols-3 gap-3">{[["ฮีโร่", data.stats.heroes], ["สกิน", data.stats.skins], ["รูปสกินที่อัปโหลด", data.stats.uploaded]].map(([label,n]) => <Card key={label} className="p-4"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{Number(n).toLocaleString("th-TH")}</p></Card>)}</div>
    <div className="mb-4 flex gap-2">{[["skin", "สกิน"], ["hero", "ฮีโร่"]].map(([kind,label]) => <Link key={kind} href={qs("/admin/library", { kind })} aria-current={data.kind === kind ? "page" : undefined} className={`rounded-xl px-4 py-2 text-sm font-medium ${data.kind === kind ? "bg-primary-soft text-primary" : "bg-surface text-muted-foreground hover:bg-surface-2"}`}>{label}</Link>)}</div>
    <Card className="mb-4 overflow-hidden"><FilterBar action="/admin/library"><input type="hidden" name="kind" value={data.kind} /><input name="q" aria-label="ค้นหาฮีโร่หรือสกิน" defaultValue={sp.q} placeholder="ค้นหาชื่อฮีโร่หรือสกิน" className={`${fieldClass} min-w-0 flex-1`} />{data.kind === "skin" && <FilterSelect key={`hero-${sp.hero}`} name="hero" defaultValue={sp.hero || "all"} label="ฮีโร่" options={[["all", "ทุกฮีโร่"], ...data.heroes.map(h => [h.id,h.name] as [string,string])]} />}<FilterSelect key={`status-${sp.status}`} name="status" defaultValue={sp.status || "all"} label="สถานะ" options={[["all", "ทุกสถานะ"], ["active", "แสดงในคลัง"], ["hidden", "ซ่อนอยู่"], ["uploaded", "อัปโหลดรูปแล้ว"]]} /></FilterBar></Card>
    <LibraryManager key={`${data.kind}-${data.page}-${sp.q}-${sp.hero}-${sp.status}`} kind={data.kind} rows={data.rows} heroes={data.heroes} uploadReady={storageConfigured()} initialHero={sp.hero} />
    <Card className="mt-4"><Pager page={data.page} pages={data.pages} total={data.total} href={page => qs("/admin/library", { ...sp, kind: data.kind, page })} /></Card>
    <p className="mt-4 text-[11px] leading-6 text-muted-foreground">รายการเดิมใช้รูปที่มีอยู่ในเว็บจนกว่าจะอัปโหลดแทน ซ่อนรายการเพื่อหยุดแสดงในตัวเลือกได้ โดยป้ายเก่ายังใช้รูปได้ ส่วนตราแรงค์ใช้ชุดเดิม</p>
  </>;
}
