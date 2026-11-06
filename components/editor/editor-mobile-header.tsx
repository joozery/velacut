"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameIcon } from "@/components/shared/game-icon";
import { MIN_SKINS } from "@/lib/pricing";
import { useEditorStep } from "./use-editor-step";
import { useGrid } from "./use-grid";
import { MobileMenu } from "@/components/layout/mobile-menu";

const titles = { grid: "จัดสกิน", template: "เลือกแบบป้าย", decorate: "สตูดิโอแต่งป้าย", checkout: "ดาวน์โหลดป้าย" };

export function EditorMobileHeader() {
  const { game, step, index, prev, next, href } = useEditorStep();
  const { hydrated, skins } = useGrid(game.slug);
  const ready = hydrated && skins.length >= MIN_SKINS;
  return <header className="z-40 shrink-0 border-b border-border/60 bg-surface pt-[env(safe-area-inset-top)] lg:hidden">
    <div className="flex h-16 items-center gap-2 px-3">
      <Button asChild size="icon" variant="ghost" className="size-10 rounded-2xl bg-surface-2"><Link href={prev ? href(prev) : "/"} aria-label="ย้อนกลับ"><ArrowLeft /></Link></Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[13px] font-bold tracking-tight min-[375px]:text-[15px]">{titles[step]}</h1>
        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground"><GameIcon game={game} className="size-3.5 rounded" />{game.shortName}<span className="opacity-40">•</span>ขั้นตอน {index + 1}/4</p>
      </div>
      <MobileMenu className="size-10 rounded-2xl border border-border/70 bg-surface md:inline-flex" items={[
        { href: "/", label: "หน้าแรก" },
        { href: `/generate/${game.slug}`, label: "สร้างป้าย", match: "/generate" },
        { href: `/assets/${game.slug}`, label: "คลังภาพฟรี", match: "/assets" },
        { href: "/topup", label: "เติมคอยน์" },
        { href: "/history", label: "ประวัติ" },
        { href: "/profile", label: "บัญชีของฉัน" },
        { href: "/chat", label: "ติดต่อทีมงาน" },
      ]} />
      {game.mode === "library" && next && (ready ? <Button asChild size="sm" className="h-10 gap-1 rounded-2xl px-3"><Link href={href(next)}>{step === "decorate" ? "ถัดไป" : "ต่อไป"}<ArrowRight className="size-3.5" /></Link></Button> : <Button size="sm" disabled className="h-10 gap-1 rounded-2xl px-3">ต่อไป<ArrowRight /></Button>)}
    </div>
    <div className="flex gap-1 px-5 pb-2" aria-hidden="true">{Array.from({length:4},(_,i)=><span key={i} className={`h-[3px] flex-1 rounded-full ${i<=index ? "bg-primary" : "bg-surface-3"}`} />)}</div>
  </header>;
}
