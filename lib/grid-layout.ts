export type GridLayout = { cols: number; rows: number };

/** layout ทั้งหมดที่ cols × rows = n พอดี เช่น 6 → 3×2, 2×3, 6×1, 1×6 */
export function layoutOptions(n: number): GridLayout[] {
  if (n < 1) return [];
  const out: GridLayout[] = [];
  for (let cols = 1; cols <= n; cols++) {
    if (n % cols === 0) out.push({ cols, rows: n / cols });
  }
  // เรียง: ใกล้จัตุรัส (คอลัมน์ ≥ แถว) ก่อน → แนวตั้ง → เส้นตรงไว้ท้ายสุด
  const score = ({ cols, rows }: GridLayout) => {
    const line = cols === 1 || rows === 1 ? 1000 : 0;
    const landscapePenalty = cols >= rows ? 0 : 0.5;
    return line + Math.abs(cols - rows) + landscapePenalty;
  };
  return out.sort((a, b) => score(a) - score(b) || b.cols - a.cols);
}

/** ใช้ cols ที่ผู้ใช้เลือกถ้ายังหารลงตัว ไม่งั้นเลือกค่าแนะนำ */
export function resolveLayout(n: number, preferredCols: number | null): GridLayout | null {
  const opts = layoutOptions(n);
  if (!opts.length) return null;
  return opts.find((o) => o.cols === preferredCols) ?? opts[0];
}

/** ตัวเลือก layout ทุกจำนวนคอลัมน์ min..max พร้อมจำนวนแถวที่ได้ (exact = เต็มทุกช่องพอดี) */
export function gridOptions(n: number, min: number, max: number) {
  return Array.from({ length: max - min + 1 }, (_, i) => {
    const cols = min + i;
    return { cols, rows: Math.ceil(n / cols), exact: n > 0 && n % cols === 0 };
  });
}
