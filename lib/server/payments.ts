import { getDb } from "@/lib/db/mongo";
import type { PaymentMethodsPublic, PaymentSettingsView, SlipReceiver } from "@/lib/payments";
import { UserError } from "./poster";
import { decryptSecret, encryptSecret } from "./secrets";
import { isPromptPayId, normalizePromptPayId, promptPayPayload } from "@/lib/promptpay";

type Stored = {
  promptpay: { id: string; name: string };
  slip2go: { enabled: boolean; apiUrl: string; secretEnc: string | null; secretHint: string | null; receivers: SlipReceiver[] };
  truemoney: { enabled: boolean; mobile: string };
  truemoneyWallet: { enabled: boolean; mobile: string; name: string };
};
type Doc = { _id: "payments"; value: Stored; updatedAt: Date; updatedBy: string };

const DEFAULTS: Stored = {
  promptpay: { id: "", name: "" },
  slip2go: { enabled: false, apiUrl: "", secretEnc: null, secretHint: null, receivers: [] },
  truemoney: { enabled: false, mobile: "" },
  truemoneyWallet: { enabled: false, mobile: "", name: "" },
};

const col = async () => (await getDb()).collection<Doc>("settings");

async function load(): Promise<Stored> {
  const doc = await (await col()).findOne({ _id: "payments" });
  return { promptpay: { ...DEFAULTS.promptpay, ...doc?.value.promptpay }, slip2go: { ...DEFAULTS.slip2go, ...doc?.value.slip2go }, truemoney: { ...DEFAULTS.truemoney, ...doc?.value.truemoney }, truemoneyWallet: { ...DEFAULTS.truemoneyWallet, ...doc?.value.truemoneyWallet } };
}

const slipReady = (s: Stored) => s.slip2go.enabled && !!s.slip2go.apiUrl && !!s.slip2go.secretEnc;
const tmReady = (s: Stored) => s.truemoney.enabled && /^0\d{9}$/.test(s.truemoney.mobile);

export async function getPaymentMethods(): Promise<PaymentMethodsPublic> {
  const s = await load();
  return { slipEnabled: slipReady(s), truemoneyEnabled: tmReady(s), truemoneyWalletEnabled: s.truemoneyWallet.enabled && slipReady(s) && /^0\d{9}$/.test(s.truemoneyWallet.mobile), promptpayReady: isPromptPayId(s.promptpay.id) };
}

export async function getTrueMoneyWalletReceiver() {
  const s = await load();
  if (!s.truemoneyWallet.enabled || !slipReady(s) || !/^0\d{9}$/.test(s.truemoneyWallet.mobile)) throw new UserError("ยังไม่เปิดใช้ TrueMoney Wallet แบบโอนพร้อมแนบสลิป");
  return { mobile: s.truemoneyWallet.mobile, name: s.truemoneyWallet.name };
}

/** QR PromptPay จริงของคำสั่งเติม — null ถ้ายังไม่ตั้งพร้อมเพย์ร้าน */
export async function promptPayQr(amountBaht: number) {
  const s = await load();
  if (!isPromptPayId(s.promptpay.id)) return { qrPayload: null, payeeName: null };
  return { qrPayload: promptPayPayload(s.promptpay.id, amountBaht), payeeName: s.promptpay.name || null };
}

export async function getPaymentSettingsView(): Promise<PaymentSettingsView & { meta: { updatedAt: string; updatedBy: string } | null }> {
  const s = await load();
  const doc = await (await col()).findOne({ _id: "payments" }, { projection: { updatedAt: 1, updatedBy: 1 } });
  return {
    promptpay: s.promptpay,
    slip2go: { enabled: s.slip2go.enabled, apiUrl: s.slip2go.apiUrl, hasSecret: !!s.slip2go.secretEnc, secretHint: s.slip2go.secretHint, receivers: s.slip2go.receivers },
    truemoney: s.truemoney,
    truemoneyWallet: s.truemoneyWallet,
    meta: doc ? { updatedAt: doc.updatedAt.toISOString(), updatedBy: doc.updatedBy } : null,
  };
}

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

