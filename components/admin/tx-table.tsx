import Link from "next/link";
import type { TxRow } from "@/lib/server/admin";
import { formatBaht } from "@/lib/format";
import { Coins, Empty, KIND_LABEL, StatusBadge, formatDateTime } from "./ui";
import { TopupActions } from "./topup-actions";

/** ตารางรายการ — ถ้า showActions จะมีปุ่มยืนยัน/ปฏิเสธสำหรับคำสั่งเติมที่ยืนยันได้ */
export function TxTable({ rows, showActions = false, showUser = true }: { rows: TxRow[]; showActions?: boolean; showUser?: boolean }) {
  if (!rows.length) return <Empty>ไม่มีรายการ</Empty>;
  const now = Date.now();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-surface-2/50 text-[11px] text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">รายการ</th>
            {showUser && <th scope="col" className="px-3 py-2.5 font-medium">ผู้ใช้</th>}
            <th scope="col" className="px-3 py-2.5 font-medium">วันเวลา</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">ยอดโอน</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">เครดิต</th>
            <th scope="col" className="px-3 py-2.5 font-medium">สถานะ</th>
            {showActions && <th scope="col" className="px-4 py-2.5"><span className="sr-only">จัดการ</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((r) => {
            const expired = r.topup ? new Date(r.topup.expiresAt).getTime() < now : false;
            const actionable = r.kind === "topup" && (r.status === "pending" || (r.status === "failed" && r.topup?.failReason === "expired"));
            return (
              <tr key={r.id} className="align-top hover:bg-surface-2/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{KIND_LABEL[r.kind]} · {r.description}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/70">{r.id}</p>
                  {r.kind === "adjust" && <p className="mt-1 text-xs text-muted-foreground">เหตุผล: {r.note}</p>}
                  {r.kind === "topup" && <Link href={`/admin/topups/${r.id}/receipts`} className="mt-2 inline-block text-xs text-primary hover:underline">ดูหลักฐาน / ผลตรวจสลิป</Link>}
                  {(r.topup?.confirmedBy || r.topup?.rejectedBy) && <p className="mt-1 text-[11px] text-muted-foreground">{r.topup.confirmedBy ? "ยืนยันโดย" : "ปฏิเสธโดย"} {r.topup.confirmedBy ?? r.topup.rejectedBy}</p>}
                </td>
                {showUser && <td className="max-w-48 px-3 py-3"><Link href={`/admin/users/${r.userId}`} className="block truncate text-xs text-primary hover:underline">{r.userEmail}</Link></td>}
                <td className="px-3 py-3 text-xs whitespace-nowrap">{formatDateTime(r.date)}{r.status === "pending" && r.topup && <p className="mt-0.5 text-[11px] text-muted-foreground">หมดอายุ {formatDateTime(r.topup.expiresAt)}</p>}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap">{r.topup ? <span className="font-bold tabular-nums">฿{formatBaht(r.topup.payAmount)}</span> : <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-3 text-right"><Coins value={r.coins} /></td>
                <td className="px-3 py-3"><StatusBadge status={r.status} reason={r.topup?.failReason} /></td>
                {showActions && <td className="px-4 py-3">{actionable && <TopupActions id={r.id} email={r.userEmail} payAmount={r.topup!.payAmount} coins={r.coins} expired={expired || r.status === "failed"} />}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
