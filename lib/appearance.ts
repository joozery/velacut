import type { CSSProperties } from "react";
import { copy } from "./copy";

export const HOME_SECTIONS = [
  ["stats", "สถิติเบื้องต้น"], ["showcase", "ตัวอย่างป้าย"], ["features", "จุดเด่น"],
  ["steps", "ขั้นตอนใช้งาน"], ["pricing", "ราคาและเครดิต"], ["faq", "คำถามที่พบบ่อย"], ["finalCta", "ชวนเริ่มใช้งานท้ายหน้า"],
] as const;
export type HomeSection = typeof HOME_SECTIONS[number][0];
export type Appearance = {
  name: string; description: string; logoLight: string; logoDark: string;
  primaryLight: string; primaryDark: string;
  hero: {
    /** พื้นหลังของ section hero */
    background: string;
    /** ภาพที่อยู่ในตัวหนังสือชื่อเว็บ (wordmark) */
    wordmarkImage: string;
    /** ภาพในตัวหนังสือเลื่อนช้า ๆ */
    wordmarkAnimate: boolean;
    kicker: string; title: string; highlight: string; description: string; ctaLabel: string; ctaHref: string };
  footerAbout: string;
  sections: Record<HomeSection, boolean>;
  /** ลายน้ำบนภาพสกินที่ผู้ใช้เลือก (ตารางจัดสกิน + ป้ายตัวอย่าง) — ไฟล์ที่ชำระแล้วไม่มีลายน้ำนี้ */
  watermark: SkinWatermark;
};
export type SkinWatermark = {
  enabled: boolean;
  mode: "text" | "image";
  /** ว่าง = ใช้ชื่อเว็บ */
  text: string;
  image: string;
  /** ความเข้ม 5–90 (%) */
  opacity: number;
  /** ขนาด 50–200 (%) */
  size: number;
};
export const DEFAULT_WATERMARK: SkinWatermark = { enabled: true, mode: "text", text: "", image: "/logo/logo-dark.png", opacity: 35, size: 100 };
export const DEFAULT_APPEARANCE: Appearance = {
  name: copy.brand.name, description: copy.brand.metaDescription,
  logoLight: "/logo/logo-light.png", logoDark: "/logo/logo-dark.png",
  primaryLight: "#1463e8", primaryDark: "#2f78f5",
  hero: { background: "/images/hero-arena-background-v1.webp", wordmarkImage: "/images/hero-cover-create-v1.webp", wordmarkAnimate: true, kicker: copy.landing.hero.kicker,
    title: copy.landing.hero.tagline, highlight: copy.landing.hero.taglineLine2,
    description: `${copy.landing.hero.byline}\n${copy.landing.hero.bylineLine2}`,
    ctaLabel: copy.landing.hero.ctaPrimary, ctaHref: "/generate/mlbb" },
  footerAbout: copy.footer.about,
  sections: { stats: true, showcase: true, features: true, steps: true, pricing: true, faq: true, finalCta: true },
  watermark: DEFAULT_WATERMARK,
};

/** Choose readable button text for light and dark brand colors. */
export function foregroundFor(hex: string) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.179 ? "#111114" : "#ffffff";
}
export function appearanceTokens(color: string): CSSProperties {
  return {
    "--primary": color, "--primary-hover": `color-mix(in srgb, ${color} 85%, #111114)`,
    "--primary-foreground": foregroundFor(color), "--primary-soft": `color-mix(in srgb, ${color} 14%, transparent)`,
    "--primary-soft-foreground": color, "--ring": color,
  } as CSSProperties;
}
