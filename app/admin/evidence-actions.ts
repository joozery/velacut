"use server";

import type { ActionResult } from "@/lib/account";
import type { HistoryStatus } from "@/lib/history";
import { requireAdmin } from "@/lib/server/session";
import { UserError } from "@/lib/server/poster";
import { collections } from "@/lib/server/collections";
import { listArchivedSlips } from "@/lib/server/slip-archive";

export type TopupEvidence = {
  id: string; method: "promptpay" | "truemoney" | "truemoney_wallet";
  status: HistoryStatus; failReason?: string; payAmount: number; recordedAt: string; voucherSuffix?: string;
  slips: { id: string; status: "checking" | "verified" | "rejected"; date: string; error?: string; transRef?: string }[];
};

export async function getTopupEvidenceAction(id: string): Promise<ActionResult<TopupEvidence>> {
  try {
    await requireAdmin();
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,160}$/.test(id)) throw new UserError("รหัสรายการไม่ถูกต้อง");
    const { txs } = await collections();
    const tx = await txs.findOne({ _id: id, kind: "topup" });
    if (!tx?.topup) throw new UserError("ไม่พบรายการเติมเงินนี้");
    const rows = tx.topup.method === "truemoney" ? [] : await listArchivedSlips(id);
    return { ok: true, data: {
      id, method: tx.topup.method, status: tx.status, failReason: tx.topup.failReason,
      payAmount: tx.topup.payAmount / 100, recordedAt: (tx.completedAt ?? tx.updatedAt).toISOString(),
      ...(tx.topup.method === "truemoney" && tx.topup.voucherHash ? { voucherSuffix: tx.topup.voucherHash.slice(-6) } : {}),
      slips: rows.map(row => ({ id: row._id, status: row.status, date: row.createdAt.toISOString(), error: row.error, transRef: row.transRef })),
    } };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error("getTopupEvidence failed", error);
    return { ok: false, error: "โหลดหลักฐานไม่สำเร็จ กรุณาลองใหม่" };
  }
}
