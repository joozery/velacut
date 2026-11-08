"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, Download, FileImage, ImagePlus, Loader2, LogIn, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BRAND_NAME, copy } from "@/lib/copy";
import { formatCoinsFixed } from "@/lib/format";
import type { GameSlug } from "@/lib/games";
import { fmt } from "@/lib/utils";
import { useCheckout } from "./checkout-step";
import { PosterPreview } from "./poster-preview";
import { DEFAULT_DECORATION, useGameEditor } from "@/stores/editor-store";
import { useGrid } from "./use-grid";
import { useAccountStore } from "@/stores/account-store";
import { purchasePosterAction } from "@/app/actions/account";
import { renderPoster, savePoster } from "@/lib/poster-download";

const c = copy.editor.checkout;

/** ปุ่มขั้นสุดท้าย: เครดิตไม่พอ → เติมเครดิต / พอ → ยืนยันแล้วชำระ */
export function CheckoutCta({ game, disabled }: { game: GameSlug; disabled?: boolean }) {
  const k = useCheckout(game);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<{ blob: Blob; name: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const locked = useRef(false);
  const { doc } = useGameEditor(game);
  const { viewCols } = useGrid(game);
  const free = k.output === "watermark";
  const pathname = usePathname();
  const search = useSearchParams().toString();

  // แบบที่ให้ลูกค้าอัปโหลดแบนเนอร์เอง ต้องมีแบนเนอร์ก่อน (server ตรวจซ้ำ)
  if (k.needsBanner) {
    return (
      <Button asChild disabled={disabled} variant="outline" className="rounded-full px-5">
        <Link href={`/generate/${game}?step=decorate`}>
          <ImagePlus aria-hidden />
          อัปโหลดแบนเนอร์ก่อน
        </Link>
      </Button>
    );
  }

  if (!k.loggedIn && !free) {
    const back = `${pathname}${search ? `?${search}` : ""}`;
    return (
      <Button asChild disabled={disabled} className="rounded-full px-5">
        <Link href={`/login?callbackUrl=${encodeURIComponent(back)}`}>
          <LogIn aria-hidden />
          เข้าสู่ระบบเพื่อดาวน์โหลด
        </Link>
      </Button>
    );
  }

  if (k.short > 0 && !free) {
    return (
      <Button asChild disabled={disabled} className="rounded-full px-5">
        <Link href="/topup">
          <Wallet aria-hidden />
          {c.topup}
        </Link>
      </Button>
    );
  }

  const confirm = async () => {
    if (locked.current || disabled) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setExporting(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const node = exportRef.current?.firstElementChild;
      if (!(node instanceof HTMLElement)) throw new Error("ยังเตรียมป้ายไม่สำเร็จ กรุณาลองใหม่");
      // เรนเดอร์ให้เสร็จก่อนตัดเครดิต — โหลดภาพไม่สำเร็จจะไม่เสียเครดิต
      const blob = await renderPoster(node, free);
      let ref = Date.now().toString(36);
      if (k.loggedIn) {
        const r = await purchasePosterAction(game, doc, viewCols);
        if (!r.ok) throw new Error(r.error);
        useAccountStore.getState().setAccount(r.data.account);
        ref = r.data.order.id;
      }
      const name = `velacut-${game}-${ref.slice(-8)}${free ? "-watermark" : ""}.png`;
      setFile({ blob, name });
      savePoster(blob, name);
      setDone(true);
    } catch (e) {
      console.error("[poster-export]", e, e instanceof Event ? (e.target as HTMLImageElement | null)?.src?.slice(0, 120) : "");
      setError(e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      locked.current = false;
      setBusy(false);
      setExporting(false);
    }
  };

  return (
    <>
      <Button className="rounded-xl px-3 text-xs sm:px-5 sm:text-sm" disabled={disabled || busy} onClick={() => { setError(""); setDone(false); setOpen(true); }}>
        <Download aria-hidden />
        {k.paid ? "ดาวน์โหลดอีกครั้ง" : free ? c.payFree : c.payClean}
      </Button>
      <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
        <DialogContent onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onPointerDownOutside={(e) => { if (busy) e.preventDefault(); }}>
          {done && file ? (
            <>
              <div className="flex flex-col items-center gap-3 pt-2 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success"><CheckCircle2 className="size-7" aria-hidden /></span>
                <DialogHeader className="items-center text-center">
                  <DialogTitle>ดาวน์โหลดป้ายสำเร็จ</DialogTitle>
                  <DialogDescription>
                    {k.loggedIn ? "บันทึกไฟล์ PNG แล้ว ป้ายนี้ถูกเก็บไว้ที่หน้า \"ป้ายของฉัน\" ดาวน์โหลดซ้ำได้ฟรีทุกเมื่อ" : "บันทึกไฟล์ PNG แล้ว เข้าสู่ระบบเพื่อเก็บป้ายไว้ดาวน์โหลดซ้ำ"}
                  </DialogDescription>
                </DialogHeader>
                <p className="max-w-full truncate rounded-lg bg-surface-2 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">{file.name}</p>
              </div>
              <DialogFooter className="gap-2 sm:justify-center">
                <Button variant="outline" onClick={() => savePoster(file.blob, file.name)}><Download aria-hidden />บันทึกไฟล์อีกครั้ง</Button>
                {k.loggedIn ? (
                  <Button asChild><Link href="/posters" onClick={() => setOpen(false)}><FileImage aria-hidden />ไปที่ป้ายของฉัน</Link></Button>
                ) : (
                  <DialogClose asChild><Button>ปิด</Button></DialogClose>
                )}
              </DialogFooter>
            </>
          ) : (<>
          <DialogHeader>
            <DialogTitle>{free ? c.confirmFreeTitle : c.confirmTitle}</DialogTitle>
            <DialogDescription>
              {free ? fmt(c.confirmFreeDesc, { brand: BRAND_NAME }) : fmt(c.confirmDesc, { n: formatCoinsFixed(k.total) })}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs leading-5 text-muted-foreground">ป้ายเดิมดาวน์โหลดซ้ำได้ฟรีที่หน้าป้ายของฉัน</p>
          {!free && (
            <dl className="grid gap-1.5 rounded-2xl bg-surface-2 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">{c.balance}</dt><dd className="tabular-nums">{formatCoinsFixed(k.balance)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{c.total}</dt><dd className="tabular-nums">−{formatCoinsFixed(k.total)}</dd></div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><dt>{c.after}</dt><dd className="tabular-nums">{formatCoinsFixed(k.after)}</dd></div>
            </dl>
          )}
          {busy && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Loader2 className="size-4 animate-spin" />กำลังสร้างไฟล์ PNG…</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={busy}>{copy.common.cancel}</Button>
            </DialogClose>
            <Button onClick={confirm} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Download />}{busy ? "กำลังสร้างภาพ" : k.paid ? "ดาวน์โหลดซ้ำฟรี" : c.confirm}</Button>
          </DialogFooter>
          </>)}
        </DialogContent>
      </Dialog>
      {exporting && createPortal(<div aria-hidden className="pointer-events-none fixed top-0 left-[-20000px] w-[1080px]" ref={exportRef}><PosterPreview game={game} skinIds={doc.skins} cols={viewCols} template={doc.template} decoration={{ ...DEFAULT_DECORATION, ...doc.decoration }} className="rounded-none shadow-none" /></div>, document.body)}
    </>
  );
}
