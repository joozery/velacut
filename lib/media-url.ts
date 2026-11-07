/**
 * รูปที่อัปโหลดขึ้น R2 (รูปแบบ key ของเรา: <folder>/YYYY/MM/<uuid>.webp) → ดึงผ่าน /r2/... ของเว็บเราเอง
 * ใช้กับภาพบนป้ายที่ต้อง export เป็น PNG — html-to-image ต้อง fetch รูปเอง และ bucket R2 ไม่ส่ง CORS header
 */
export const R2_KEY = /^(banners|templates|catalog|appearance|promo)\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/;

export function exportSafeSrc(url: string): string {
  if (!/^https?:\/\//.test(url)) return url;
  try {
    const key = new URL(url).pathname.replace(/^\/+/, "");
    return R2_KEY.test(key) ? `/r2/${key}` : url;
  } catch {
    return url;
  }
}
