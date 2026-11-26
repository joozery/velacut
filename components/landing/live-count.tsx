"use client";

import { useEffect, useRef, useState } from "react";

const nf = new Intl.NumberFormat("th-TH");
const POLL_MS = 10_000;

type Stats = { users: number; posters: number };
const listeners = new Set<(s: Stats) => void>();
let timer: ReturnType<typeof setInterval> | undefined;

async function poll() {
  if (document.hidden) return;
  try {
    const res = await fetch("/api/stats", { cache: "no-store" });
    if (res.ok) { const s = (await res.json()) as Stats; listeners.forEach((fn) => fn(s)); }
  } catch { /* ออฟไลน์ — รอรอบหน้า */ }
}
function subscribe(fn: (s: Stats) => void) {
  listeners.add(fn);
  if (listeners.size === 1) { void poll(); timer = setInterval(poll, POLL_MS); document.addEventListener("visibilitychange", poll); }
  return () => {
    listeners.delete(fn);
    if (!listeners.size) { clearInterval(timer); document.removeEventListener("visibilitychange", poll); }
  };
}

/** ตัวเลขสถิติสด: ดึงจาก /api/stats ทุก 10 วินาที และไล่ตัวเลขไปค่าใหม่แบบนุ่ม ๆ */
export function LiveCount({ stat, initial }: { stat: keyof Stats; initial: number }) {
  const [shown, setShown] = useState(initial);
  const current = useRef(initial);

  useEffect(() => {
    let raf = 0;
    const unsub = subscribe((s) => {
      const to = s[stat];
      const from = current.current;
      if (to === from) return;
      cancelAnimationFrame(raf);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 800);
        current.current = Math.round(from + (to - from) * t);
        setShown(current.current);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => { unsub(); cancelAnimationFrame(raf); };
  }, [stat]);

  return <span aria-live="off">{nf.format(shown)}</span>;
}
