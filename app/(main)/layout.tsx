import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FloatingActions } from "@/components/layout/floating-actions";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      {/* กรอบกลางจอ: เส้นซ้าย-ขวาวิ่งตลอดทั้งหน้า */}
      <div className="frame relative min-h-dvh pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-0">
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </div>
      <FloatingActions />
      <MobileBottomNav />
    </>
  );
}
