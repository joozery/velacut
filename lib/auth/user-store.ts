import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { MongoServerError, type Collection } from "mongodb";
import { getDb } from "@/lib/db/mongo";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

type UserDoc = {
  _id: string;
  name: string;
  email: string;
  image?: string | null;
  passwordHash?: string;
  sessionVersion?: number;
  providers: string[];
  role?: "admin";
  roleGrantedBy?: string;
  roleGrantedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredUser = Omit<UserDoc, "_id"> & { id: string };

const toUser = ({ _id, ...rest }: UserDoc): StoredUser => ({ id: _id, ...rest });

let indexed: Promise<unknown> | undefined;
async function users(): Promise<Collection<UserDoc>> {
  const col = (await getDb()).collection<UserDoc>("users");
  indexed ??= col.createIndex({ email: 1 }, { unique: true }).catch((e) => {
    indexed = undefined;
    throw e;
  });
  await indexed;
  return col;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, saltHex, keyHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export async function findUserByEmail(email: string) {
  const doc = await (await users()).findOne({ email: normalizeEmail(email) });
  return doc ? toUser(doc) : null;
}

export async function findUserById(id: string) {
  const doc = await (await users()).findOne({ _id: id });
  return doc ? toUser(doc) : null;
}

export async function updateDisplayName(id: string, name: string) {
  return (await (await users()).updateOne({ _id: id }, { $set: { name, updatedAt: new Date() } })).matchedCount === 1;
}

/** Compare the previous hash so concurrent password changes cannot overwrite each other. */
export async function replaceOwnPassword(id: string, previousHash: string | undefined, password: string) {
  const result = await (await users()).updateOne(
    { _id: id, passwordHash: previousHash ?? { $exists: false } },
    { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() }, $inc: { sessionVersion: 1 }, $addToSet: { providers: "credentials" } },
  );
  return result.matchedCount === 1;
}

export async function userExists(id: string) {
  return Boolean(await (await users()).findOne({ _id: id }, { projection: { _id: 1 } }));
}

/** ตั้งรหัสผ่านใหม่ (ใช้โดยผู้ดูแล) — บัญชี Google จะได้วิธีเข้าด้วยรหัสผ่านเพิ่ม */
export async function setPassword(id: string, password: string) {
  const r = await (await users()).updateOne({ _id: id }, { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() }, $inc: { sessionVersion: 1 }, $addToSet: { providers: "credentials" } });
  return r.matchedCount === 1;
}

export async function touchLastLogin(email: string) {
  await (await users()).updateOne({ email: normalizeEmail(email) }, { $set: { lastLoginAt: new Date() } });
}

export class EmailTakenError extends Error {}

const isDuplicate = (e: unknown) => e instanceof MongoServerError && e.code === 11000;

export async function createPasswordUser(input: { name: string; email: string; password: string }) {
  const col = await users();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  // เคยเข้าด้วย Google (ยังไม่มีรหัสผ่าน) → เพิ่มรหัสผ่านให้บัญชีเดิม
  const linked = await col.findOneAndUpdate(
    { email, passwordHash: { $exists: false } },
    { $set: { passwordHash, updatedAt: now }, $addToSet: { providers: "credentials" } },
    { returnDocument: "after" },
  );
  if (linked) return toUser(linked);

  const doc: UserDoc = { _id: randomUUID(), name: input.name.trim(), email, passwordHash, providers: ["credentials"], createdAt: now, updatedAt: now };
  try {
    await col.insertOne(doc);
  } catch (e) {
    if (isDuplicate(e)) throw new EmailTakenError();
    throw e;
  }
  return toUser(doc);
}

/** Google ยืนยันอีเมลแล้ว จึงผูกเข้าบัญชีอีเมลเดียวกันได้ */
export async function upsertOAuthUser(input: { provider: string; email: string; name?: string | null; image?: string | null }) {
  const col = await users();
  const email = normalizeEmail(input.email);
  const now = new Date();
  const upsert = () =>
    col.findOneAndUpdate(
      { email },
      {
        $addToSet: { providers: input.provider },
        $set: { updatedAt: now, ...(input.image ? { image: input.image } : {}) },
        $setOnInsert: { _id: randomUUID(), email, name: input.name?.trim() || email.split("@")[0], createdAt: now },
      },
      { upsert: true, returnDocument: "after" },
    );
  // upsert พร้อมกัน 2 request อาจชน unique index ครั้งแรก — ลองซ้ำครั้งเดียวพอ
  const doc = await upsert().catch((e) => (isDuplicate(e) ? upsert() : Promise.reject(e)));
  if (!doc) throw new Error("upsertOAuthUser failed");
  return toUser(doc);
}
