"use client";

import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Smooth scroll ทั้งหน้าด้วย Lenis (https://lenis.dev) — ใช้เฉพาะหน้า landing
 * - ผู้ใช้ที่ตั้ง reduce motion ได้ scroll ปกติ
 * - ข้าม dialog / sheet / ScrollArea เพื่อให้ scroll ด้านในทำงานตามปกติ (หรือใส่ data-lenis-prevent)
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
  if (reduce) return <>{children}</>;
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        anchors: { offset: -80 },
        prevent: (node) => !!node.closest?.("[role=dialog], [data-radix-scroll-area-viewport], [data-lenis-prevent]"),
      }}
    >
      {children}
    </ReactLenis>
  );
}
