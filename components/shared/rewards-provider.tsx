"use client";

import { createContext, useContext } from "react";
import { DEFAULT_REWARDS, type Reward } from "@/lib/rewards";

const RewardsContext = createContext<Reward[]>(DEFAULT_REWARDS);
/** รายการตรารีวอร์ดจากหลังบ้าน */
export const useRewards = () => useContext(RewardsContext);
export function RewardsProvider({ value, children }: { value: Reward[]; children: React.ReactNode }) {
  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
}
