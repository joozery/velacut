/* eslint-disable @next/next/no-img-element -- Watermark logos may be unsaved uploads; html-to-image needs a plain <img>. */
import type { SkinWatermark } from "@/lib/appearance";
import { exportSafeSrc } from "@/lib/media-url";

/**
 * ลายน้ำบนภาพสกินหนึ่งใบ — มี data-export-watermark ให้ไฟล์แบบไม่มีลายน้ำตัดออกตอน export
 * ต้องอยู่ใน element ที่เป็น @container (SkinThumb) เพื่อให้ขนาดตามความกว้างการ์ด
 */
export function SkinWatermarkOverlay({ config, siteName }: { config: SkinWatermark; siteName: string }) {
  if (!config.enabled) return null;
  const scale = config.size / 100;
  const label = (config.text || siteName).toUpperCase();
  return (
    <div data-export-watermark aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none" style={{ opacity: config.opacity / 100 }}>
      {config.mode === "image" ? (
        <div className="absolute inset-0 flex rotate-[-28deg] flex-col items-center justify-center" style={{ gap: `${22 * scale}cqw` }}>
          {[0, 1].map((i) => <img key={i} src={exportSafeSrc(config.image)} alt="" draggable={false} className="object-contain drop-shadow-[0_1px_2px_rgb(0_0_0/0.4)]" style={{ width: `${62 * scale}cqw`, maxHeight: `${30 * scale}cqw` }} />)}
        </div>
      ) : (
        <div className="absolute inset-0 flex rotate-[-28deg] flex-col items-center justify-center" style={{ gap: `${18 * scale}cqw` }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="font-black tracking-[0.18em] whitespace-nowrap text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.45)]" style={{ fontSize: `${13 * scale}cqw` }}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
