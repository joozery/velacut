"use server";

import type { AccountSnapshot, ActionResult, PosterOrder, TopupTicket } from "@/lib/account";
import { getAccount } from "@/lib/server/account";
import { claimDaily } from "@/lib/server/daily";
import { UserError, parsePosterInput, purchasePoster } from "@/lib/server/poster";
import { requireUser } from "@/lib/server/session";
import { createTopup, getTopupStatus, topupWithTrueMoney } from "@/lib/server/topup";
import { transferCoins } from "@/lib/server/transfer";
import { getServerCatalog } from "@/lib/server/catalog";

/** ห่อทุก action: error ที่ผู้ใช้ควรเห็นส่งข้อความกลับ ที่เหลือ log ไว้แล้วตอบข้อความกลาง */
async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }
}

export async function getAccountAction(): Promise<ActionResult<AccountSnapshot>> {
  return run(async () => getAccount((await requireUser()).id));
}

export async function purchasePosterAction(game: unknown, doc: unknown, cols: unknown): Promise<ActionResult<{ order: PosterOrder; account: AccountSnapshot }>> {
  return run(async () => {
    const user = await requireUser();
    const order = await purchasePoster(user.id, parsePosterInput(game, doc, cols, await getServerCatalog()));
    return { order, account: await getAccount(user.id) };
  });
}

export async function claimDailyAction(): Promise<ActionResult<{ reward: number; account: AccountSnapshot }>> {
  return run(async () => {
    const user = await requireUser();
    const { reward } = await claimDaily(user.id);
    return { reward, account: await getAccount(user.id) };
  });
}

export async function createTopupAction(input: { packageId?: string; baht?: number; method?: "promptpay" | "truemoney_wallet" }): Promise<ActionResult<TopupTicket>> {
  return run(async () => createTopup((await requireUser()).id, { packageId: typeof input?.packageId === "string" ? input.packageId : undefined, baht: typeof input?.baht === "number" ? input.baht : undefined, method: input?.method }));
}

export async function topupStatusAction(id: string): Promise<ActionResult<{ status: string | null; account: AccountSnapshot | null }>> {
  return run(async () => {
    const user = await requireUser();
    const status = await getTopupStatus(user.id, String(id));
    return { status, account: status === "completed" ? await getAccount(user.id) : null };
  });
}

export async function transferAction(toEmail: string, coins: number): Promise<ActionResult<{ account: AccountSnapshot }>> {
  return run(async () => {
    const user = await requireUser();
    await transferCoins(user.id, user.email, String(toEmail), Number(coins));
    return { account: await getAccount(user.id) };
  });
}

export async function trueMoneyTopupAction(link: string): Promise<ActionResult<{ coins: number; baht: number; account: AccountSnapshot }>> {
  return run(async () => {
    const user = await requireUser();
    const r = await topupWithTrueMoney(user.id, String(link ?? ""));
    return { ...r, account: await getAccount(user.id) };
  });
}
