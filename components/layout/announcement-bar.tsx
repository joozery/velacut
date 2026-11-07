"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { promoActive, type PromoConfig } from "@/lib/promo";

const SEEN_KEY = "velacut-promo-seen";

/** เนื้อหา modal — ใช้ร่วมกับตัวอย่างในหลังบ้าน */
export function PromoCard({ promo, onCta }: { promo: PromoConfig; onCta?: () => void }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- รูปจากหลังบ้าน ขนาดไม่แน่นอน และแปลงเป็น webp ไว้แล้ว */}
      <img src={promo.image} alt={promo.imageAlt} className="block h-auto max-h-[min(60dvh,420px)] w-full object-contain" />
      <div className="p-4">
        <Button asChild size="lg" className="w-full rounded-2xl" onClick={onCta}>
          <Link href={promo.ctaHref}>{promo.ctaLabel}<ArrowRight aria-hidden /></Link>
        </Button>
        {promo.note && <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">{promo.note}</p>}
      </div>
    </>
  );
}

export function PromoBarButton({ promo }: { promo: PromoConfig }) {
  return (
    <span className="container-page flex h-9 items-center justify-center gap-2 text-[10px] sm:text-xs">
      <Megaphone className="size-3.5 shrink-0 text-accent" aria-hidden />
      <span className="truncate">{promo.barText}</span>
      <span className="inline-flex shrink-0 items-center font-semibold text-accent underline-offset-4 hover:underline">
        {promo.barLinkLabel}
        <ChevronRight className="size-4" aria-hidden />
      </span>
    </span>
  );
}

/** แถบประกาศด้านบน + modal โปรโมชัน (ตั้งค่าที่ /admin/promo) */
export function AnnouncementBar({ promo, active: serverActive }: { promo: PromoConfig; active: boolean }) {
  const [active, setActive] = useState(serverActive);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // หน้าอาจถูก cache ไว้ — เช็กช่วงเวลาอีกครั้งด้วยนาฬิกาของผู้ใช้
    const now = promoActive(promo);
    setActive(now);
    if (!now || promo.autoOpen === "off") return;
    let seen: string | null = null;
    try { seen = sessionStorage.getItem(SEEN_KEY) ?? localStorage.getItem(SEEN_KEY); } catch {}
    const key = String(promo.version);
    // always = เด้งครั้งแรกของแต่ละการเปิดเว็บ (ต่อแท็บ) / once = เด้งครั้งเดียวต่อเวอร์ชันโปร
    if (promo.autoOpen === "always" ? sessionStorage.getItem(SEEN_KEY) === key : seen === key) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [promo]);

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      try {
        sessionStorage.setItem(SEEN_KEY, String(promo.version));
        if (promo.autoOpen === "once") localStorage.setItem(SEEN_KEY, String(promo.version));
      } catch {}
    }
  };

  if (!active) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-ink text-white">
        <DialogTrigger className="w-full"><PromoBarButton promo={promo} /></DialogTrigger>
      </div>
      <DialogContent className="w-[min(360px,calc(100vw-2rem))] max-w-[360px] gap-0 overflow-hidden p-0 [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:text-slate-700 [&>button]:shadow-sm">
        <DialogTitle className="sr-only">{promo.title}</DialogTitle>
        <DialogDescription className="sr-only">{promo.barText}</DialogDescription>
        <PromoCard promo={promo} onCta={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
