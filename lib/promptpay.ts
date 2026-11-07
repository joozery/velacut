/**
 * สร้าง payload QR PromptPay (มาตรฐาน EMVCo / Thai QR Payment) พร้อมยอดเงิน
 * รองรับพร้อมเพย์เบอร์มือถือ (10 หลัก) และเลขบัตรประชาชน / เลขผู้เสียภาษี (13 หลัก)
 */
const f = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;

export function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export const normalizePromptPayId = (id: string) => id.replace(/\D/g, "");
export const isPromptPayId = (id: string) => /^0\d{9}$/.test(id) || /^\d{13}$/.test(id);

export function promptPayPayload(id: string, amount: number) {
  const target = normalizePromptPayId(id);
  if (!isPromptPayId(target)) throw new Error("invalid PromptPay id");
  const account = target.length === 10 ? f("01", `0066${target.slice(1)}`) : f("02", target);
  const body =
    f("00", "01") +
    f("01", "12") + // dynamic QR (มียอดเงิน ใช้ครั้งเดียว)
    f("29", f("00", "A000000677010111") + account) +
    f("53", "764") +
    f("54", amount.toFixed(2)) +
    f("58", "TH") +
    "6304";
  return body + crc16(body);
}
