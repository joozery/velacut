import { listTransactions } from "@/lib/server/admin";
import { Card, FilterBar, KIND_LABEL, PageTitle, Pager, STATUS_LABEL, fieldClass, qs } from "@/components/admin/ui";
import { TxTable } from "@/components/admin/tx-table";
import { FilterSelect } from "@/components/admin/filter-select";

export const metadata = { title: "รายการทั้งหมด" };

export default async function AdminTransactions({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const data = await listTransactions({ kind: sp.kind, status: sp.status, q: sp.q, page: sp.page });
  return (
    <>
      <PageTitle title="รายการทั้งหมด" desc="ทุกการเคลื่อนไหวของเครดิตในระบบ" />
      <Card className="overflow-hidden">
        <FilterBar action="/admin/transactions">
          <input name="q" defaultValue={sp.q} placeholder="อีเมล ชื่อ เลขอ้างอิง หรือยอดโอน" className={`${fieldClass} min-w-0 flex-1`} />
          <FilterSelect name="kind" defaultValue={sp.kind ?? "all"} label="ประเภท" options={[["all", "ทุกประเภท"], ...Object.entries(KIND_LABEL)]} />
          <FilterSelect name="status" defaultValue={sp.status ?? "all"} label="สถานะ" options={[["all", "ทุกสถานะ"], ...Object.entries(STATUS_LABEL)]} />
        </FilterBar>
        <TxTable rows={data.rows} showActions />
        <Pager page={data.page} pages={data.pages} total={data.total} href={(p) => qs("/admin/transactions", { kind: sp.kind, status: sp.status, q: sp.q, page: p })} />
      </Card>
    </>
  );
}
