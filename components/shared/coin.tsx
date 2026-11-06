import { cn } from "@/lib/utils";

/** ไอคอนเหรียญ (วาดเอง เพื่อไม่ต้องใช้รูป) */
export function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5", className)}>
      <circle cx="12" cy="12" r="10" fill="#1463E8" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#7CC4FF" strokeWidth="1.6" />
      <path d="M12 7.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="#fff" />
    </svg>
  );
}