function parseApiUrl(v: unknown) {
  const s = str(v, 200).replace(/\/+$/, "");
  if (!s) return "";
  let u: URL;
  try { u = new URL(s); } catch { throw new UserError("API URL ของ Slip2Go ไม่ถูกต้อง"); }
  if (u.protocol !== "https:") throw new UserError("API URL ต้องขึ้นต้นด้วย https://");
  return s;
}

/** บันทึกการตั้งค่า — secret: undefined = ใช้ค่าเดิม, "" = ลบ, ข้อความ = ตั้งใหม่ */
export async function savePaymentSettings(raw: unknown, by: string) {
  const r = (raw ?? {}) as { promptpay?: Record<string, unknown>; slip2go?: Record<string, unknown>; truemoney?: Record<string, unknown>; truemoneyWallet?: Record<string, unknown>; slipSecret?: unknown };
  const prev = await load();
  const s = r.slip2go ?? {};
  const receivers: SlipReceiver[] = (Array.isArray(s.receivers) ? s.receivers : []).slice(0, 5).map((x, i) => {
    const o = (x ?? {}) as Record<string, unknown>;
    const rec = { accountType: str(o.accountType, 10), accountNumber: str(o.accountNumber, 30).replace(/[\s-]/g, ""), accountNameTH: str(o.accountNameTH, 80), accountNameEN: str(o.accountNameEN, 80) };
    if (!/^\d{5}$/.test(rec.accountType)) throw new UserError(`บัญชีรับเงินที่ ${i + 1}: รหัสประเภทบัญชีต้องเป็นตัวเลข 5 หลัก`);
    if (!rec.accountNumber && !rec.accountNameTH && !rec.accountNameEN) throw new UserError(`บัญชีรับเงินที่ ${i + 1}: กรอกเลขบัญชีหรือชื่อบัญชีอย่างน้อย 1 อย่าง`);
    return rec;
  });
  let secretEnc = prev.slip2go.secretEnc;
  let secretHint = prev.slip2go.secretHint;
  if (typeof r.slipSecret === "string") {
    const secret = r.slipSecret.trim();
    if (secret && (secret.length < 8 || secret.length > 500)) throw new UserError("Secret Key ไม่ถูกต้อง");
    secretEnc = secret ? encryptSecret(secret) : null;
    secretHint = secret ? `••••${secret.slice(-4)}` : null;
  }
  const t = r.truemoney ?? {};
  const mobile = str(t.mobile, 20).replace(/\D/g, "");
  if (mobile && !/^0\d{9}$/.test(mobile)) throw new UserError("เบอร์ TrueMoney ต้องเป็นเบอร์มือถือ 10 หลัก ขึ้นต้นด้วย 0");
  const wallet = r.truemoneyWallet ?? prev.truemoneyWallet;
  const walletMobile = str(wallet.mobile, 20).replace(/\D/g, "");
  if (walletMobile && !/^0\d{9}$/.test(walletMobile)) throw new UserError("เบอร์ TrueMoney Wallet ต้องเป็นเบอร์มือถือ 10 หลัก ขึ้นต้นด้วย 0");
  const ppId = normalizePromptPayId(str(r.promptpay?.id, 20));
  if (ppId && !isPromptPayId(ppId)) throw new UserError("พร้อมเพย์ต้องเป็นเบอร์มือถือ 10 หลัก หรือเลขบัตร/เลขผู้เสียภาษี 13 หลัก");
  const value: Stored = {
    promptpay: { id: ppId, name: str(r.promptpay?.name, 80) },
    slip2go: { enabled: s.enabled === true, apiUrl: parseApiUrl(s.apiUrl), secretEnc, secretHint, receivers },
    truemoney: { enabled: t.enabled === true, mobile },
    truemoneyWallet: { enabled: wallet.enabled === true, mobile: walletMobile, name: str(wallet.name, 80) },
  };
  if (value.slip2go.enabled && !slipReady(value)) throw new UserError("เปิดใช้ Slip2Go ต้องกรอก API URL และ Secret Key");
  if (value.truemoney.enabled && !tmReady(value)) throw new UserError("เปิดใช้ TrueMoney ต้องกรอกเบอร์รับเงิน");
  if (value.truemoneyWallet.enabled && (!walletMobile || !value.truemoneyWallet.name)) throw new UserError("เปิดใช้ Wallet แบบแนบสลิป ต้องกรอกเบอร์และชื่อบัญชีผู้รับ");
  if (value.truemoneyWallet.enabled && !slipReady(value)) throw new UserError("เปิดใช้ Wallet แบบแนบสลิป ต้องตั้งค่าและเปิด Slip2Go ก่อน");
  await (await col()).updateOne({ _id: "payments" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
}

/* ───────────── Slip2Go ───────────── */

const SLIP_ERRORS: Record<string, string> = {
  "200401": "บัญชีผู้รับในสลิปไม่ตรงกับบัญชีของร้าน",
  "200402": "ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องโอน (ต้องตรงทุกหลักรวมเศษสตางค์)",
  "200403": "วันที่ในสลิปไม่ตรงเงื่อนไข",
  "200404": "ไม่พบสลิปนี้ในระบบธนาคาร กรุณารอ 1–2 นาทีแล้วลองใหม่",
  "200500": "สลิปไม่ถูกต้องหรือถูกแก้ไข",
  "200501": "สลิปนี้ถูกใช้ไปแล้ว",
  "200502": "ระบบธนาคารขัดข้อง กรุณาลองใหม่อีกครั้ง",
  "400002": "ไฟล์สลิปไม่ถูกต้อง กรุณาอัปโหลดรูปสลิปที่เห็น QR ชัดเจน",
  "400001": "อ่าน QR บนสลิปไม่ได้ กรุณาอัปโหลดรูปสลิปที่เห็น QR ชัดเจน",
};

async function slipConfig() {
  const s = await load();
  if (!slipReady(s)) throw new UserError("ระบบตรวจสลิปยังไม่เปิดใช้ กรุณารอแอดมินยืนยันยอด");
  return { apiUrl: s.slip2go.apiUrl, secret: decryptSecret(s.slip2go.secretEnc!), receivers: s.slip2go.receivers };
}

export type VerifiedSlip = { transRef: string; amount: number; dateTime: string; senderName: string | null; receiverName: string | null };

/** ตรวจสลิปด้วย Slip2Go (รูปสลิป) — เช็กยอดเงิน บัญชีผู้รับ และสลิปซ้ำ */
export async function verifySlipImage(file: File, expectedBaht: number, walletReceiver?: { mobile: string }): Promise<VerifiedSlip> {
  const cfg = await slipConfig();
  const condition: Record<string, unknown> = { checkDuplicate: true, checkAmount: { amount: expectedBaht.toFixed(2), type: "eq" } };
  if (walletReceiver) condition.checkReceiver = [{ accountType: "04000", accountNumber: walletReceiver.mobile }];
  else if (cfg.receivers.length) condition.checkReceiver = cfg.receivers.map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => v)));
  const body = new FormData();
  body.append("file", file, file.name || "slip.jpg");
  body.append("payload", JSON.stringify(condition));
  let json: { code?: string; message?: string; data?: Record<string, unknown> };
  try {
    const res = await fetch(`${cfg.apiUrl}/api/verify-slip/qr-image/info`, { method: "POST", headers: { Authorization: `Bearer ${cfg.secret}` }, body, signal: AbortSignal.timeout(20_000) });
    json = await res.json();
  } catch (e) {
    console.error("slip2go request failed", e);
    throw new UserError("เชื่อมต่อระบบตรวจสลิปไม่ได้ กรุณาลองใหม่อีกครั้ง");
  }
  const code = String(json.code ?? "");
  if (code !== "200200" && code !== "200000") {
    if (code.startsWith("401") || code.startsWith("429") || code.startsWith("5")) console.error("slip2go error", code, json.message);
    throw new UserError(SLIP_ERRORS[code] ?? "ตรวจสลิปไม่ผ่าน กรุณาลองใหม่ หรือติดต่อแอดมิน");
  }
  const d = (json.data ?? {}) as { transRef?: string; amount?: number; dateTime?: string; sender?: { account?: { name?: string } }; receiver?: { account?: { name?: string } } };
  if (!d.transRef || typeof d.amount !== "number") throw new UserError("อ่านข้อมูลสลิปไม่ครบ กรุณาลองใหม่");
  // ตรวจซ้ำฝั่งเรา: ยอดต้องตรงทุกสตางค์
  if (Math.round(d.amount * 100) !== Math.round(expectedBaht * 100)) throw new UserError(SLIP_ERRORS["200402"]);
  return { transRef: d.transRef, amount: d.amount, dateTime: d.dateTime ?? "", senderName: d.sender?.account?.name ?? null, receiverName: d.receiver?.account?.name ?? null };
}

