import sharp from "sharp";
import { UserError } from "./poster";
import { publicBaseUrl, putPublicObject } from "./storage";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export type UploadFolder = "promo" | "appearance";
const FOLDERS: UploadFolder[] = ["promo", "appearance"];

/**
 * แปลงรูปที่อัปโหลดเป็น webp (กว้าง/สูงไม่เกิน 1600px) — การ encode ใหม่ตัด metadata
 * และทำให้ไฟล์ที่ไม่ใช่รูปจริง (เช่น SVG ที่มีสคริปต์) ใช้ไม่ได้
 */
export async function processImage(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new UserError("ไฟล์ใหญ่เกิน 8 MB");
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) throw new UserError("รองรับเฉพาะ PNG, JPG, WEBP, GIF หรือ AVIF");
  try {
    const { data, info } = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height, size: info.size };
  } catch {
    throw new UserError("อ่านไฟล์รูปไม่ได้ กรุณาลองไฟล์อื่น");
  }
}

/** แปลงรูปแล้วอัปโหลดขึ้น Cloudflare R2 */
export async function uploadImage(file: File, folder: unknown) {
  if (!FOLDERS.includes(folder as UploadFolder)) throw new UserError("ไม่รู้จักประเภทไฟล์ที่อัปโหลด");
  const img = await processImage(file);
  const now = new Date();
  const key = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.webp`;
  const url = await putPublicObject(key, img.data, "image/webp");
  return { url, width: img.width, height: img.height, size: img.size };
}

/** URL นี้เป็นรูปที่อัปโหลดผ่านระบบเรา (อยู่ใน bucket R2 ของเรา) หรือไม่ */
export function isUploadedUrl(url: string, folder: UploadFolder) {
  const base = publicBaseUrl();
  if (!base) return false;
  const prefix = `${base}/${folder}/`;
  return url.startsWith(prefix) && /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/.test(url.slice(prefix.length));
}
