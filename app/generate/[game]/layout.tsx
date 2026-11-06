import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EditorTopBar } from "@/components/editor/editor-top-bar";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorBottomBar } from "@/components/editor/editor-bottom-bar";
import { EditorHydrator } from "@/components/editor/editor-hydrator";
import { EditorMobileSteps } from "@/components/editor/editor-mobile-steps";
import { GAMES, getGame } from "@/lib/games";
import { MOCK_USER } from "@/lib/mock";

export function generateStaticParams() {
  return GAMES.map((g) => ({ game: g.slug }));
}

/**
 * App shell ของ editor: สูงเต็มจอ เลื่อนเฉพาะพื้นที่ทำงาน
 * ┌ top bar ─────────────────────────────────────┐
 * │ sidebar (lg) │ toolbar                        │
 * │              │ พื้นที่ทำงาน (scroll)          │
 * │              │ bottom bar                     │
 * └──────────────┴───────────────────────────────┘
 */
export default async function EditorLayout({ children, params }: { children: React.ReactNode; params: Promise<{ game: string }> }) {
  const game = getGame((await params).game);
  if (!game) notFound();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <EditorTopBar balance={MOCK_USER.wallet.balance} />
      {/* useSearchParams ต้องอยู่ใน Suspense */}
      <Suspense>
        <EditorHydrator />
        <EditorMobileSteps />
        <div className="flex min-h-0 flex-1 lg:gap-3 lg:p-3 lg:pt-0">
          <EditorSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-surface lg:shadow-soft-sm">
            <EditorToolbar />
            <main id="main" className="relative min-h-0 flex-1 overflow-y-auto">
              {children}
            </main>
            <EditorBottomBar />
          </div>
        </div>
      </Suspense>
    </div>
  );
}
