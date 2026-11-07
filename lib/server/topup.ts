import { MongoServerError } from "mongodb";
import { activePackages, quoteTopup, type TopupConfig } from "@/lib/topup";
import { getTopupConfig } from "./settings";
import { getTrueMoneyWalletReceiver, promptPayQr, redeemTrueMoneyVoucher, verifySlipImage } from "./payments";
import { parseGiftLink } from "@/lib/payments";
import { archiveSlip, slipArchive } from "./slip-archive";
import { fromUnits, toUnits } from "@/lib/money";
import { collections, newId, type TxDoc } from "./collections";
import { credit } from "./wallet";
import { UserError } from "./poster";

import type { TopupTicket } from "@/lib/account";

export async function isFirstTopup(userId: string) {
  const { txs } = await collections();
  return !(await txs.findOne({ userId, kind: "topup", status: "completed" }, { projection: { _id: 1 } }));
}

/** ปิดคำสั่งที่หมดเวลา — ปล่อยยอดเศษสตางค์ให้ใช้ซ้ำได้ */
export async function expireTopups(userId?: string) {
  const { txs } = await collections();
  await txs.updateMany(
    { kind: "topup", status: "pending", "topup.expiresAt": { $lt: new Date() }, ...(userId ? { userId } : {}) },
    { $set: { status: "failed", "topup.failReason": "expired", description: "รายการเติมเครดิตหมดอายุ", note: "รายการหมดอายุ ไม่มีเครดิตเพิ่มและไม่มีการตัดยอด", updatedAt: new Date() } },
  );
}

function resolveBaht(cfg: TopupConfig, input: { packageId?: string; baht?: number }) {
  if (input.packageId) {
    const pkg = activePackages(cfg).find((p) => p.id === input.packageId);
    if (!pkg) throw new UserError("ไม่พบแพ็กเกจนี้ กรุณารีเฟรชหน้าแล้วเลือกใหม่");
    return { baht: pkg.baht, bonus: pkg.bonus };
  }
  const { enabled, minBaht, maxBaht } = cfg.custom;
  if (!enabled) throw new UserError("ปิดการเติมแบบกำหนดยอดเองชั่วคราว กรุณาเลือกแพ็กเกจ");
  const baht = Number(input.baht);
  if (!Number.isInteger(baht) || baht < minBaht || baht > maxBaht) throw new UserError(`กรุณาระบุยอด ${minBaht}–${maxBaht} บาท`);
  return { baht, bonus: 0 };
}

/** สร้างคำสั่งเติม PromptPay — ยอดโอนมีเศษสตางค์ไม่ซ้ำกับคำสั่งอื่นที่ยังรอชำระ */
export async function createTopup(userId: string, input: { packageId?: string; baht?: number; method?: "promptpay" | "truemoney_wallet" }): Promise<TopupTicket> {
  const method = input.method ?? "promptpay";
  if (method !== "promptpay" && method !== "truemoney_wallet") throw new UserError("ช่องทางชำระเงินไม่ถูกต้อง");
  const receiver = method === "truemoney_wallet" ? await getTrueMoneyWalletReceiver() : undefined;
  const methodName = receiver ? "TrueMoney Wallet" : "PromptPay";
  const { txs } = await collections();
  const cfg = await getTopupConfig();
  const { baht, bonus } = resolveBaht(cfg, input);
  await expireTopups();
  // ยกเลิกคำสั่งเก่าที่ยังค้างของผู้ใช้คนนี้ — มีได้ทีละคำสั่ง
  await txs.updateMany(
    { userId, kind: "topup", status: "pending" },
    { $set: { status: "failed", "topup.failReason": "cancelled", description: "ยกเลิกคำสั่งเติมเครดิตแล้ว", note: "สร้างคำสั่งเติมใหม่แทน รายการนี้ไม่มีการตัดยอด", updatedAt: new Date() } },
  );
  const quote = quoteTopup(cfg, baht, bonus, await isFirstTopup(userId));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + cfg.qrTtlMin * 60_000);

  for (let attempt = 0; attempt < 20; attempt++) {
    const satang = 1 + Math.floor(Math.random() * 98);
    const payAmount = baht * 100 + satang;
    const tx: TxDoc = {
      _id: newId("TU"), userId, kind: "topup", status: "pending", amount: toUnits(quote.total),
      title: `เติมเครดิต ${baht.toLocaleString("th-TH")} บาท`, description: `${methodName} · รอตรวจสอบการชำระ`,
      note: `เครดิตหลัก ${quote.coins} + โบนัสแพ็กเกจ ${quote.bonus}${quote.promo ? ` + โบนัสเติมครั้งแรก ${cfg.firstTopup.bonusPct}% ${quote.promo}` : ""} เครดิต`,
      createdAt: now, updatedAt: now,
      topup: { method, baht, payAmount, coins: quote.coins, bonus: quote.bonus, promo: quote.promo, expiresAt, ...(receiver ? { walletReceiver: receiver } : {}) },
    };
    try {
      await txs.insertOne(tx);
      return { id: tx._id, method, baht, payAmount: payAmount / 100, coins: quote.total, expiresAt: expiresAt.toISOString(), ...(receiver ? { qrPayload: null, payeeName: receiver.name, walletMobile: receiver.mobile } : await promptPayQr(payAmount / 100)) };
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) continue; // ยอดชนคำสั่งอื่น สุ่มใหม่
      throw e;
    }
  }
  throw new UserError("ระบบไม่ว่างชั่วคราว กรุณาลองใหม่อีกครั้ง");
}

