/* eslint-disable @next/next/no-img-element -- Private images must use the authenticated endpoint directly. */
import Link from "next/link";
import { Card, PageTitle, formatDateTime } from "@/components/admin/ui";
import { listArchivedSlips } from "@/lib/server/slip-archive";
import { requireAdminPage } from "@/lib/server/session";
import { collections } from "@/lib/server/collections";
import { formatBaht } from "@/lib/format";
import { notFound } from "next/navigation";

export const metadata = { title: "หลักฐานการชำระเงิน" };
const labels = { checking: "กำลังตรวจสอบ", verified: "สลิปผ่านการตรวจ", rejected: "ตรวจสลิปไม่ผ่าน" };
export default async function Receipts({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const { txs } = await collections();
  const tx = await txs.findOne({ _id: id, kind: "topup" });
  if (!tx?.topup) notFound();
  if (tx.topup.method === "truemoney") return <><PageTitle title="หลักฐานซองอั่งเปา TrueMoney" desc={`รายการ ${id}`} /><Card className="max-w-xl p-6"><p className="text-sm text-muted-foreground">ยอดรับซองที่บันทึกไว้</p><p className="mt-2 text-3xl font-bold tabular-nums">฿{formatBaht(tx.topup.payAmount / 100)}</p><dl className="mt-5 grid gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">สถานะเติมเครดิต</dt><dd>{tx.status === "completed" ? "สำเร็จ" : tx.status === "pending" ? "รอดำเนินการ" : "ไม่สำเร็จ / ต้องตรวจสอบ"}</dd></div><div><dt className="text-xs text-muted-foreground">เวลาบันทึก</dt><dd>{formatDateTime((tx.completedAt ?? tx.updatedAt).toISOString())}</dd></div><div><dt className="text-xs text-muted-foreground">รหัสซอง (ปิดบางส่วน)</dt><dd className="font-mono">…{tx.topup.voucherHash?.slice(-6) ?? "—"}</dd></div></dl><p className="mt-5 rounded-xl bg-surface-2 p-3 text-xs leading-6 text-muted-foreground">ช่องทางนี้ตรวจจากผลรับซองเข้าเบอร์ร้าน ไม่ใช้ภาพสลิป เติมเครดิตตามยอดที่รับได้จริง</p><Link href="/admin/topups?status=all" className="mt-5 inline-block text-sm text-primary underline">กลับคำสั่งเติมเงิน</Link></Card></>;
  const rows = await listArchivedSlips(id);
  return <><PageTitle title="หลักฐานการชำระเงิน" desc={`รายการ ${id}`}><Link href="/admin/topups" className="text-sm text-primary hover:underline">กลับคำสั่งเติมเงิน</Link></PageTitle><p className="mb-4 text-xs text-muted-foreground">แสดงการส่งตรวจล่าสุดไม่เกิน 100 ครั้ง สถานะนี้เป็นผลตรวจสลิป กรุณาดูสถานะเติมเครดิตที่คำสั่งเติมเงิน</p>{!rows.length ? <Card className="p-10 text-center text-sm text-muted-foreground">ยังไม่มีภาพสลิปที่บันทึกไว้สำหรับรายการนี้</Card> : <div className="grid gap-4 md:grid-cols-2">{rows.map(r => <Card key={r._id} className="overflow-hidden"><div className="border-b border-border p-4"><p className={`text-sm font-semibold ${r.status === "rejected" ? "text-danger" : r.status === "verified" ? "text-success" : ""}`}>{labels[r.status]}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.createdAt.toISOString())}</p>{r.transRef && <p className="mt-1 break-all font-mono text-xs">อ้างอิง {r.transRef}</p>}{r.error && <p className="mt-2 text-xs text-danger">{r.error}</p>}</div><a href={`/api/admin/slips/${r._id}`} target="_blank" rel="noopener noreferrer" className="block bg-surface-2 p-4"><span className="mb-3 block text-xs text-primary">เปิดภาพเต็ม ↗</span>{/* Private endpoint requires an admin cookie. */}<img src={`/api/admin/slips/${r._id}`} alt={`หลักฐานการโอน ${id}`} loading="lazy" className="mx-auto max-h-[640px] max-w-full rounded-lg object-contain" /></a></Card>)}</div>}</>;
}
