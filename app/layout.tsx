import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import { copy } from "@/lib/copy";
import { getAppearanceSafe } from "@/lib/server/appearance";
import { appearanceTokens } from "@/lib/appearance";
import { AppearanceProvider } from "@/components/shared/appearance-provider";
import { TemplatesProvider } from "@/components/shared/templates-provider";
import { getTemplatesSafe } from "@/lib/server/templates";
import "./globals.css";

const font = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getAppearanceSafe();
  return {
    title: { default: `${site.name} — ${copy.brand.tagline}`, template: `%s · ${site.name}` },
    description: site.description,
    icons: { icon: "/favicon.ico?v=iconbrow-1", shortcut: "/favicon.ico?v=iconbrow-1" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [site, templates] = await Promise.all([getAppearanceSafe(), getTemplatesSafe()]);
  const tokens = (color: string) => Object.entries(appearanceTokens(color)).map(([key, value]) => `${key}:${value}`).join(";");
  return (
    // ต้องใส่ font.variable ที่ <html> เพราะ --font-sans ถูกประกาศที่ :root และอ้าง var(--font-thai)
    <html lang="th" className={font.variable} suppressHydrationWarning>
      <body className="antialiased">
        <style>{`:root{${tokens(site.primaryLight)}}.dark{${tokens(site.primaryDark)}}`}</style>
        {/*
          ห่อทั้งแอปด้วย tag เฉพาะของเราเอง: browser extension หลายตัวแทรก <div> เข้ามาใน <body>
          ก่อน React hydrate — React 19 จะข้าม element แปลกปลอมได้ก็ต่อเมื่อชื่อ tag ไม่ตรงกับที่คาดไว้
          ถ้าลูกตัวแรกของ body เป็น <div> เหมือนกัน React จะพยายาม hydrate ลงไปแล้ว error
        */}
        <velacut-app>
          <a
            href="#main"
            className="sr-only z-[200] rounded-xl bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            {copy.common.skipToContent}
          </a>
          <AppearanceProvider value={site}><TemplatesProvider value={templates}><Providers>{children}</Providers></TemplatesProvider></AppearanceProvider>
        </velacut-app>
      </body>
    </html>
  );
}
