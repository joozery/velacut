import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HistoryKind, HistoryStatus } from "@/lib/history";
import { formatCoinsFixed } from "@/lib/format";
import { cn } from "@/lib/utils";

export const KIND_LABEL: Record<HistoryKind, string> = { topup: "เติมเครดิต", poster: "สร้างป้าย", transfer: "โอนเครดิต", reward: "รางวัล", adjust: "ปรับยอด" };
export const STATUS_LABEL: Record<HistoryStatus, string> = { completed: "สำเร็จ", pending: "รอดำเนินการ", failed: "ไม่สำเร็จ" };
const STATUS_COLOR: Record<HistoryStatus, string> = { completed: "bg-success-soft text-success", pending: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300", failed: "bg-danger-soft text-danger" };

const dt = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
export const formatDateTime = (iso: string) => dt.format(new Date(iso));

export function PageTitle({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>{desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}</div>
      {children}
    </header>
  );
}

export function StatusBadge({ status, reason }: { status: HistoryStatus; reason?: string }) {
  const r = reason === "expired" ? "หมดอายุ" : reason === "cancelled" ? "ยกเลิก" : reason === "rejected" ? "ปฏิเสธ" : null;
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium whitespace-nowrap", STATUS_COLOR[status])}>{r ?? STATUS_LABEL[status]}</span>;
}

export function Coins({ value, signed = true }: { value: number; signed?: boolean }) {
  return <span className={cn("font-semibold whitespace-nowrap tabular-nums", signed && value > 0 && "text-primary", signed && value < 0 && "text-foreground")}>{signed && value > 0 ? "+" : value < 0 ? "−" : ""}{formatCoinsFixed(Math.abs(value))}</span>;
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-border bg-surface", className)} {...props} />;
}

/** ฟอร์มกรองแบบ GET — ทำงานได้โดยไม่ต้องมี JS */
export function FilterBar({ children, action }: { children: React.ReactNode; action: string }) {
  return <form action={action} className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:p-4">{children}<button type="submit" className="h-10 shrink-0 rounded-xl bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary-hover">ค้นหา</button></form>;
}

export const fieldClass = "h-10 rounded-xl border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring";

export function Pager({ page, pages, total, href }: { page: number; pages: number; total: number; href: (p: number) => string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
      <span>ทั้งหมด {total.toLocaleString("th-TH")} รายการ</span>
      <div className="flex items-center gap-1">
        {page > 1 ? <Link href={href(page - 1)} aria-label="หน้าก่อนหน้า" className="grid size-8 place-items-center rounded-lg hover:bg-surface-2"><ChevronLeft className="size-4" /></Link> : <span className="grid size-8 place-items-center opacity-30"><ChevronLeft className="size-4" /></span>}
        <span className="px-1 tabular-nums">{page} / {pages}</span>
        {page < pages ? <Link href={href(page + 1)} aria-label="หน้าถัดไป" className="grid size-8 place-items-center rounded-lg hover:bg-surface-2"><ChevronRight className="size-4" /></Link> : <span className="grid size-8 place-items-center opacity-30"><ChevronRight className="size-4" /></span>}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-14 text-center text-sm text-muted-foreground">{children}</p>;
}

export function qs(base: string, params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== "all").map(([k, v]) => [k, String(v)])).toString();
  return s ? `${base}?${s}` : base;
}
