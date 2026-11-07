import type { Filter } from "mongodb";
import { getDb } from "@/lib/db/mongo";
import { EmailTakenError, createPasswordUser, normalizeEmail, setPassword } from "@/lib/auth/user-store";
import { PASSWORD_MIN } from "@/lib/auth/schema";
import { fromUnits, toUnits } from "@/lib/money";
import type { HistoryKind, HistoryStatus } from "@/lib/history";
import { collections, newId, type TxDoc } from "./collections";
import { bangkokDate } from "./daily";
import { UserError } from "./poster";
import { expireTopups } from "./topup";
import { credit, debitBucket, getWalletUnits, toSnapshot, type Bucket } from "./wallet";

export const PAGE_SIZE = 20;

type UserRow = { _id: string; name: string; email: string; image?: string | null; providers: string[]; passwordHash?: string; role?: "admin"; roleGrantedBy?: string; roleGrantedAt?: Date; lastLoginAt?: Date; createdAt: Date };

const envAdmins = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => normalizeEmail(e)).filter(Boolean);

/** แอดมิน = อีเมลอยู่ใน ADMIN_EMAILS หรือมี role "admin" ในฐานข้อมูล */
export async function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  const e = normalizeEmail(email);
  if (envAdmins().includes(e)) return true;
  const db = await getDb();
  return Boolean(await db.collection<UserRow>("users").findOne({ email: e, role: "admin" }, { projection: { _id: 1 } }));
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const page = (p: unknown) => Math.max(1, Math.floor(Number(p)) || 1);

export type TxRow = {
  id: string; userId: string; userEmail: string; kind: HistoryKind; status: HistoryStatus; coins: number;
  title: string; description: string; note: string; date: string;
  topup?: { method: "promptpay" | "truemoney" | "truemoney_wallet"; baht: number; payAmount: number; expiresAt: string; completedAt?: string; failReason?: string; confirmedBy?: string; rejectedBy?: string };
};

async function emailsFor(userIds: string[]) {
  const db = await getDb();
  const users = await db.collection<UserRow>("users").find({ _id: { $in: [...new Set(userIds)] } }, { projection: { email: 1 } }).toArray();
  return new Map(users.map((u) => [u._id, u.email]));
}

function toRow(t: TxDoc, emails: Map<string, string>): TxRow {
  return {
    id: t._id, userId: t.userId, userEmail: emails.get(t.userId) ?? "(ลบแล้ว)", kind: t.kind, status: t.status, coins: fromUnits(t.amount),
    title: t.title, description: t.description, note: t.note, date: t.createdAt.toISOString(),
    ...(t.topup ? { topup: { method: t.topup.method, baht: t.topup.baht, payAmount: t.topup.payAmount / 100, expiresAt: t.topup.expiresAt.toISOString(), completedAt: t.status === "completed" ? (t.completedAt ?? t.updatedAt).toISOString() : undefined, failReason: t.topup.failReason, confirmedBy: t.topup.confirmedBy, rejectedBy: t.topup.rejectedBy } } : {}),
  };
}

export async function getStats() {
  await expireTopups();
  const db = await getDb();
  const { txs, wallets } = await collections();
  const today = new Date(`${bangkokDate()}T00:00:00+07:00`);
  const [users, newUsers, pending, topupToday, coins, posters] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("users").countDocuments({ createdAt: { $gte: today } }),
    txs.countDocuments({ kind: "topup", status: "pending" }),
    txs.aggregate<{ baht: number; n: number }>([{ $match: { kind: "topup", status: "completed", updatedAt: { $gte: today } } }, { $group: { _id: null, baht: { $sum: "$topup.baht" }, n: { $sum: 1 } } }]).toArray(),
    wallets.aggregate<{ t: number; b: number }>([{ $group: { _id: null, t: { $sum: "$transferable" }, b: { $sum: "$bonus" } } }]).toArray(),
    txs.aggregate<{ n: number; spent: number }>([{ $match: { kind: "poster", status: "completed" } }, { $group: { _id: null, n: { $sum: 1 }, spent: { $sum: "$amount" } } }]).toArray(),
  ]);
  return {
    users, newUsers, pendingTopups: pending,
    topupTodayBaht: topupToday[0]?.baht ?? 0, topupTodayCount: topupToday[0]?.n ?? 0,
    coinsTransferable: fromUnits(coins[0]?.t ?? 0), coinsBonus: fromUnits(coins[0]?.b ?? 0),
    posters: posters[0]?.n ?? 0, posterCoins: fromUnits(Math.abs(posters[0]?.spent ?? 0)),
  };
}