export async function getTopupStatus(userId: string, id: string) {
  await expireTopups(userId);
  const { txs } = await collections();
  const tx = await txs.findOne({ _id: id, userId, kind: "topup" }, { projection: { status: 1 } });
  return tx?.status ?? null;
}

/**
 * ยืนยันว่าได้รับเงินแล้ว → เพิ่มเครดิต (ครั้งเดียวต่อคำสั่ง)
 * เรียกจากผู้ดูแล หรือ webhook ของผู้ให้บริการชำระเงินในอนาคต
 */
export async function confirmTopup(id: string, confirmedBy: string) {
  const { txs } = await collections();
  // ล็อกคำสั่งด้วยการเปลี่ยนสถานะแบบ atomic — ยืนยันซ้ำจะไม่เจอเอกสาร
  const tx = await txs.findOneAndUpdate(
    { _id: id, kind: "topup", $or: [{ status: "pending" }, { status: "failed", "topup.failReason": "expired" }] },
    { $set: { status: "completed", "topup.confirmedBy": confirmedBy, completedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "before" },
  );
  if (!tx?.topup) throw new UserError("ไม่พบคำสั่งเติมที่รอยืนยัน");
  const t = tx.topup;
  // โปรเติมครั้งแรก: ถ้ามีคำสั่งอื่นสำเร็จไปก่อนแล้ว ไม่ให้โปรซ้ำ
  const earlier = await txs.findOne({ userId: tx.userId, kind: "topup", status: "completed", _id: { $ne: id } }, { projection: { _id: 1 } });
  const promo = earlier ? 0 : t.promo;
  const total = t.coins + t.bonus + promo;
  await credit(tx.userId, { transferable: toUnits(t.coins), bonus: toUnits(t.bonus + promo) });
  await txs.updateOne({ _id: id }, {
    $set: {
      amount: toUnits(total), "topup.promo": promo, description: `${t.method === "truemoney_wallet" ? "TrueMoney Wallet" : "PromptPay"} · รวมโบนัส ${t.bonus + promo} เครดิต`,
      note: `เครดิตหลัก ${t.coins} + โบนัสแพ็กเกจ ${t.bonus}${promo ? ` + โบนัสเติมครั้งแรก ${promo}` : ""} เครดิต`,
    },
    $unset: { "topup.failReason": "" },
  });
  return { userId: tx.userId, coins: total };
}

/** รับสลิปได้หลังคำสั่งหมดอายุไม่เกินเท่านี้ (ผู้ใช้อาจโอนทันแต่อัปโหลดช้า) */
const SLIP_GRACE_MS = 24 * 60 * 60_000;

/**
 * ผู้ใช้อัปโหลดสลิป PromptPay → ตรวจกับ Slip2Go (ยอดตรงทุกสตางค์ + บัญชีผู้รับ + ไม่ซ้ำ) → เติมเครดิตอัตโนมัติ
 */
export async function submitSlip(userId: string, topupId: string, file: File) {
  const { txs } = await collections();
  const tx = await txs.findOne({ _id: topupId, userId, kind: "topup" });
  if (!tx?.topup || !["promptpay", "truemoney_wallet"].includes(tx.topup.method)) throw new UserError("ไม่พบคำสั่งเติมนี้");
  if (tx.topup.method === "truemoney_wallet" && !/^0\d{9}$/.test(tx.topup.walletReceiver?.mobile ?? "")) throw new UserError("ข้อมูลเบอร์รับเงินไม่ครบ กรุณาติดต่อแอดมิน");
  if (tx.status === "completed") return { coins: fromUnits(tx.amount), already: true };
  const expiredOk = tx.status === "failed" && tx.topup.failReason === "expired" && Date.now() - tx.topup.expiresAt.getTime() < SLIP_GRACE_MS;
  if (tx.status !== "pending" && !expiredOk) throw new UserError("คำสั่งเติมนี้ถูกยกเลิกแล้ว กรุณาสร้างคำสั่งใหม่");

  const imageId = await archiveSlip(userId, topupId, file);
  const archive = await slipArchive();
  let slip;
  try {
    slip = await verifySlipImage(file, tx.topup.payAmount / 100, tx.topup.method === "truemoney_wallet" ? tx.topup.walletReceiver : undefined);
    if (slip.dateTime && new Date(slip.dateTime).getTime() < tx.createdAt.getTime() - 10 * 60_000) throw new UserError("สลิปนี้โอนก่อนสร้างคำสั่งเติม กรุณาใช้สลิปของรายการนี้");
    await archive.updateOne({ _id: imageId }, { $set: { status: "verified", transRef: slip.transRef } });
  } catch (error) {
    await archive.updateOne({ _id: imageId }, { $set: { status: "rejected", error: error instanceof UserError ? error.message : "ตรวจสลิปไม่สำเร็จ" } });
    throw error;
  }
  try {
    const r = await txs.updateOne({ _id: tx._id, "topup.slipRef": { $exists: false } }, { $set: { "topup.slipRef": slip.transRef, "topup.slip": { amount: slip.amount, dateTime: slip.dateTime, senderName: slip.senderName, receiverName: slip.receiverName } } });
    if (!r.modifiedCount) throw new UserError("คำสั่งนี้กำลังตรวจสลิปอยู่ กรุณารอสักครู่");
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      await archive.updateOne({ _id: imageId }, { $set: { status: "rejected", error: "สลิปนี้ถูกใช้เติมไปแล้ว" } });
      throw new UserError("สลิปนี้ถูกใช้เติมไปแล้ว");
    }
    throw e;
  }
  const { coins } = await confirmTopup(tx._id, `slip2go:${slip.transRef}`);
  return { coins, already: false };
}

