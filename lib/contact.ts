/**
 * ช่องทางติดต่อในปุ่มแชท (dock มุมขวาล่าง)
 * ตั้งลิงก์จริงผ่าน env (เช่นใน .env.local):
 *   NEXT_PUBLIC_CONTACT_LINE=https://line.me/R/ti/p/@yourid
 *   NEXT_PUBLIC_CONTACT_MESSENGER=https://m.me/yourpage
 *   NEXT_PUBLIC_CONTACT_FACEBOOK=https://facebook.com/yourpage
 *   NEXT_PUBLIC_CONTACT_TIKTOK=https://tiktok.com/@yourid
 * ไอคอนจาก thesvg.org (CC0-1.0) — โลโก้เป็นเครื่องหมายการค้าของเจ้าของแต่ละราย ใช้เพื่อระบุช่องทางเท่านั้น
 */
export type ContactChannelId = "line" | "messenger" | "facebook" | "tiktok";

export type ContactChannel = {
  id: ContactChannelId;
  /** ไอคอน SVG ใน public/social */
  icon: string;
  href: string;
  external: boolean;
};

export const CONTACT_CHANNELS: ContactChannel[] = [
  { id: "line", icon: "/social/line.svg", href: process.env.NEXT_PUBLIC_CONTACT_LINE ?? "", external: true },
  { id: "messenger", icon: "/social/messenger.svg", href: process.env.NEXT_PUBLIC_CONTACT_MESSENGER ?? "", external: true },
  { id: "facebook", icon: "/social/facebook.svg", href: process.env.NEXT_PUBLIC_CONTACT_FACEBOOK ?? "", external: true },
  { id: "tiktok", icon: "/social/tiktok.svg", href: process.env.NEXT_PUBLIC_CONTACT_TIKTOK ?? "", external: true },
];