/** ปุ่ม "ทดสอบการเชื่อมต่อ" ในหลังบ้าน */
export async function testSlip2Go(apiUrl?: string, secret?: string) {
  const s = await load();
  const url = apiUrl ? parseApiUrl(apiUrl) : s.slip2go.apiUrl;
  const key = secret?.trim() || (s.slip2go.secretEnc ? decryptSecret(s.slip2go.secretEnc) : "");
  if (!url || !key) throw new UserError("กรอก API URL และ Secret Key ก่อนทดสอบ");
  try {
    const res = await fetch(`${url}/api/account/info`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15_000) });
    const json = (await res.json().catch(() => ({}))) as { code?: string; message?: string; data?: unknown };
    return { ok: String(json.code).startsWith("2"), code: String(json.code ?? res.status), message: String(json.message ?? res.statusText), data: json.data ?? null };
  } catch {
    throw new UserError("เชื่อมต่อไม่ได้ ตรวจ API URL อีกครั้ง");
  }
}

/* ───────────── TrueMoney ซองของขวัญ ───────────── */

const TM_ERRORS: Record<string, string> = {
  VOUCHER_NOT_FOUND: "ไม่พบซองของขวัญนี้ ตรวจลิงก์อีกครั้ง",
  VOUCHER_OUT_OF_STOCK: "ซองนี้ถูกรับไปหมดแล้ว",
  VOUCHER_EXPIRED: "ซองนี้หมดอายุแล้ว",
  TARGET_USER_REDEEMED: "ซองนี้ถูกใช้เติมไปแล้ว",
  CANNOT_GET_OWN_VOUCHER: "ไม่สามารถรับซองของตัวเองได้",
  TARGET_USER_NOT_FOUND: "เบอร์รับเงินของร้านไม่ถูกต้อง กรุณาติดต่อแอดมิน",
};

