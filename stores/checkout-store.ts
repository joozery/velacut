"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MOCK_USER } from "@/lib/mock";
import type { GameSlug } from "@/lib/games";
import type { EditorDoc } from "./editor-store";
import { MAX_SKINS, MIN_SKINS, payableTotal } from "@/lib/pricing";
import { getCatalog } from "@/lib/catalog";

export type PosterOrder = { id: string; signature: string; date: string; amount: number; game: GameSlug; doc: EditorDoc; cols: number };
export const posterSignature = (game: GameSlug, doc: EditorDoc, cols: number) => JSON.stringify([game, doc.skins, doc.template, doc.decoration ?? null, doc.output ?? "clean", cols]);

/** Local demo ledger. Real payments require an authenticated server ledger. */
export const useCheckoutStore = create(persist<{
  balance: number;
  orders: PosterOrder[];
  purchase: (game: GameSlug, doc: EditorDoc, cols: number) => PosterOrder;
}>((set, get) => ({
  balance: MOCK_USER.wallet.balance,
  orders: [],
  purchase: (game, doc, cols) => {
    if (doc.skins.length < MIN_SKINS || doc.skins.length > MAX_SKINS || new Set(doc.skins).size !== doc.skins.length || doc.skins.some((id) => !getCatalog(game).skinById.has(id))) throw new Error("กรุณาตรวจรายการสกินก่อนดาวน์โหลด");
    const signature = posterSignature(game, doc, cols);
    const existing = get().orders.find((o) => o.signature === signature);
    if (existing) return existing;
    const amount = payableTotal(doc.skins.length, doc.template, doc.output ?? "clean");
    if (get().balance < amount) throw new Error("คอยน์ทดลองไม่เพียงพอ กรุณาเลือกดาวน์โหลดฟรีแบบมีลายน้ำ");
    const order: PosterOrder = { id: `DEMO-PS-${crypto.randomUUID()}`, signature, date: new Date().toISOString(), amount, game, doc: structuredClone(doc), cols };
    set((s) => ({ balance: Math.round((s.balance - amount) * 100) / 100, orders: [order, ...s.orders] }));
    return order;
  },
}), { name: "velacut-demo-checkout", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true, partialize: (s) => ({ balance: s.balance, orders: s.orders }) as typeof s }));

export function useDemoWallet() {
  const balance = useCheckoutStore((s) => s.balance);
  useEffect(() => { if (!useCheckoutStore.persist.hasHydrated()) void useCheckoutStore.persist.rehydrate(); }, []);
  return balance;
}
