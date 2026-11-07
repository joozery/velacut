import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ให้ build ที่ใช้ตรวจสอบเขียนลงโฟลเดอร์แยก ไม่ชนกับ `npm run dev` (.next)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Include sharp's Linux binaries and libvips in Vercel functions, including dynamic imports.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },

  // เว็บเหลือแค่ MLBB — ลิงก์เก่าของ ROV / Free Fire พาไปหน้า MLBB แทน 404
  async redirects() {
    const old = ["rov", "freefire"];
    return old.flatMap((g) => [
      { source: `/generate/${g}`, destination: "/generate/mlbb", permanent: true },
    ]).concat(
      // หน้าคลังภาพถูกเอาออกแล้ว — ลิงก์เก่าพาไปหน้าสร้างป้าย
      { source: "/assets/:path*", destination: "/generate/mlbb", permanent: false },
    );
  },
};

export default nextConfig;
