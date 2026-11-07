/**
 * ช่องทางติดต่อ/โซเชียล — แสดงในปุ่มแชท (dock มุมขวาล่าง) และท้ายเว็บ
 * แอดมินตั้งลิงก์ได้ที่หลังบ้าน > ตกแต่งหน้าบ้าน > โซเชียล
 * ค่าเริ่มต้น (ก่อนบันทึกครั้งแรก) อ่านจาก env NEXT_PUBLIC_CONTACT_LINE / _MESSENGER / _FACEBOOK / _TIKTOK
 * ไอคอนจาก thesvg.org (CC0-1.0) — โลโก้เป็นเครื่องหมายการค้าของเจ้าของแต่ละราย ใช้เพื่อระบุช่องทางเท่านั้น
 */
export type ContactChannelId = "line" | "messenger" | "facebook" | "tiktok";
export const CONTACT_CHANNEL_IDS: ContactChannelId[] = ["line", "messenger", "facebook", "tiktok"];

export type ContactChannel = {
  id: ContactChannelId;
  /** ไอคอน SVG ใน public/social */
  icon: string;
  href: string;
  external: boolean;
};

export type SocialLinks = Record<ContactChannelId, string>;

/** ตัวอย่างลิงก์ของแต่ละช่องทาง (ใช้เป็น placeholder ในหลังบ้าน) */
export const SOCIAL_PLACEHOLDER: SocialLinks = {
  line: "https://line.me/R/ti/p/@yourid",
  messenger: "https://m.me/yourpage",
  facebook: "https://facebook.com/yourpage",
  tiktok: "https://www.tiktok.com/@yourid",
};

export const DEFAULT_SOCIAL: SocialLinks = {
  line: process.env.NEXT_PUBLIC_CONTACT_LINE ?? "",
  messenger: process.env.NEXT_PUBLIC_CONTACT_MESSENGER ?? "",
  facebook: process.env.NEXT_PUBLIC_CONTACT_FACEBOOK ?? "",
  tiktok: process.env.NEXT_PUBLIC_CONTACT_TIKTOK ?? "",
};

export const contactChannels = (social: SocialLinks): ContactChannel[] =>
  CONTACT_CHANNEL_IDS.map((id) => ({ id, icon: `/social/${id}.svg`, href: social[id] ?? "", external: true }));
