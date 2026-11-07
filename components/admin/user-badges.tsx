import { Mail } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { GoogleMark } from "@/components/icons/google-mark";
import { cn } from "@/lib/utils";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

export function UserAvatar({ name, image, className }: { name: string; image?: string | null; className?: string }) {
  return <Avatar src={image ?? undefined} fallback={initials(name)} alt={name} className={cn("size-9", className)} />;
}

const PROVIDER = {
  google: { label: "Google", icon: <GoogleMark className="size-3.5" />, className: "border-border bg-surface" },
  credentials: { label: "อีเมล", icon: <Mail className="size-3.5 text-primary" aria-hidden />, className: "border-primary/15 bg-primary-soft/60" },
} as const;

/** วิธีสมัคร = provider แรกของบัญชี (ระบบต่อท้ายเมื่อผูกวิธีใหม่) — ที่เหลือแสดงเป็น "ผูกเพิ่ม" */
export function SignupSource({ providers, compact = false }: { providers: string[]; compact?: boolean }) {
  const [first, ...rest] = providers.filter((p): p is keyof typeof PROVIDER => p in PROVIDER);
  if (!first) return <span className="text-xs text-muted-foreground">—</span>;
  const p = PROVIDER[first];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium whitespace-nowrap", p.className)}>{p.icon}{p.label}</span>
      {rest.length > 0 && (compact
        ? <span className="text-[10px] text-muted-foreground">+ ผูก {rest.map((r) => PROVIDER[r].label).join(", ")}</span>
        : rest.map((r) => <span key={r} className="inline-flex h-6 items-center gap-1.5 rounded-full border border-dashed border-border px-2 text-[11px] text-muted-foreground">{PROVIDER[r].icon}ผูก {PROVIDER[r].label}</span>))}
    </span>
  );
}
