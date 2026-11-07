import { listTransactions } from "@/lib/server/admin";
import { Card, FilterBar, PageTitle, Pager, fieldClass, qs } from "@/components/admin/ui";
import { TxTable } from "@/components/admin/tx-table";
import { FilterSelect } from "@/components/admin/filter-select";

export const metadata = { title: "คำสั่งเติมเงิน" };

export default async function AdminTopups({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const sp = await searchParams;
  const status = sp.status ?? "pending";
  const data = await listTransactions({ kind: "topup", status, q: sp.q, page: sp.page });
  return (
    <>
      <PageTitle title="คำสั่งเติมเงิน" desc="ตรวจยอดรับและหลักฐานการชำระ PromptPay, TrueMoney Wallet และซองอั่งเปา" />
      <Card className="overflow-hidden">
        <FilterBar action="/admin/topups">
          <input name="q" defaultValue={sp.q} placeholder="ค้นด้วยยอดโอน เช่น 200.37, อีเมล หรือเลขอ้างอิง" className={`${fieldClass} min-w-0 flex-1`} />
          <FilterSelect name="status" defaultValue={status} label="สถานะ" className="sm:w-44" options={[["pending", "รอยืนยัน"], ["completed", "สำเร็จ"], ["failed", "ไม่สำเร็จ / หมดอายุ"], ["all", "ทั้งหมด"]]} />
        </FilterBar>
        <TxTable rows={data.rows} showActions />
        <Pager page={data.page} pages={data.pages} total={data.total} href={(p) => qs("/admin/topups", { status, q: sp.q, page: p })} />
      </Card>
    </>
  );
}
