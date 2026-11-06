import { Suspense } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { CoinBalance } from "@/components/layout/coin-balance";
import { UserMenu } from "@/components/layout/user-menu";
import { EditorCrumbs } from "./editor-crumbs";
import { copy } from "@/lib/copy";
import { MOCK_USER } from "@/lib/mock";
import { EditorMobileHeader } from "./editor-mobile-header";

export function EditorTopBar({ balance }: { balance: number }) {
  return (
    <>
    <Suspense><EditorMobileHeader /></Suspense>
    <header className="relative z-40 hidden min-h-16 shrink-0 items-center gap-2 border-b border-border bg-surface px-4 lg:flex">
      {/* EditorCrumbs อ่าน ?step= จึงต้องอยู่ใน Suspense */}
      <Suspense fallback={<div className="h-9 w-40" />}>
        <EditorCrumbs />
      </Suspense>
      <Logo className="absolute left-1/2 hidden -translate-x-1/2 md:inline-flex" />
      <div className="ml-auto flex items-center gap-1.5">
        <Button asChild variant="ghost" size="icon-sm" className="hidden sm:inline-flex">
          <Link href="/history" aria-label={copy.editor.history}>
            <History aria-hidden />
          </Link>
        </Button>
        <CoinBalance balance={balance} />
        <UserMenu user={MOCK_USER} />
      </div>
    </header>
    </>
  );
}
