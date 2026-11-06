import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** แปลง string → ตัวเลขคงที่ ใช้เลือกสี placeholder ให้เหมือนเดิมทุกครั้ง */
export function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  // fmix32 (MurmurHash3): กระจายบิต ให้ string ที่ต่างกันนิดเดียวได้ค่าห่างกัน
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** template แบบ "{n} สกิน" */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/**
 * เปรียบเทียบข้อความแบบกำหนด locale ตายตัว
 * (localeCompare ที่ไม่ระบุ locale ใช้ภาษาของเครื่อง → server กับ browser เรียงไม่เหมือนกัน → hydration mismatch)
 */
const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
export const compareText = (a: string, b: string) => collator.compare(a, b);
