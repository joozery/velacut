import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FloatingActions } from "@/components/layout/floating-actions";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getDailyConfigSafe, getPromoSafe } from "@/lib/server/settings";
import { promoActive } from "@/lib/promo";
import { CatalogProvider } from "@/components/shared/catalog-provider";
import { getCatalogChangesSafe } from "@/lib/server/catalog";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const [promo, daily, changes] = await Promise.all([getPromoSafe(), getDailyConfigSafe(), getCatalogChangesSafe()]);
  return (
    <CatalogProvider changes={changes}>
      <AnnouncementBar promo={promo} active={promoActive(promo)} />
      {/* กรอบกลางจอ: เส้นซ้าย-ขวาวิ่งตลอดทั้งหน้า */}
      <div className="frame relative min-h-dvh pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0">
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </div>
      <FloatingActions daily={daily} />
      <MobileBottomNav />
    </CatalogProvider>
  );
}
