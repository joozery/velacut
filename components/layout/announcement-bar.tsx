"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { copy } from "@/lib/copy";

export function AnnouncementBar() {
  const c = copy.announcement;
  return (
    <Dialog>
      <div className="bg-secondary text-secondary-foreground">
        <DialogTrigger className="container-page flex h-10 items-center justify-center gap-2 text-xs sm:text-sm">
          <Megaphone className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{c.short}</span>
          <span className="inline-flex shrink-0 items-center font-semibold text-primary underline-offset-4 hover:underline">
            {c.more}
            <ChevronRight className="size-4" aria-hidden />
          </span>
        </DialogTrigger>
      </div>
      <DialogContent className="w-[min(360px,calc(100vw-2rem),calc(100dvh-10rem))] max-w-[360px] gap-0 overflow-x-hidden p-0 [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:text-slate-700 [&>button]:shadow-sm">
        <DialogTitle className="sr-only">{c.title}</DialogTitle>
        <DialogDescription className="sr-only">{c.short}</DialogDescription>
        <Image
          src="/images/promotion-launch-square.webp"
          alt="โปรเปิดตัว VELCUT รับโบนัสคอยน์เพิ่ม 20% เมื่อเติมครั้งแรกตั้งแต่ 50 บาท ถึง 31 ธันวาคม"
          width={1024}
          height={1024}
          sizes="(max-width: 392px) calc(100vw - 32px), 360px"
          className="aspect-square w-full object-contain"
        />
        <div className="p-4">
          <DialogClose asChild>
            <Button asChild size="lg" className="w-full rounded-2xl">
              <Link href="/topup">{c.cta}<ArrowRight aria-hidden /></Link>
            </Button>
          </DialogClose>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            โบนัสใช้สร้างป้ายได้ทุกเกม ไม่สามารถโอนให้ผู้อื่นได้
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
