/** ตั้งค่าช่องทางชำระเงิน — ฝั่ง client เห็นเฉพาะข้อมูลที่ไม่ลับ */
export type SlipReceiver = { accountType: string; accountNumber: string; accountNameTH: string; accountNameEN: string };

/** ค่าที่หลังบ้านแก้ได้ (ไม่มี secret — secret ส่งแยกเฉพาะตอนเปลี่ยน) */
export type PaymentSettingsView = {
  /** เบอร์/เลขพร้อมเพย์ที่รับเงิน — ใช้สร้าง QR จริง */
  promptpay: { id: string; name: string };
  slip2go: { enabled: boolean; apiUrl: string; hasSecret: boolean; secretHint: string | null; receivers: SlipReceiver[] };
  truemoney: { enabled: boolean; mobile: string };
  truemoneyWallet: { enabled: boolean; mobile: string; name: string };
};

/** ที่หน้าเติมเงินต้องรู้ */
export type PaymentMethodsPublic = { slipEnabled: boolean; truemoneyEnabled: boolean; truemoneyWalletEnabled: boolean; promptpayReady: boolean };

/** รหัสประเภทบัญชีที่ Slip2Go ใช้ (ดูเพิ่มที่เอกสาร Slip2Go) */
export const SLIP_ACCOUNT_TYPES: [string, string][] = [
  ["02001", "พร้อมเพย์ (เบอร์โทร)"],
  ["01004", "ธนาคารกสิกรไทย"],
  ["04000", "TrueMoney Wallet"],
];

const GIFT_RE = /^https:\/\/gift\.truemoney\.com\/campaign\/?\?v=([A-Za-z0-9]{10,64})$/;
/** ดึงรหัสซองจากลิงก์ซองของขวัญ TrueMoney */
export const parseGiftLink = (link: string) => GIFT_RE.exec(link.trim())?.[1] ?? null;

/** The form accepts a base URL or a copied Slip2Go endpoint. */
export function normalizeSlip2GoApiUrl(value: string) {
  let url = value.trim().replace(/\/+$/, "");
  const endpoint = /\/api\/(?:account\/info|verify-slip\/[^/?#]+\/info)$/i;
  while (endpoint.test(url)) url = url.replace(endpoint, "").replace(/\/+$/, "");
  return url;
}
