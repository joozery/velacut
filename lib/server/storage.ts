import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UserError } from "./poster";

/**
 * Cloudflare R2 (API แบบ S3) — ตั้งค่าใน env:
 * R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL (โดเมนสาธารณะของ bucket เช่น https://cdn.example.com)
 */
const env = () => ({
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
  publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ""),
});

export const storageConfigured = () => Object.values(env()).every(Boolean);

/** URL สาธารณะของ bucket (ไม่มี / ท้าย) — ใช้ตรวจว่ารูปมาจากระบบอัปโหลดของเรา */
export const publicBaseUrl = () => env().publicUrl ?? null;

const g = globalThis as typeof globalThis & { __r2?: S3Client };
function client() {
  const e = env();
  if (!storageConfigured()) throw new UserError("ยังไม่ได้ตั้งค่าที่เก็บไฟล์ (Cloudflare R2) — ติดต่อผู้ดูแลระบบ");
  g.__r2 ??= new S3Client({
    region: "auto",
    endpoint: `https://${e.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: e.accessKeyId!, secretAccessKey: e.secretAccessKey! },
  });
  return g.__r2;
}

/** อัปโหลดไฟล์ขึ้น R2 แล้วคืน URL สาธารณะ — key ไม่ซ้ำเสมอ จึง cache ได้ยาว */
export async function putPublicObject(key: string, body: Buffer, contentType: string) {
  if (!/^[a-z0-9][a-z0-9/_.-]{0,200}$/.test(key) || key.includes("..")) throw new Error(`invalid storage key: ${key}`);
  await client().send(new PutObjectCommand({ Bucket: env().bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
  return `${env().publicUrl}/${key}`;
}

/** ลบไฟล์จาก URL สาธารณะ (ใช้เฉพาะไฟล์ใน bucket ของเรา) */
export async function deletePublicObject(url: string) {
  const base = env().publicUrl;
  if (!base || !url.startsWith(`${base}/`)) throw new Error("not our object");
  await client().send(new DeleteObjectCommand({ Bucket: env().bucket, Key: url.slice(base.length + 1) }));
}

export async function listObjects(prefix: string) {
  const r = await client().send(new ListObjectsV2Command({ Bucket: env().bucket, Prefix: prefix }));
  return (r.Contents ?? []).map((o) => ({ key: o.Key!, size: o.Size ?? 0 }));
}
