/** ตั้งค่า modal โปรโมชัน + แถบประกาศด้านบน — เก็บใน MongoDB (settings/promo) แก้ได้ที่ /admin/promo */
export type PromoAutoOpen = "off" | "once" | "always";

export type PromoConfig = {
  enabled: boolean;
  /** ข้อความในแถบประกาศ */
  barText: string;
  barLinkLabel: string;
  title: string;
  /** URL รูป: อัปโหลดผ่านหลังบ้าน (Cloudflare R2) หรือไฟล์ใน /public/images */
  image: string;
  imageAlt: string;
  ctaLabel: string;
  /** ลิงก์ปุ่ม — path ภายในเว็บ เช่น /topup */
  ctaHref: string;
  note: string;
  /** ISO — ว่าง = ไม่กำหนด */
  startsAt: string | null;
  endsAt: string | null;
  autoOpen: PromoAutoOpen;
  /** เพิ่มทุกครั้งที่บันทึก — ใช้กับ autoOpen "once" ให้ผู้ใช้เห็นโปรใหม่อีกครั้ง */
  version: number;
};

export const DEFAULT_PROMO: PromoConfig = {
  enabled: true,
  barText: "โปรเปิดตัว! เติมเครดิตครั้งแรกรับโบนัสเพิ่ม 20%",
  barLinkLabel: "ดูรายละเอียด",
  title: "โปรโมชันเปิดตัว",
  image: "/images/promotion-launch-square.webp",
  imageAlt: "โปรเปิดตัว VELCUT รับโบนัสเครดิตเพิ่ม 20% เมื่อเติมครั้งแรกตั้งแต่ 50 บาท ถึง 31 ธันวาคม",
  ctaLabel: "ไปเติมเครดิต",
  ctaHref: "/topup",
  note: "โบนัสใช้สร้างป้ายได้ทุกเกม ไม่สามารถโอนให้ผู้อื่นได้",
  startsAt: null,
  endsAt: null,
  autoOpen: "off",
  version: 0,
};

/** อยู่ในช่วงเวลาที่กำหนดหรือไม่ (เช็กฝั่ง client เพราะหน้าเว็บอาจถูก cache ไว้) */
export function promoActive(p: PromoConfig, now = Date.now()) {
  if (!p.enabled) return false;
  if (p.startsAt && now < new Date(p.startsAt).getTime()) return false;
  if (p.endsAt && now > new Date(p.endsAt).getTime()) return false;
  return true;
}
