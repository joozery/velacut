"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import type { ActionResult } from "@/lib/account";
import { requireUser } from "@/lib/server/session";
import { saveProfileName, changeProfilePassword } from "@/lib/server/profile";
import { UserError } from "@/lib/server/poster";

export async function saveProfileNameAction(name: string): Promise<ActionResult<{ name: string }>> {
  try {
    const user = await requireUser();
    const result = await saveProfileName(user.id, name);
    revalidatePath("/profile");
    return { ok: true, data: result };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error("saveProfileName failed", error);
    return { ok: false, error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }
}

export async function changeProfilePasswordAction(input: { current: string; password: string; confirm: string }): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await changeProfilePassword(user.id, input);
    await signOut({ redirect: false });
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error("changeProfilePassword failed", error);
    return { ok: false, error: "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่" };
  }
}
