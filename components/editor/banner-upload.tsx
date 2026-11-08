/* eslint-disable @next/next/no-img-element -- Preview of the customer's R2 upload. */
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ImagePlus, Loader2, LogIn, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";

/** เทมเพลต B: ลูกค้าอัปโหลดแบนเนอร์ของตัวเองไว้ด้านบนป้าย (ไม่มีข้อความทับ) */
export function BannerUpload({ value, onChange, title = "แบนเนอร์ของคุณ", hint = "แสดงด้านบนป้ายตามสัดส่วนจริง" }: { value?: string; onChange: (url: string | undefined) => void; title?: string; hint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const status = useSession().status;
  const loggedIn = status === "authenticated";
  const pathname = usePathname();
  const search = useSearchParams().toString();

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/upload/banner", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      onChange(data.url);
      toast({ title: "ใส่แบนเนอร์แล้ว", description: `${data.width}×${data.height} px`, variant: "success" });
    } catch (e) {
      toast({ title: "อัปโหลดแบนเนอร์ไม่สำเร็จ", description: e instanceof Error ? e.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (status === "loading") return <div role="status" aria-busy className="h-36 animate-pulse rounded-2xl bg-surface-2" />;

  if (!loggedIn) {
    const back = `${pathname}${search ? `?${search}` : ""}`;
    return (
      <div className="grid gap-3 rounded-2xl border border-dashed border-border p-4 text-center">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">เข้าสู่ระบบก่อนเพื่ออัปโหลดแบนเนอร์ไว้ด้านบนป้าย</p>
        <Button asChild size="sm" variant="outline" className="mx-auto"><Link href={`/login?callbackUrl=${encodeURIComponent(back)}`}><LogIn aria-hidden />เข้าสู่ระบบ</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2"><p className="text-sm font-semibold">{title}</p><span className="text-[11px] text-muted-foreground">แนะนำกว้าง 1600px</span></div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="sr-only" aria-label="เลือกไฟล์แบนเนอร์" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      {value ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-zinc-950"><img src={value} alt="แบนเนอร์ที่อัปโหลด" className="block h-auto w-full" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}เปลี่ยนรูป</Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange(undefined)} className="text-danger hover:bg-danger-soft"><Trash2 aria-hidden />เอาออก</Button>
          </div>
        </>
      ) : (
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-2/40 p-4 text-center transition-colors hover:border-primary/50 hover:bg-primary-soft/40 disabled:opacity-60">
          {busy ? <Loader2 className="size-6 animate-spin text-primary" aria-hidden /> : <ImagePlus className="size-6 text-primary" aria-hidden />}
          <span className="text-sm font-medium">{busy ? "กำลังอัปโหลด…" : "อัปโหลดแบนเนอร์"}</span>
          <span className="text-[11px] text-muted-foreground">PNG, JPG, WEBP ไม่เกิน 8 MB · {hint}</span>
        </button>
      )}
    </div>
  );
}
