import { findUserByEmail, normalizeEmail } from "@/lib/auth/user-store";
import { formatCoinsFixed } from "@/lib/format";
import { fromUnits, toUnits } from "@/lib/money";
import { collections, newId } from "./collections";
import { credit, debitTransferable } from "./wallet";
import { UserError } from "./poster";

const mask = (email: string) => email.replace(/^(.).*?(@.*)$/, "$1•••$2");

/** โอนเฉพาะเครดิตที่โอนได้ (ไม่รวมโบนัส) */
export async function transferCoins(fromUserId: string, fromEmail: string, toEmail: string, coins: number) {
  const amount = toUnits(coins);
  if (!Number.isFinite(coins) || amount < toUnits(1) || fromUnits(amount) !== Math.round(coins * 100) / 100) throw new UserError("โอนขั้นต่ำ 1 เครดิต ทศนิยมไม่เกิน 2 ตำแหน่ง");
  if (normalizeEmail(toEmail) === normalizeEmail(fromEmail)) throw new UserError("โอนให้ตัวเองไม่ได้");
  const recipient = await findUserByEmail(toEmail);
  if (!recipient) throw new UserError("ไม่พบบัญชีผู้รับ กรุณาตรวจอีเมลอีกครั้ง");

  const { txs } = await collections();
  if (!(await debitTransferable(fromUserId, amount))) throw new UserError("เครดิตที่โอนได้ไม่เพียงพอ");
  try {
    await credit(recipient.id, { transferable: amount });
  } catch (e) {
    await credit(fromUserId, { transferable: amount }); // คืนยอดผู้โอน
    throw e;
  }
  const now = new Date();
  const pairId = newId("TR");
  const n = formatCoinsFixed(coins);
  await txs.insertMany([
    { _id: `${pairId}-OUT`, userId: fromUserId, kind: "transfer", status: "completed", amount: -amount, title: "โอนเครดิตให้เพื่อน", description: `ผู้รับ ${mask(recipient.email)}`, note: `โอน ${n} เครดิต จากเครดิตที่โอนได้`, createdAt: now, updatedAt: now, transfer: { counterpartyId: recipient.id, counterpartyEmail: recipient.email, direction: "out", pairId } },
    { _id: `${pairId}-IN`, userId: recipient.id, kind: "transfer", status: "completed", amount, title: "ได้รับเครดิตจากเพื่อน", description: `ผู้โอน ${mask(normalizeEmail(fromEmail))}`, note: `ได้รับ ${n} เครดิต เข้าเครดิตที่โอนได้`, createdAt: now, updatedAt: now, transfer: { counterpartyId: fromUserId, counterpartyEmail: normalizeEmail(fromEmail), direction: "in", pairId } },
  ]);
  return { id: `${pairId}-OUT` };
}