/**
 * รับซองของขวัญเข้าเบอร์ร้าน — ใช้ endpoint ของหน้าเว็บ gift.truemoney.com (ไม่ใช่ API ทางการ อาจเปลี่ยนได้)
 * คืนยอดเงินที่ได้รับจริง (บาท)
 */
export async function redeemTrueMoneyVoucher(voucherHash: string): Promise<number> {
  const s = await load();
  if (!tmReady(s)) throw new UserError("ยังไม่เปิดใช้การเติมด้วย TrueMoney");
  let json: { status?: { code?: string; message?: string }; data?: { my_ticket?: { amount_baht?: string }; voucher?: { amount_baht?: string } } };
  try {
    const res = await fetch(`https://gift.truemoney.com/campaign/vouchers/${encodeURIComponent(voucherHash)}/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; VelcutTopup/1.0)" },
      body: JSON.stringify({ mobile: s.truemoney.mobile, voucher_hash: voucherHash }),
      signal: AbortSignal.timeout(20_000),
    });
    json = await res.json();
  } catch (e) {
    console.error("truemoney redeem failed", e);
    throw new UserError("เชื่อมต่อ TrueMoney ไม่ได้ กรุณาลองใหม่ หรือติดต่อแอดมิน");
  }
  const code = json.status?.code ?? "";
  if (code !== "SUCCESS") {
    console.error("truemoney redeem error", code, json.status?.message);
    throw new UserError(TM_ERRORS[code] ?? "รับซองไม่สำเร็จ กรุณาติดต่อแอดมิน");
  }
  const amount = Number(json.data?.my_ticket?.amount_baht);
  if (!Number.isFinite(amount) || amount <= 0) throw new UserError("อ่านยอดเงินในซองไม่ได้ กรุณาติดต่อแอดมิน");
  return amount;
}
