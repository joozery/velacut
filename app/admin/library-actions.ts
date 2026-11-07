"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/session";
import { saveLibraryItem } from "@/lib/server/catalog";
import { UserError } from "@/lib/server/poster";
import type { ActionResult } from "@/lib/account";

export async function saveLibraryAction(kind: "hero" | "skin", item: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const saved = await saveLibraryItem(kind, item, admin.email);
    revalidatePath("/admin/library");
    revalidatePath("/", "layout");
    revalidatePath("/generate/mlbb", "layout");
    return { ok: true, data: saved };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error("saveLibrary failed", error);
    return { ok: false, error: "บันทึกคลังไม่สำเร็จ กรุณาลองใหม่" };
  }
}
