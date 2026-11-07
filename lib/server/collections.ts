import type { Collection } from "mongodb";
import { getDb } from "@/lib/db/mongo";
import type { HistoryKind, HistoryStatus } from "@/lib/history";

/** ยอดเก็บเป็นหน่วยย่อย (ดู lib/money.ts) */
export type WalletDoc = { _id: string; transferable: number; bonus: number; updatedAt: Date };

export type TxDoc = {
  _id: string;
  userId: string;
  kind: HistoryKind;
  status: HistoryStatus;
  /** หน่วยย่อย มีเครื่องหมาย: + เข้า / − ออก */
  amount: number;
  title: string;
  description: string;
  note: string;
  createdAt: Date;
  updatedAt: Date;
  /** poster */
  completedAt?: Date;
  signature?: string;
  poster?: { game: string; doc: unknown; cols: number; bonusUsed: number };
  /** reward — วันที่ตามเวลาไทย YYYY-MM-DD */
  rewardDate?: string;
  rewardDay?: number;
  /** topup */
  topup?: {
    method: "promptpay" | "truemoney" | "truemoney_wallet";
    walletReceiver?: { mobile: string; name: string };
    baht: number;
    /** ยอดโอนจริงมีเศษสตางค์ไม่ซ้ำ (หน่วยสตางค์) */
    payAmount: number;
    coins: number;
    bonus: number;
    promo: number;
    expiresAt: Date;
    failReason?: "expired" | "cancelled" | "rejected";
    rejectedBy?: string;
    confirmedBy?: string;
    /** เลขอ้างอิงสลิป (transRef) ที่ตรวจผ่าน Slip2Go — ห้ามซ้ำ */
    slipRef?: string;
    slip?: { amount: number; dateTime: string; senderName: string | null; receiverName: string | null };
    /** รหัสซองของขวัญ TrueMoney — ห้ามซ้ำ */
    voucherHash?: string;
  };
  /** adjust — ผู้ดูแลปรับยอด */
  adjust?: { bucket: "transferable" | "bonus"; by: string };
  /** transfer */
  transfer?: { counterpartyId: string; counterpartyEmail: string; direction: "out" | "in"; pairId: string };
};

let ready: Promise<void> | undefined;

async function ensureIndexes(wallets: Collection<WalletDoc>, txs: Collection<TxDoc>) {
  void wallets;
  await Promise.all([
    txs.createIndex({ userId: 1, createdAt: -1 }),
    // ป้ายเดียวกันจ่ายครั้งเดียว
    txs.createIndex({ userId: 1, signature: 1 }, { unique: true, partialFilterExpression: { kind: "poster" } }),
    // เช็กอินวันละครั้ง
    txs.createIndex({ userId: 1, rewardDate: 1 }, { unique: true, partialFilterExpression: { kind: "reward" } }),
    // ยอดโอนที่ยังรอชำระต้องไม่ชนกัน ใช้จับคู่รายการเงินเข้า
    txs.createIndex({ "topup.payAmount": 1 }, { unique: true, partialFilterExpression: { kind: "topup", status: "pending" } }),
    // สลิป / ซองของขวัญใช้เติมได้ครั้งเดียว
    txs.createIndex({ "topup.slipRef": 1 }, { unique: true, partialFilterExpression: { "topup.slipRef": { $type: "string" } } }),
    txs.createIndex({ "topup.voucherHash": 1 }, { unique: true, partialFilterExpression: { "topup.voucherHash": { $type: "string" } } }),
  ]);
}

export async function collections() {
  const db = await getDb();
  const wallets = db.collection<WalletDoc>("wallets");
  const txs = db.collection<TxDoc>("transactions");
  ready ??= ensureIndexes(wallets, txs).catch((e) => {
    ready = undefined;
    throw e;
  });
  await ready;
  return { wallets, txs };
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
