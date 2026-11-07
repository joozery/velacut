import { findUserById, replaceOwnPassword, updateDisplayName, verifyPassword } from "@/lib/auth/user-store";
import { PASSWORD_MIN } from "@/lib/auth/schema";
import type { ProfileInfo } from "@/lib/profile";
import { UserError } from "./poster";

export async function getProfile(userId: string): Promise<ProfileInfo> {
  const user = await findUserById(userId);
  if (!user) throw new UserError("ไม่พบบัญชี กรุณาเข้าสู่ระบบใหม่");
  return { id: user.id, name: user.name, email: user.email, image: user.image ?? null, providers: user.providers, hasPassword: Boolean(user.passwordHash), createdAt: user.createdAt.toISOString(), lastLoginAt: user.lastLoginAt?.toISOString() ?? null };
}

export async function saveProfileName(userId: string, raw: unknown) {
  if (typeof raw !== "string" || raw.trim().length < 2 || raw.trim().length > 40) throw new UserError("ชื่อที่แสดงต้องยาว 2–40 ตัวอักษร");
  const name = raw.trim();
  if (!(await updateDisplayName(userId, name))) throw new UserError("ไม่พบบัญชี กรุณาเข้าสู่ระบบใหม่");
  return { name };
}

export async function changeProfilePassword(userId: string, input: { current?: unknown; password?: unknown; confirm?: unknown }) {
  const password = input?.password;
  if (typeof password !== "string" || password.length < PASSWORD_MIN || password.length > 128) throw new UserError(`รหัสผ่านใหม่ต้องยาว ${PASSWORD_MIN}–128 ตัวอักษร`);
  if (input.confirm !== password) throw new UserError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
  const user = await findUserById(userId);
  if (!user) throw new UserError("ไม่พบบัญชี กรุณาเข้าสู่ระบบใหม่");
  if (user.passwordHash) {
    if (typeof input.current !== "string" || input.current.length > 128 || !(await verifyPassword(input.current, user.passwordHash))) throw new UserError("รหัสผ่านปัจจุบันไม่ถูกต้อง");
    if (await verifyPassword(password, user.passwordHash)) throw new UserError("กรุณาใช้รหัสผ่านใหม่ที่ต่างจากเดิม");
  }
  if (!(await replaceOwnPassword(userId, user.passwordHash, password))) throw new UserError("ข้อมูลบัญชีเปลี่ยนไป กรุณาเข้าสู่ระบบแล้วลองใหม่");
}
