import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ให้ build ที่ใช้ตรวจสอบเขียนลงโฟลเดอร์แยก ไม่ชนกับ `npm run dev` (.next)
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
