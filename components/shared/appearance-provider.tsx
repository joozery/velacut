"use client";

import { createContext, useContext } from "react";
import { DEFAULT_APPEARANCE, type Appearance } from "@/lib/appearance";

const AppearanceContext = createContext<Appearance>(DEFAULT_APPEARANCE);
export const useAppearance = () => useContext(AppearanceContext);
export function AppearanceProvider({ value, children }: { value: Appearance; children: React.ReactNode }) {
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}
