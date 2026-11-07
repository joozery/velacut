import type { AccountSnapshot, PosterOrder } from "@/lib/account";
import type { HistoryRecord } from "@/lib/history";
import { fromUnits } from "@/lib/money";
import { collections } from "./collections";
import { getDaily } from "./daily";
import { toPosterOrder } from "./poster";
import { expireTopups, isFirstTopup } from "./topup";
import { getWalletUnits, toSnapshot } from "./wallet";
import { recordAccountActivity } from "./finance";

export async function getAccount(userId: string): Promise<AccountSnapshot> {
  const { txs } = await collections();
  const [wallet, firstTopup, daily, paid] = await Promise.all([
    getWalletUnits(userId),
    isFirstTopup(userId),
    getDaily(userId),
    txs.find({ userId, kind: "poster", status: "completed" }, { projection: { signature: 1 } }).sort({ createdAt: -1 }).limit(500).toArray(),
    recordAccountActivity(userId),
  ]);
  return { wallet: toSnapshot(wallet), firstTopup, daily, paidSignatures: paid.map((t) => t.signature!).filter(Boolean) };
}

export type HistoryEntry = HistoryRecord & { order?: PosterOrder };

export async function listHistory(userId: string, limit = 200): Promise<HistoryEntry[]> {
  await expireTopups(userId);
  const { txs } = await collections();
  const docs = await txs.find({ userId, status: { $in: ["completed", "pending", "failed"] }, $nor: [{ kind: { $in: ["poster", "reward"] }, status: "pending" }] }).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((t) => ({
    id: t._id,
    kind: t.kind,
    status: t.status,
    title: t.title,
    description: t.description,
    date: t.createdAt.toISOString(),
    coins: fromUnits(t.amount),
    ...(t.topup ? { baht: t.topup.payAmount / 100 } : {}),
    note: t.note,
    ...(t.kind === "poster" && t.poster ? { order: toPosterOrder(t) } : {}),
  }));
}

export const POSTERS_PAGE_SIZE = 12;

/** ป้ายที่ผู้ใช้สร้างแล้ว (ล่าสุดก่อน) — ดาวน์โหลดซ้ำได้ฟรี */
export async function listPosters(userId: string, rawPage: unknown) {
  const { txs } = await collections();
  const filter = { userId, kind: "poster" as const, status: "completed" as const };
  const total = await txs.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / POSTERS_PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(rawPage)) || 1));
  const docs = await txs.find(filter).sort({ createdAt: -1 }).skip((page - 1) * POSTERS_PAGE_SIZE).limit(POSTERS_PAGE_SIZE).toArray();
  return { posters: docs.filter((t) => t.poster).map(toPosterOrder), total, page, pages };
}
