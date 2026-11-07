"use client";

import { create } from "zustand";
import type { AccountSnapshot } from "@/lib/account";
import { getAccountAction } from "@/app/actions/account";

type AccountState = {
  status: "idle" | "loading" | "ready" | "anon" | "error";
  account: AccountSnapshot | null;
  setAccount: (account: AccountSnapshot) => void;
  refresh: () => Promise<void>;
  reset: () => void;
};

/** ข้อมูลกระเป๋า/เช็กอินของผู้ใช้ที่ล็อกอิน — แหล่งจริงอยู่ที่ server, store นี้แค่ cache ไว้แสดงผล */
export const useAccountStore = create<AccountState>((set) => ({
  status: "idle",
  account: null,
  setAccount: (account) => set({ account, status: "ready" }),
  refresh: async () => {
    set((s) => ({ status: s.account ? s.status : "loading" }));
    const r = await getAccountAction();
    set(r.ok ? { account: r.data, status: "ready" } : { status: "error" });
  },
  reset: () => set({ account: null, status: "anon" }),
}));

export const useBalance = () => useAccountStore((s) => s.account?.wallet.balance ?? 0);
export const useWallet = () => useAccountStore((s) => s.account?.wallet ?? null);

const NO_DAILY = { claimed: 0, claimedToday: false };
/** ยังไม่ล็อกอิน = ยังไม่รับวันนี้ (กดแล้วจะชวนเข้าสู่ระบบ) */
export const useDaily = () => useAccountStore((s) => s.account?.daily ?? NO_DAILY);

export { nextRewardDay } from "@/lib/daily";
