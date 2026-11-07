import Link from "next/link";
import type { TxRow } from "@/lib/server/admin";
import { formatBaht } from "@/lib/format";
import { Coins, Empty, KIND_LABEL, StatusBadge, formatDateTime } from "./ui";
import { TopupActions } from "./topup-actions";
import { TopupEvidenceDialog } from "./topup-evidence-dialog";
import { UserAvatar } from "./user-badges";

const methodLabels = { promptpay: "PromptPay", truemoney_wallet: "Wallet โอนเบอร์", truemoney: "ซองอั่งเปา" };

/** ตารางรายการ — ถ้า showActions จะมีปุ่มยืนยัน/ปฏิเสธสำหรับคำสั่งเติมที่ยืนยันได้ */
export function TxTable({ rows, showActions = false, showUser = true }: { rows: TxRow[]; showActions?: boolean; showUser?: boolean }) {
  if (!rows.length) return <Empty>ไม่มีรายการ</Empty>;
  const now = Date.now();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-surface-2/50 text-[11px] text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">รายการ</th>
            <th scope="col" className="px-3 py-2.5 font-medium">ช่องทาง</th>
            {showUser && <th scope="col" className="px-3 py-2.5 font-medium">ผู้ใช้</th>}
            <th scope="col" className="px-3 py-2.5 font-medium">วันเวลา</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">ยอดโอน</th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">เครดิต</th>
            <th scope="col" className="px-3 py-2.5 font-medium">สถานะ</th>
            <th scope="col" className="px-4 py-2.5"><span className="sr-only">จัดการ</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((r) => {
            const expired = r.topup ? new Date(r.topup.expiresAt).getTime() < now : false;
            const actionable = showActions && r.kind === "topup" && (r.status === "pending" || (r.status === "failed" && r.topup?.failReason === "expired"));
            const automatic = r.topup?.confirmedBy?.startsWith("slip2go:") ? "ตรวจสลิปอัตโนมัติ" : r.topup?.confirmedBy?.startsWith("truemoney:") ? "รับซองอัตโนมัติ" : null;
            const by = !automatic && (r.topup?.confirmedBy || r.topup?.rejectedBy) ? `${r.topup?.confirmedBy ? "ยืนยันโดย" : "ปฏิเสธโดย"} ${r.topup?.confirmedBy ?? r.topup?.rejectedBy}` : null;
            const detail = r.kind === "adjust" ? `เหตุผล: ${r.note}` : r.description;
            return (
              <tr key={r.id} className="hover:bg-surface-2/30">
                <td className="max-w-64 px-4 py-2.5">
                  <p className="truncate font-medium" title={r.title}>{r.title}</p>
                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground"><span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">{r.id}</span><span aria-hidden>·</span><span className="truncate" title={`${KIND_LABEL[r.kind]} · ${detail}`}>{detail}</span></p>
                </td>
                <td className="px-3 py-2.5">
                  {r.topup ? (
                    <div className="flex gap-1">
                      <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] whitespace-nowrap text-muted-foreground">{methodLabels[r.topup.method]}</span>
                      {automatic && <span title={automatic} className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] whitespace-nowrap text-success">อัตโนมัติ</span>}
                      {by && <span title={by} className={r.topup.confirmedBy ? "rounded-full bg-primary-soft px-2 py-0.5 text-[10px] whitespace-nowrap text-primary" : "rounded-full bg-danger-soft px-2 py-0.5 text-[10px] whitespace-nowrap text-danger"}>{r.topup.confirmedBy ? "แอดมิน" : "ปฏิเสธ"}</span>}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">{KIND_LABEL[r.kind]}</span>}
                </td>
                {showUser && <td className="max-w-52 px-3 py-2.5"><Link href={`/admin/users/${r.userId}`} className="group flex min-w-0 items-center gap-2"><UserAvatar name={r.userName} image={r.userImage} className="size-7 text-[10px]" /><span className="min-w-0"><span className="block truncate text-xs font-medium group-hover:text-primary">{r.userName}</span><span className="block truncate text-[10px] text-muted-foreground">{r.userEmail}</span></span></Link></td>}
                <td className="px-3 py-2.5 text-xs whitespace-nowrap" title={r.topup?.completedAt ? `สำเร็จ ${formatDateTime(r.topup.completedAt)}` : undefined}>
                  {formatDateTime(r.date)}
                  {r.status === "pending" && r.topup && <p className="mt-0.5 text-[10px] text-muted-foreground">หมดอายุ {formatDateTime(r.topup.expiresAt)}</p>}
                </td>
                <td className="px-3 py-2.5 text-right whitespace-nowrap">{r.topup ? <span className="font-bold tabular-nums">฿{formatBaht(r.topup.payAmount)}</span> : <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2.5 text-right"><Coins value={r.coins} /></td>
                <td className="px-3 py-2.5"><StatusBadge status={r.status} reason={r.topup?.failReason} /></td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    {r.kind === "topup" && <TopupEvidenceDialog id={r.id} compact />}
                    {actionable && <TopupActions id={r.id} email={r.userEmail} payAmount={r.topup!.payAmount} coins={r.coins} expired={expired || r.status === "failed"} />}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
