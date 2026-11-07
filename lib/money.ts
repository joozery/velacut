/**
 * เครดิตมีทศนิยม 2 ตำแหน่ง (เช่น 0.3 ต่อสกิน) — ในฐานข้อมูลเก็บเป็นจำนวนเต็ม "หน่วยย่อย" (1 เครดิต = 100)
 * เพื่อกันปัญหา floating point เวลาบวกลบยอด
 */
export const UNITS_PER_COIN = 100;
export const toUnits = (coins: number) => Math.round(coins * UNITS_PER_COIN);
export const fromUnits = (units: number) => units / UNITS_PER_COIN;
