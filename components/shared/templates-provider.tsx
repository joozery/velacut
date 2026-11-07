"use client";

import { createContext, useContext } from "react";
import { DEFAULT_TEMPLATES, type TemplatesConfig } from "@/lib/templates";

const TemplatesContext = createContext<TemplatesConfig>(DEFAULT_TEMPLATES);
/** ตั้งค่าแบบป้ายจากหลังบ้าน (ชื่อ คำอธิบาย ราคา เปิด/ปิด) */
export const useTemplates = () => useContext(TemplatesContext);
export function TemplatesProvider({ value, children }: { value: TemplatesConfig; children: React.ReactNode }) {
  return <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>;
}