/**
 * เติมด้วยซองของขวัญ TrueMoney: จองรหัสซองก่อน (กันกดซ้ำ) → รับซอง → คิดเครดิตจากยอดที่ได้จริง
 */
export async function topupWithTrueMoney(userId: string, link: string) {
  const hash = parseGiftLink(link);
  if (!hash) throw new UserError("ลิงก์ไม่ถูกต้อง ต้องขึ้นต้นด้วย https://gift.truemoney.com/campaign/?v=");
  const { txs } = await collections();
  const now = new Date();
  const id = newId("TM");
  try {
    await txs.insertOne({
      _id: id, userId, kind: "topup", status: "failed", amount: 0,
      title: "เติมเครดิตด้วย TrueMoney", description: "TrueMoney · กำลังรับซอง", note: "",
      createdAt: now, updatedAt: now,
      topup: { method: "truemoney", baht: 0, payAmount: 0, coins: 0, bonus: 0, promo: 0, expiresAt: now, failReason: "cancelled", voucherHash: hash },
    });
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) throw new UserError("ซองนี้ถูกใช้เติมไปแล้ว");
    throw e;
  }
  let baht: number;
  try {
    baht = await redeemTrueMoneyVoucher(hash);
  } catch (e) {
    // รับซองไม่สำเร็จ → ปล่อยรหัสซองให้ลองใหม่ได้
    await txs.deleteOne({ _id: id });
    throw e;
  }
  const cfg = await getTopupConfig();
  const pkg = activePackages(cfg).find((p) => p.baht === baht);
  const q = quoteTopup(cfg, baht, pkg?.bonus ?? 0, await isFirstTopup(userId));
  // ได้เงินแล้ว → เติมเครดิตทันที (ไม่ผ่านสถานะ pending เพราะยอดซองไม่จำเป็นต้องไม่ซ้ำ)
  await credit(userId, { transferable: toUnits(q.coins), bonus: toUnits(q.bonus + q.promo) });
  await txs.updateOne({ _id: id }, {
    $set: {
      status: "completed", completedAt: new Date(), amount: toUnits(q.total), title: `เติมเครดิต ${baht.toLocaleString("th-TH")} บาท`,
      description: `TrueMoney · รวมโบนัส ${q.bonus + q.promo} เครดิต`,
      note: `เครดิตหลัก ${q.coins} + โบนัสแพ็กเกจ ${q.bonus}${q.promo ? ` + โบนัสเติมครั้งแรก ${q.promo}` : ""} เครดิต`,
      "topup.baht": baht, "topup.payAmount": Math.round(baht * 100), "topup.coins": q.coins, "topup.bonus": q.bonus, "topup.promo": q.promo, "topup.confirmedBy": `truemoney:${hash}`, updatedAt: new Date(),
    },
    $unset: { "topup.failReason": "" },
  });
  return { coins: q.total, baht };
}
