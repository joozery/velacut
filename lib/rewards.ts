/** ตรารีวอร์ดคะแนนสกิน — แอดมินจัดการได้ที่ /admin/rewards (ค่าเริ่มต้นคือภาพใน public/rewards) */
export type Reward = { id: string; name: string; image: string };

export const MAX_REWARDS = 30;
export const REWARD_ID_RE = /^[\w-]{1,24}$/;

export const DEFAULT_REWARDS: Reward[] = Array.from({ length: 9 }, (_, i) => ({ id: String(i + 1), name: `ระดับ ${i + 1}`, image: `/rewards/reward-${i + 1}.webp` }));

export const newRewardId = () => `r-${Math.random().toString(36).slice(2, 8)}`;
/** ตัวอย่างบน preview/หลังบ้าน: ใช้ตราสุดท้ายในรายการ */
export const sampleReward = (list: Reward[]) => list[list.length - 1];
