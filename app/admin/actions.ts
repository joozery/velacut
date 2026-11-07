"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import type { ActionResult } from "@/lib/account";
import { validateCredentials } from "@/lib/auth/schema";
import { addAdmin, adjustWallet, isAdmin, rejectTopup, resetAdminPassword, setAdminRole } from "@/lib/server/admin";
import { UserError } from "@/lib/server/poster";
import { requireAdmin } from "@/lib/server/session";
import { confirmTopup } from "@/lib/server/topup";
import { savePaymentSettings, testSlip2Go } from "@/lib/server/payments";
import { saveDailyConfig, savePromo, saveTopupConfig } from "@/lib/server/settings";
import type { DailyConfig } from "@/lib/daily";
import type { PromoConfig } from "@/lib/promo";
import type { TopupConfig } from "@/lib/topup";
import type { Appearance } from "@/lib/appearance";
import { saveAppearance } from "@/lib/server/appearance";

async function run(fn: () => Promise<void>, ...paths: string[]): Promise<ActionResult<null>> {
  try {
    await fn();
    for (const p of ["/admin", ...paths]) revalidatePath(p, p === "/admin" ? "layout" : "page");
    return { ok: true, data: null };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }
}

export async function saveAppearanceAction(input: unknown): Promise<ActionResult<Appearance>> {
  let saved: Appearance | undefined;
  const result = await run(async () => {
    const admin = await requireAdmin();
    saved = await saveAppearance(input, admin.email);
  }, "/admin/appearance");
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return { ok: true, data: saved! };
}

export type AdminLoginState = { error?: string; email?: string };

export async function adminLoginAction(_: AdminLoginState, form: FormData): Promise<AdminLoginState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (Object.keys(validateCredentials(email, password)).length) return { error: "กรุณากรอกอีเมลและรหัสผ่าน", email };
  // เช็กสิทธิ์ก่อนสร้าง session — บัญชีทั่วไปจะไม่ถูกล็อกอินจากหน้านี้
  if (!(await isAdmin(email))) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีนี้ไม่มีสิทธิ์ผู้ดูแล", email };
  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีนี้ไม่มีสิทธิ์ผู้ดูแล", email };
    throw e;
  }
  return {};
}

export async function confirmTopupAction(id: string) {
  return run(async () => { const a = await requireAdmin(); await confirmTopup(String(id), a.email); }, "/admin/topups", "/admin/transactions");
}

export async function rejectTopupAction(id: string) {
  return run(async () => { const a = await requireAdmin(); await rejectTopup(String(id), a.email); }, "/admin/topups", "/admin/transactions");
}

export async function adjustWalletAction(userId: string, input: { bucket: string; coins: number; reason: string }) {
  return run(async () => { const a = await requireAdmin(); await adjustWallet(String(userId), input, a.email); }, `/admin/users/${userId}`, "/admin/users", "/admin/transactions");
}

export async function setAdminRoleAction(userId: string, admin: boolean) {
  return run(async () => { const a = await requireAdmin(); await setAdminRole(String(userId), Boolean(admin), a.email); }, `/admin/users/${userId}`, "/admin/users", "/admin/admins");
}

export async function addAdminAction(input: { email: string; name?: string; password?: string }) {
  return run(async () => { const a = await requireAdmin(); await addAdmin(input ?? {}, a.email); }, "/admin/admins", "/admin/users");
}

export async function resetAdminPasswordAction(userId: string, password: string) {
  return run(async () => { const a = await requireAdmin(); await resetAdminPassword(String(userId), password, a.email); }, "/admin/admins");
}

export async function saveTopupConfigAction(config: unknown): Promise<ActionResult<TopupConfig>> {
  let saved: TopupConfig | null = null;
  const r = await run(async () => { const a = await requireAdmin(); saved = await saveTopupConfig(config, a.email); }, "/admin/settings");
  if (!r.ok) return r;
  revalidatePath("/topup");
  return { ok: true, data: saved! };
}

/** คืนค่าที่บันทึกจริง (มี version ใหม่) ให้ฟอร์มใช้เป็นค่าตั้งต้นต่อ */
export async function savePromoAction(promo: unknown): Promise<ActionResult<PromoConfig>> {
  let saved: PromoConfig | null = null;
  const r = await run(async () => { const a = await requireAdmin(); saved = await savePromo(promo, a.email); }, "/admin/promo");
  if (!r.ok) return r;
  // แถบประกาศอยู่ใน layout ของทุกหน้า
  revalidatePath("/", "layout");
  return { ok: true, data: saved! };
}

export async function saveDailyConfigAction(config: unknown): Promise<ActionResult<DailyConfig>> {
  let saved: DailyConfig | null = null;
  const r = await run(async () => { const a = await requireAdmin(); saved = await saveDailyConfig(config, a.email); }, "/admin/daily");
  if (!r.ok) return r;
  // ปุ่มของขวัญ/ตารางรางวัลอยู่ใน layout ของทุกหน้า
  revalidatePath("/", "layout");
  return { ok: true, data: saved! };
}

export async function savePaymentSettingsAction(input: unknown) {
  const r = await run(async () => { const a = await requireAdmin(); await savePaymentSettings(input, a.email); }, "/admin/payments");
  if (r.ok) revalidatePath("/topup");
  return r;
}

export async function testSlip2GoAction(apiUrl: string, secret: string): Promise<ActionResult<{ ok: boolean; code: string; message: string }>> {
  try {
    await requireAdmin();
    const r = await testSlip2Go(apiUrl, secret);
    return { ok: true, data: { ok: r.ok, code: r.code, message: r.message } };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "ทดสอบไม่สำเร็จ" };
  }
}
