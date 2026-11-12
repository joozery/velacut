import { ImageIcon, Lock } from "lucide-react";
import { cn, hashString } from "@/lib/utils";

const GRADIENTS = [
  "from-rose-400 to-orange-400",
  "from-violet-500 to-fuchsia-400",
  "from-sky-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-300 to-orange-500",
  "from-pink-400 to-rose-500",
  "from-cyan-400 to-blue-500",
  "from-lime-400 to-emerald-500",
];

export function placeholderGradient(seed: string) {
  return GRADIENTS[hashString(seed) % GRADIENTS.length];
}

/** การ์ดสกินแบบ placeholder: เลขลำดับ + badge tier + ชื่อ */
export function SkinPlaceholder({
  seed,
  name,
  hero,
  index,
  className,
  compact,
}: {
  seed: string;
  name: string;
  hero?: string;
  index?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative aspect-[200/325] overflow-hidden rounded-xl bg-gradient-to-br text-white", placeholderGradient(seed), className)}>
      <ImageIcon aria-hidden className="absolute top-1/2 left-1/2 size-1/3 -translate-x-1/2 -translate-y-1/2 opacity-25" />
      {index !== undefined && (
        <span className="absolute top-1.5 left-1.5 grid size-5 place-items-center rounded-md bg-black/45 text-[10px] font-bold backdrop-blur-sm">
          {index}
        </span>
      )}
      {!compact && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5">
          <p className="truncate text-xs font-semibold leading-tight">{name}</p>
          {hero && <p className="truncate text-[10px] opacity-80">{hero}</p>}
        </div>
      )}
    </div>
  );
}

/** ป้ายตัวอย่าง: กริด placeholder + ลายน้ำ */
export function PosterPlaceholder({
  seed,
  cols,
  rows,
  template = "none",
  watermark = true,
  locked,
  className,
  label,
}: {
  seed: string;
  cols: number;
  rows: number;
  template?: "none" | "a" | "b";
  watermark?: boolean;
  locked?: boolean;
  className?: string;
  label?: string;
}) {
  const count = cols * rows;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative overflow-hidden rounded-2xl p-3",
        template === "none" ? "bg-zinc-900" : "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950",
        className,
      )}
    >
      {template !== "none" && (
        <div aria-hidden className="mb-2 flex items-center justify-between">
          <div className="h-3 w-1/3 rounded-full bg-primary" />
          <div className="h-3 w-1/5 rounded-full bg-white/25" />
        </div>
      )}
      <div aria-hidden className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn("aspect-[200/325] rounded-md bg-gradient-to-br", placeholderGradient(`${seed}-${i}`))} />
        ))}
      </div>
      {template === "b" && (
        <div aria-hidden className="mt-2 grid grid-cols-3 gap-1.5">
          <div className="h-5 rounded-md bg-white/15" />
          <div className="h-5 rounded-md bg-white/15" />
          <div className="h-5 rounded-md bg-primary/80" />
        </div>
      )}
      {watermark && <div aria-hidden className="watermark pointer-events-none absolute inset-0" />}
      {locked && (
        <div aria-hidden className="absolute inset-0 grid place-items-center backdrop-blur-sm">
          <span className="grid size-12 place-items-center rounded-full bg-black/60 text-white">
            <Lock className="size-5" />
          </span>
        </div>
      )}
    </div>
  );
}
