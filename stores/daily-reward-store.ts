import { create } from "zustand";
import { MOCK_CLAIMED_DAYS } from "@/lib/mock";

/** สถานะเช็กอินรายวัน — Phase 5 จะอ่าน/เขียน DailyClaim ผ่าน server action */
type DailyRewardState = {
  /** จำนวนวันที่เช็กอินแล้ว */
  claimed: number;
  claimedToday: boolean;
  claim: () => void;
};

export const useDailyReward = create<DailyRewardState>((set, get) => ({
  claimed: MOCK_CLAIMED_DAYS,
  claimedToday: false,
  claim: () => {
    if (get().claimedToday) return;
    set((s) => ({ claimed: s.claimed + 1, claimedToday: true }));
  },
}));

/** วันที่จะรับรางวัลถัดไป (1–30) */
export const nextRewardDay = (claimed: number) => Math.min(30, claimed + 1);