export async function listTransactions(opts: { kind?: string; status?: string; q?: string; page?: unknown; userId?: string; method?: string; withStatusCounts?: boolean }) {
  await expireTopups();
  const { txs } = await collections();
  const filter: Filter<TxDoc> = {};
  if (opts.kind && opts.kind !== "all") filter.kind = opts.kind as HistoryKind;
  if (opts.status && opts.status !== "all") filter.status = opts.status as HistoryStatus;
  if (opts.userId) filter.userId = opts.userId;
  if (["promptpay", "truemoney", "truemoney_wallet"].includes(opts.method ?? "")) filter["topup.method"] = opts.method;
  const q = opts.q?.trim();
  if (q) {
    const db = await getDb();
    const users = await db.collection<UserRow>("users").find({ $or: [{ email: { $regex: escapeRe(q.toLowerCase()) } }, { name: { $regex: escapeRe(q), $options: "i" } }] }, { projection: { _id: 1 } }).limit(200).toArray();
    // ค้นด้วยยอดโอน เช่น 200.37 → จับคู่กับสลิป
    const pay = /^\d+(\.\d{1,2})?$/.test(q) ? Math.round(Number(q) * 100) : null;
    filter.$or = [{ _id: { $regex: escapeRe(q.toUpperCase()) } }, { "topup.slipRef": { $regex: escapeRe(q), $options: "i" } }, { userId: { $in: users.map((u) => u._id) } }, ...(pay ? [{ "topup.payAmount": pay }] : [])];
  }
  const summaryFilter = { ...filter };
  delete summaryFilter.status;
  const [total, grouped] = await Promise.all([
    txs.countDocuments(filter),
    opts.withStatusCounts ? txs.aggregate<{ _id: HistoryStatus; count: number }>([{ $match: summaryFilter }, { $group: { _id: "$status", count: { $sum: 1 } } }]).toArray() : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const p = Math.min(page(opts.page), pages);
  const docs = await txs.find(filter).sort({ createdAt: -1, _id: -1 }).skip((p - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray();
  const emails = await emailsFor(docs.map((d) => d.userId));
  const counts = { all: 0, pending: 0, completed: 0, failed: 0 };
  for (const row of grouped) {
    if (row._id === "pending" || row._id === "completed" || row._id === "failed") { counts[row._id] = row.count; counts.all += row.count; }
  }
  return { rows: docs.map((d) => toRow(d, emails)), total, page: p, pages, counts };
}

export async function rejectTopup(id: string, by: string) {
  const { txs } = await collections();
  const r = await txs.updateOne(
    { _id: id, kind: "topup", status: "pending" },
    { $set: { status: "failed", "topup.failReason": "rejected", "topup.rejectedBy": by, description: "PromptPay · ไม่พบยอดโอน", note: "ผู้ดูแลตรวจไม่พบยอดโอนที่ตรงกัน รายการนี้ไม่มีการตัดยอด หากโอนแล้วกรุณาติดต่อแอดมิน", updatedAt: new Date() } },
  );
  if (!r.modifiedCount) throw new UserError("ไม่พบคำสั่งเติมที่รอยืนยัน");
}

export type UserListRow = { id: string; name: string; email: string; image?: string | null; providers: string[]; admin: boolean; createdAt: string; balance: number; transferable: number; bonus: number };

export async function listUsers(opts: { q?: string; page?: unknown; role?: string; provider?: string; sort?: string }) {
  const db = await getDb();
  const users = db.collection<UserRow>("users");
  const q = opts.q?.trim();
  const filter: Filter<UserRow> = q ? { $or: [{ email: { $regex: escapeRe(q.toLowerCase()) } }, { name: { $regex: escapeRe(q), $options: "i" } }, { _id: q }] } : {};
  const admins = envAdmins();
  const adminFilter: Filter<UserRow> = { $or: [{ role: "admin" }, { email: { $in: admins } }] };
  if (opts.role === "admin") filter.$and = [adminFilter];
  else if (opts.role === "member") filter.$nor = [adminFilter];
  if (opts.provider === "google" || opts.provider === "credentials") filter.providers = opts.provider;
  const [total, summaryRows] = await Promise.all([
    users.countDocuments(filter),
    users.aggregate<{ total: number; admins: number; google: number }>([
      { $group: { _id: null, total: { $sum: 1 }, admins: { $sum: { $cond: [{ $or: [{ $eq: ["$role", "admin"] }, { $in: ["$email", admins] }] }, 1, 0] } }, google: { $sum: { $cond: [{ $in: ["google", { $ifNull: ["$providers", []] }] }, 1, 0] } } } },
    ]).toArray(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const p = Math.min(page(opts.page), pages);
  const sort = opts.sort === "oldest" ? { createdAt: 1 as const, _id: 1 as const } : opts.sort === "name" ? { name: 1 as const, _id: 1 as const } : { createdAt: -1 as const, _id: -1 as const };
  const docs = await
    users.aggregate<UserRow & { wallet?: { transferable: number; bonus: number } }>([
      { $match: filter }, { $sort: sort }, { $skip: (p - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE },
      { $lookup: { from: "wallets", localField: "_id", foreignField: "_id", as: "wallet" } }, { $set: { wallet: { $first: "$wallet" } } },
    ]).toArray();
  const rows: UserListRow[] = docs.map((u) => {
    const w = toSnapshot({ transferable: u.wallet?.transferable ?? 0, bonus: u.wallet?.bonus ?? 0 });
    return { id: u._id, name: u.name, email: u.email, image: u.image, providers: u.providers, admin: u.role === "admin" || admins.includes(u.email), createdAt: u.createdAt.toISOString(), ...w };
  });
  return { rows, total, page: p, pages, summary: summaryRows[0] ?? { total: 0, admins: 0, google: 0 } };
}

export async function getUserDetail(id: string) {
  const db = await getDb();
  const u = await db.collection<UserRow>("users").findOne({ _id: id });
  if (!u) return null;
  const wallet = toSnapshot(await getWalletUnits(id));
  return {
    id: u._id, name: u.name, email: u.email, image: u.image, providers: u.providers, createdAt: u.createdAt.toISOString(),
    admin: u.role === "admin" || envAdmins().includes(u.email), adminFromEnv: envAdmins().includes(u.email), roleAdmin: u.role === "admin", wallet,
  };
}

/** ผู้ดูแลเพิ่ม/ลดเครดิต — บันทึกเป็นรายการ "ปรับยอด" ในประวัติผู้ใช้ */
export async function adjustWallet(userId: string, input: { bucket: unknown; coins: unknown; reason: unknown }, by: string) {
  const bucket: Bucket = input.bucket === "bonus" ? "bonus" : "transferable";
  const coins = Number(input.coins);
  const reason = String(input.reason ?? "").trim().slice(0, 200);
  const amount = toUnits(coins);
  if (!Number.isFinite(coins) || amount === 0 || Math.abs(amount) > toUnits(1_000_000) || Math.abs(fromUnits(amount) - coins) > 1e-9) throw new UserError("กรุณาระบุจำนวนเครดิต (ทศนิยมไม่เกิน 2 ตำแหน่ง)");
  if (reason.length < 3) throw new UserError("กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร");
  const db = await getDb();
  if (!(await db.collection<UserRow>("users").findOne({ _id: userId }, { projection: { _id: 1 } }))) throw new UserError("ไม่พบผู้ใช้");
  if (amount > 0) await credit(userId, { [bucket]: amount });
  else if (!(await debitBucket(userId, bucket, -amount))) throw new UserError("ยอดในกระเป๋านี้ไม่พอให้หัก");
  const { txs } = await collections();
  const now = new Date();
  await txs.insertOne({
    _id: newId("AD"), userId, kind: "adjust", status: "completed", amount,
    title: amount > 0 ? "ได้รับเครดิตจากผู้ดูแล" : "ผู้ดูแลหักเครดิต",
    description: bucket === "bonus" ? "เครดิตโบนัส" : "เครดิตที่โอนได้", note: reason,
    createdAt: now, updatedAt: now, adjust: { bucket, by },
  });
}

export async function setAdminRole(userId: string, admin: boolean, by: string) {
  const db = await getDb();
  const users = db.collection<UserRow>("users");
  const u = await users.findOne({ _id: userId });
  if (!u) throw new UserError("ไม่พบผู้ใช้");
  if (!admin && normalizeEmail(u.email) === normalizeEmail(by)) throw new UserError("ถอดสิทธิ์แอดมินของตัวเองไม่ได้");
  await users.updateOne({ _id: userId }, admin ? { $set: { role: "admin", roleGrantedBy: by, roleGrantedAt: new Date() } } : { $unset: { role: "", roleGrantedBy: "", roleGrantedAt: "" } });
}

export type AdminRow = {
  id: string | null; name: string; email: string; image?: string | null;
  source: "env" | "db" | "both"; hasAccount: boolean; hasPassword: boolean; providers: string[];
  grantedBy?: string; grantedAt?: string; lastLoginAt?: string; createdAt?: string;
};

/** แอดมินทั้งหมด: จาก ADMIN_EMAILS (อาจยังไม่มีบัญชี) + role ในฐานข้อมูล */
export async function listAdmins(): Promise<AdminRow[]> {
  const db = await getDb();
  const env = envAdmins();
  const docs = await db.collection<UserRow>("users").find({ $or: [{ role: "admin" }, { email: { $in: env } }] }).sort({ createdAt: 1 }).toArray();
  const rows: AdminRow[] = docs.map((u) => {
    const inEnv = env.includes(u.email);
    return {
      id: u._id, name: u.name, email: u.email, image: u.image, source: inEnv && u.role === "admin" ? "both" : inEnv ? "env" : "db",
      hasAccount: true, hasPassword: Boolean(u.passwordHash), providers: u.providers,
      grantedBy: u.roleGrantedBy, grantedAt: u.roleGrantedAt?.toISOString(), lastLoginAt: u.lastLoginAt?.toISOString(), createdAt: u.createdAt.toISOString(),
    };
  });
  for (const email of env) if (!docs.some((u) => u.email === email)) rows.push({ id: null, name: email.split("@")[0], email, source: "env", hasAccount: false, hasPassword: false, providers: [] });
  return rows;
}

const checkPassword = (pw: string) => {
  if (pw.length < PASSWORD_MIN) throw new UserError(`รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN} ตัวอักษร`);
  if (pw.length > 128) throw new UserError("รหัสผ่านยาวเกินไป");
};

/**
 * เพิ่มแอดมิน: มีบัญชีอยู่แล้ว → ให้สิทธิ์ (ถ้ายังไม่มีรหัสผ่านและกรอกมา จะตั้งให้ด้วย)
 * ยังไม่มีบัญชี → สร้างบัญชีใหม่ด้วยชื่อ + รหัสผ่าน แล้วให้สิทธิ์
 */
export async function addAdmin(input: { email: unknown; name?: unknown; password?: unknown }, by: string) {
  const email = normalizeEmail(String(input.email ?? ""));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserError("กรุณากรอกอีเมลให้ถูกต้อง");
  const name = String(input.name ?? "").trim();
  const password = String(input.password ?? "");
  const db = await getDb();
  const existing = await db.collection<UserRow>("users").findOne({ email });
  if (existing) {
    if (existing.role === "admin") throw new UserError("บัญชีนี้เป็นแอดมินอยู่แล้ว");
    if (password && !existing.passwordHash) { checkPassword(password); await setPassword(existing._id, password); }
    await setAdminRole(existing._id, true, by);
    return { created: false };
  }
  if (name.length < 2 || name.length > 40) throw new UserError("บัญชีนี้ยังไม่มีในระบบ — กรุณาระบุชื่อ 2–40 ตัวอักษร");
  checkPassword(password);
  try {
    const u = await createPasswordUser({ name, email, password });
    await setAdminRole(u.id, true, by);
  } catch (e) {
    if (e instanceof EmailTakenError) throw new UserError("มีบัญชีนี้แล้ว กรุณาลองใหม่");
    throw e;
  }
  return { created: true };
}

export async function resetAdminPassword(userId: string, password: unknown, by: string) {
  void by;
  const pw = String(password ?? "");
  checkPassword(pw);
  const db = await getDb();
  const u = await db.collection<UserRow>("users").findOne({ _id: userId });
  if (!u) throw new UserError("ไม่พบผู้ใช้");
  if (!(u.role === "admin" || envAdmins().includes(u.email))) throw new UserError("ตั้งรหัสผ่านได้เฉพาะบัญชีแอดมิน");
  await setPassword(userId, pw);
}
