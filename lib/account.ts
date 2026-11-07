import type { GameSlug } from "./games";
import type { EditorDoc } from "@/stores/editor-store";

/** ข้อมูลบัญชีที่ client ใช้แสดงผล (หน่วยเป็นเครดิตแล้ว) */
export type WalletSnapshot = { balance: number; transferable: number; bonus: number };
export type DailySnapshot = { claimed: number; claimedToday: boolean };
export type AccountSnapshot = {
  wallet: WalletSnapshot;
  firstTopup: boolean;
  daily: DailySnapshot;
  /** signature ของป้ายที่จ่ายแล้ว — ดาวน์โหลดซ้ำฟรี */
  paidSignatures: string[];
};

export type PosterOrder = { id: string; date: string; amount: number; game: GameSlug; doc: EditorDoc; cols: number };

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** signature ของป้าย: ป้ายเดียวกัน (สกิน/แบบ/ตกแต่ง/ไฟล์/คอลัมน์) จ่ายครั้งเดียว */
export const posterSignature = (game: GameSlug, doc: EditorDoc, cols: number) =>
  JSON.stringify([game, doc.skins, doc.template, doc.decoration ?? null, doc.output ?? "clean", cols]);

export type TopupTicket = { id: string; method?: "promptpay" | "truemoney_wallet"; walletMobile?: string; baht: number; payAmount: number; coins: number; expiresAt: string; /** payload QR PromptPay จริง (null = Wallet หรือยังไม่ตั้งพร้อมเพย์ร้าน) */ qrPayload: string | null; payeeName: string | null };
