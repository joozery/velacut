import { Suspense } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { AccountActions } from "@/components/layout/account-actions";
import { EditorCrumbs } from "./editor-crumbs";
import { copy } from "@/lib/copy";
import { EditorMobileHeader } from "./editor-mobile-header";

export function EditorTopBar() {
  return (
    <>
    <Suspense><EditorMobileHeader /></Suspense>
    <header className="relative z-40 hidden min-h-[72px] shrink-0 items-center gap-5 border-b border-border bg-surface px-6 lg:flex">
      <Logo className="shrink-0 [&_img]:h-5" />
      <span aria-hidden className="h-6 w-px bg-border" />
      {/* EditorCrumbs อ่าน ?step= จึงต้องอยู่ใน Suspense */}
      <Suspense fallback={<div className="h-9 w-40" />}>
        <EditorCrumbs />
      </Suspense>
      <div className="ml-auto flex items-center gap-1.5">
        <Button asChild variant="ghost" size="icon-sm" className="hidden sm:inline-flex">
          <Link href="/history" aria-label={copy.editor.history}>
            <History aria-hidden />
          </Link>
        </Button>
        <AccountActions />
      </div>
    </header>
    </>
  );
}
