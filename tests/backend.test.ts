/**
 * ทดสอบ backend กับ MongoDB จริง โดยใช้ฐาน <ชื่อเดิม>_test แยกจากข้อมูลจริง
 * รัน: npm test  (ต้องมี MONGODB_URI ใน .env.local)
 */
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import type { EditorDoc } from "../stores/editor-store";

const base = process.env.MONGODB_URI;
if (!base) throw new Error("MONGODB_URI is required");
delete process.env.ADMIN_EMAILS; // ไม่ให้ค่าจาก .env.local ปนผลทดสอบ
process.env.MONGODB_URI = base.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");

type Mods = {
  catalog: typeof import("../lib/catalog");
  users: typeof import("../lib/auth/user-store");
  col: typeof import("../lib/server/collections");
  wallet: typeof import("../lib/server/wallet");
  poster: typeof import("../lib/server/poster");
  daily: typeof import("../lib/server/daily");
  topup: typeof import("../lib/server/topup");
  transfer: typeof import("../lib/server/transfer");
  account: typeof import("../lib/server/account");
  mongo: typeof import("../lib/db/mongo");
  admin: typeof import("../lib/server/admin");
  settings: typeof import("../lib/server/settings");
  media: typeof import("../lib/server/media");
};
let m: Mods;
let alice: string, bob: string;
const A = "alice@velcut.test", B = "bob@velcut.test";

before(async () => {
  m = {
    catalog: await import("../lib/catalog"), users: await import("../lib/auth/user-store"), col: await import("../lib/server/collections"),
    wallet: await import("../lib/server/wallet"), poster: await import("../lib/server/poster"), daily: await import("../lib/server/daily"),
    topup: await import("../lib/server/topup"), transfer: await import("../lib/server/transfer"), account: await import("../lib/server/account"), mongo: await import("../lib/db/mongo"), admin: await import("../lib/server/admin"), settings: await import("../lib/server/settings"), media: await import("../lib/server/media"),
  };
  const db = await m.mongo.getDb();
  assert.match(db.databaseName, /_test$/, "refusing to run against a non-test database");
});

beforeEach(async () => {
  const db = await m.mongo.getDb();
  await Promise.all(["users", "wallets", "transactions", "settings", "slip_images", "daily_activity", "catalog_heroes", "catalog_skins"].map((c) => db.collection(c).deleteMany({})));
  alice = (await m.users.createPasswordUser({ name: "Alice", email: A, password: "velcut-test-123" })).id;
  bob = (await m.users.createPasswordUser({ name: "Bob", email: B, password: "velcut-test-123" })).id;
});

after(async () => {
  const db = await m.mongo.getDb();
  await Promise.all(["users", "wallets", "transactions", "settings"].map((c) => db.collection(c).deleteMany({})));
  process.exit(0); // ปิด connection pool
});

const doc = (output: "clean" | "watermark" = "clean"): EditorDoc => ({ skins: m.catalog.getCatalog("mlbb").skins.slice(0, 12).map((s) => s.id), cols: null, template: "a", output });
const give = (userId: string, transferable: number, bonus = 0) => m.wallet.credit(userId, { transferable: transferable * 100, bonus: bonus * 100 });
const balance = async (userId: string) => (await m.account.getAccount(userId)).wallet;

test("poster: charges exact server price once, retry reuses the order", async () => {
  await give(alice, 100);
  const input = m.poster.parsePosterInput("mlbb", doc(), 6);
  const [first, second] = await Promise.all([m.poster.purchasePoster(alice, input), m.poster.purchasePoster(alice, input)].map((p) => p.catch((e) => e)));
  const ok = [first, second].filter((r) => !(r instanceof Error));
  assert.ok(ok.length >= 1);
  const third = await m.poster.purchasePoster(alice, input);
  assert.equal(third.amount, 18.6); // 12 × 0.3 + 15
  assert.equal((await balance(alice)).balance, 81.4);
  const acc = await m.account.getAccount(alice);
  assert.equal(acc.paidSignatures.length, 1);
});

test("poster: spends bonus before transferable", async () => {
  await give(alice, 50, 10);
  await m.poster.purchasePoster(alice, m.poster.parsePosterInput("mlbb", doc(), 6));
  const w = await balance(alice);
  assert.equal(w.bonus, 0);
  assert.equal(w.transferable, 41.4);
});

test("poster: insufficient balance changes nothing", async () => {
  await give(alice, 1);
  await assert.rejects(m.poster.purchasePoster(alice, m.poster.parsePosterInput("mlbb", doc(), 6)), /ไม่เพียงพอ/);
  assert.equal((await balance(alice)).balance, 1);
  assert.equal((await m.account.listHistory(alice)).length, 0);
});

test("poster: watermark is free with zero coins", async () => {
  const order = await m.poster.purchasePoster(alice, m.poster.parsePosterInput("mlbb", doc("watermark"), 6));
  assert.equal(order.amount, 0);
  assert.equal((await balance(alice)).balance, 0);
});

test("poster: rejects invalid input", () => {
  const bad = doc(); bad.skins[0] = "missing";
  assert.throws(() => m.poster.parsePosterInput("mlbb", bad, 6), /สกิน/);
  assert.throws(() => m.poster.parsePosterInput("other", doc(), 6), /เกม/);
  assert.throws(() => m.poster.parsePosterInput("mlbb", { ...doc(), template: "zzz" }, 6), /แบบป้าย/);
});

test("daily: once per day, credits bonus", async () => {
  const results = await Promise.allSettled([m.daily.claimDaily(alice), m.daily.claimDaily(alice)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  await assert.rejects(m.daily.claimDaily(alice), /รับรางวัลไปแล้ว/);
  const d = await m.daily.getDaily(alice);
  assert.deepEqual(d, { claimed: 1, claimedToday: true });
  assert.equal((await balance(alice)).bonus, 0.5);
});

test("topup: unique pay amount, confirm credits once with first-topup promo", async () => {
  const t = await m.topup.createTopup(alice, { packageId: "p200" });
  assert.ok(t.payAmount > 200 && t.payAmount < 201);
  assert.equal(t.coins, 255); // 200 + 15 + 20% of 200
  await m.topup.confirmTopup(t.id, "admin@velcut.test");
  await assert.rejects(m.topup.confirmTopup(t.id, "admin@velcut.test"), /ไม่พบ/);
  const w = await balance(alice);
  assert.deepEqual(w, { transferable: 200, bonus: 55, balance: 255 });
  assert.equal((await m.account.getAccount(alice)).firstTopup, false);
  const second = await m.topup.createTopup(alice, { packageId: "p100" });
  assert.equal(second.coins, 105); // no promo the second time
});

test("topup: new order cancels the previous pending one; custom bounds enforced", async () => {
  const a = await m.topup.createTopup(alice, { baht: 300 });
  const b = await m.topup.createTopup(alice, { baht: 300 });
  assert.notEqual(a.id, b.id);
  await assert.rejects(m.topup.confirmTopup(a.id, "admin"), /ไม่พบ/);
  await assert.rejects(m.topup.createTopup(alice, { baht: 5 }), /ระบุยอด/);
  await assert.rejects(m.topup.createTopup(alice, { packageId: "nope" }), /แพ็กเกจ/);
});

test("transfer: only transferable coins move, both sides get history", async () => {
  await give(alice, 30, 20);
  await assert.rejects(m.transfer.transferCoins(alice, A, B, 40), /ไม่เพียงพอ/);
  await assert.rejects(m.transfer.transferCoins(alice, A, A, 1), /ตัวเอง/);
  await assert.rejects(m.transfer.transferCoins(alice, A, "nobody@velcut.test", 1), /ไม่พบบัญชี/);
  await m.transfer.transferCoins(alice, A, B.toUpperCase(), 12.5);
  assert.deepEqual(await balance(alice), { transferable: 17.5, bonus: 20, balance: 37.5 });
  assert.deepEqual(await balance(bob), { transferable: 12.5, bonus: 0, balance: 12.5 });
  assert.equal((await m.account.listHistory(bob))[0].coins, 12.5);
});

test("admin: role check via db role and ADMIN_EMAILS", async () => {
  assert.equal(await m.admin.isAdmin(A), false);
  await m.admin.setAdminRole(alice, true, B);
  assert.equal(await m.admin.isAdmin(A.toUpperCase()), true);
  await assert.rejects(m.admin.setAdminRole(alice, false, A), /ตัวเอง/);
  process.env.ADMIN_EMAILS = ` ${B} `;
  assert.equal(await m.admin.isAdmin(B), true);
  delete process.env.ADMIN_EMAILS;
});

test("admin: adjust wallet writes ledger, never goes negative", async () => {
  await m.admin.adjustWallet(alice, { bucket: "bonus", coins: 10.25, reason: "ชดเชยระบบ" }, "admin@velcut.test");
  assert.deepEqual(await balance(alice), { transferable: 0, bonus: 10.25, balance: 10.25 });
  await assert.rejects(m.admin.adjustWallet(alice, { bucket: "transferable", coins: -1, reason: "ทดสอบหัก" }, "admin"), /ไม่พอ/);
  await assert.rejects(m.admin.adjustWallet(alice, { bucket: "bonus", coins: 5, reason: "" }, "admin"), /เหตุผล/);
  await assert.rejects(m.admin.adjustWallet(alice, { bucket: "bonus", coins: 1.234, reason: "ทศนิยม" }, "admin"), /ทศนิยม/);
  await m.admin.adjustWallet(alice, { bucket: "bonus", coins: -0.25, reason: "แก้ยอด" }, "admin");
  const h = await m.account.listHistory(alice);
  assert.deepEqual(h.map((r) => [r.kind, r.coins]), [["adjust", -0.25], ["adjust", 10.25]]);
});

test("admin: reject pending topup, then it cannot be confirmed; listing finds by pay amount", async () => {
  const t = await m.topup.createTopup(alice, { packageId: "p50" });
  const found = await m.admin.listTransactions({ kind: "topup", q: t.payAmount.toFixed(2) });
  assert.equal(found.rows[0]?.id, t.id);
  await m.admin.rejectTopup(t.id, "admin");
  await assert.rejects(m.admin.rejectTopup(t.id, "admin"), /ไม่พบ/);
  await assert.rejects(m.topup.confirmTopup(t.id, "admin"), /ไม่พบ/);
  assert.equal((await balance(alice)).balance, 0);
  const stats = await m.admin.getStats();
  assert.equal(stats.users, 2);
  assert.equal(stats.pendingTopups, 0);
});

test("admin: add admin creates account or promotes existing; reset password", async () => {
  await assert.rejects(m.admin.addAdmin({ email: "new@velcut.test", name: "", password: "x" }, A), /ชื่อ/);
  await assert.rejects(m.admin.addAdmin({ email: "new@velcut.test", name: "New", password: "short" }, A), /อย่างน้อย/);
  assert.deepEqual(await m.admin.addAdmin({ email: " New@velcut.test ", name: "New Admin", password: "velcut-admin-1" }, A), { created: true });
  const created = await m.users.findUserByEmail("new@velcut.test");
  assert.ok(created && (await m.users.verifyPassword("velcut-admin-1", created.passwordHash!)));
  assert.deepEqual(await m.admin.addAdmin({ email: B }, A), { created: false });
  await assert.rejects(m.admin.addAdmin({ email: B }, A), /แอดมินอยู่แล้ว/);
  const list = await m.admin.listAdmins();
  assert.deepEqual(list.map((a) => a.email).sort(), [B, "new@velcut.test"]);
  assert.equal(list.find((a) => a.email === B)?.grantedBy, A);
  await assert.rejects(m.admin.resetAdminPassword(alice, "velcut-new-123", A), /เฉพาะบัญชีแอดมิน/);
  await m.admin.resetAdminPassword(bob, "velcut-new-123", A);
  const b = await m.users.findUserByEmail(B);
  assert.ok(await m.users.verifyPassword("velcut-new-123", b!.passwordHash!));
  process.env.ADMIN_EMAILS = "ghost@velcut.test";
  assert.ok((await m.admin.listAdmins()).some((a) => a.email === "ghost@velcut.test" && !a.hasAccount));
  delete process.env.ADMIN_EMAILS;
});

test("settings: topup config drives new orders; invalid config rejected", async () => {
  const cfg = await m.settings.getTopupConfig();
  assert.equal(cfg.coinPerBaht, 1); // ค่าเริ่มต้น
  await assert.rejects(m.settings.saveTopupConfig({ ...cfg, coinPerBaht: 0 }, A), /อัตรา/);
  await assert.rejects(m.settings.saveTopupConfig({ ...cfg, custom: { enabled: true, minBaht: 500, maxBaht: 100 } }, A), /ไม่มากกว่า/);
  await assert.rejects(m.settings.saveTopupConfig({ ...cfg, packages: [{ baht: 100, bonus: 0 }, { baht: 100, bonus: 5 }] }, A), /ซ้ำ/);
  await assert.rejects(m.settings.saveTopupConfig({ ...cfg, packages: [], custom: { ...cfg.custom, enabled: false } }, A), /อย่างน้อย/);
  const saved = await m.settings.saveTopupConfig({
    coinPerBaht: 1.5, qrTtlMin: 30,
    packages: [{ id: "big", baht: 300, bonus: 40, tag: "best" }, { baht: 100, bonus: 10 }, { baht: 50, bonus: 0, active: false }],
    firstTopup: { enabled: false, bonusPct: 20, minBaht: 50 },
    custom: { enabled: false, minBaht: 20, maxBaht: 1000 },
  }, A);
  assert.deepEqual(saved.packages.map((p) => p.baht), [50, 100, 300]); // เรียงตามยอด
  const t = await m.topup.createTopup(alice, { packageId: "big" });
  assert.equal(t.coins, 490); // 300 × 1.5 + 40, ปิดโปรเติมครั้งแรก
  assert.ok(new Date(t.expiresAt).getTime() - Date.now() > 29 * 60_000);
  await assert.rejects(m.topup.createTopup(alice, { packageId: "p50" }), /ไม่พบแพ็กเกจ/); // ปิดไว้
  await assert.rejects(m.topup.createTopup(alice, { baht: 200 }), /ปิดการเติมแบบกำหนดยอดเอง/);
  // คำสั่งที่สร้างไปแล้วใช้ราคาเดิม แม้จะเปลี่ยนการตั้งค่าภายหลัง
  await m.settings.saveTopupConfig({ ...saved, coinPerBaht: 1 }, A);
  await m.topup.confirmTopup(t.id, "admin");
  assert.equal((await balance(alice)).balance, 490);
});

test("posters: list newest first with pagination, only own completed posters", async () => {
  const all = m.catalog.getCatalog("mlbb").skins.map((s) => s.id);
  for (let i = 0; i < 14; i++) {
    const d: EditorDoc = { skins: all.slice(i, i + 4), cols: null, template: "none", output: "watermark" };
    await m.poster.purchasePoster(alice, m.poster.parsePosterInput("mlbb", d, 2));
  }
  await m.poster.purchasePoster(bob, m.poster.parsePosterInput("mlbb", doc("watermark"), 6));
  const p1 = await m.account.listPosters(alice, 1);
  assert.equal(p1.total, 14);
  assert.equal(p1.pages, 2);
  assert.equal(p1.posters.length, 12);
  assert.deepEqual(p1.posters[0].doc.skins, all.slice(13, 17)); // ล่าสุดก่อน
  const p2 = await m.account.listPosters(alice, "99"); // เกินหน้าสุดท้าย → หน้าสุดท้าย
  assert.equal(p2.page, 2);
  assert.equal(p2.posters.length, 2);
  assert.equal((await m.account.listPosters(bob, 1)).total, 1);
});

test("promo: validates fields, bumps version on save", async () => {
  const { DEFAULT_PROMO, promoActive } = await import("../lib/promo");
  assert.deepEqual(await m.settings.getPromo(), DEFAULT_PROMO);
  await assert.rejects(m.settings.savePromo({ ...DEFAULT_PROMO, image: "https://evil.example/x.png" }, A), /รูป/);
  await assert.rejects(m.settings.savePromo({ ...DEFAULT_PROMO, ctaHref: "https://evil.example" }, A), /ลิงก์ปุ่ม/);
  await assert.rejects(m.settings.savePromo({ ...DEFAULT_PROMO, barText: "" }, A), /แถบประกาศ/);
  await assert.rejects(m.settings.savePromo({ ...DEFAULT_PROMO, startsAt: "2026-12-02T00:00:00Z", endsAt: "2026-12-01T00:00:00Z" }, A), /หลังวันเริ่ม/);
  const a = await m.settings.savePromo({ ...DEFAULT_PROMO, title: "ใหม่", autoOpen: "once" }, A);
  const b = await m.settings.savePromo({ ...a, version: 999 }, A); // version มาจาก server เท่านั้น
  assert.deepEqual([a.version, b.version, b.title, b.autoOpen], [1, 2, "ใหม่", "once"]);
  assert.equal(promoActive({ ...b, endsAt: "2000-01-01T00:00:00Z" }), false);
  assert.equal(promoActive({ ...b, enabled: false }), false);
  assert.equal(promoActive(b), true);
});

test("media: re-encodes uploads to webp, rejects non-images", async () => {
  const sharp = (await import("sharp")).default;
  const png = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: "#1463e8" } }).png().toBuffer();
  const img = await m.media.processImage(new File([new Uint8Array(png)], "promo.png", { type: "image/png" }));
  assert.deepEqual([img.width, img.height], [1600, 800]); // ย่อให้กว้างสุด 1600
  assert.equal((await sharp(img.data).metadata()).format, "webp");
  await assert.rejects(m.media.processImage(new File(["<svg onload=alert(1)>"], "x.svg", { type: "image/svg+xml" })), /รองรับเฉพาะ/);
  await assert.rejects(m.media.processImage(new File(["not an image"], "x.png", { type: "image/png" })), /อ่านไฟล์รูปไม่ได้/);
  await assert.rejects(m.media.uploadImage(new File([new Uint8Array(png)], "p.png", { type: "image/png" }), "../etc"), /ไม่รู้จัก/);
});

test("media: only URLs from our R2 bucket are accepted as promo images", async () => {
  const saved = { ...process.env };
  try {
    for (const k of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"]) delete process.env[k];
    const png = await (await import("sharp")).default({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).png().toBuffer();
    await assert.rejects(m.media.uploadImage(new File([new Uint8Array(png)], "p.png", { type: "image/png" }), "promo"), /ยังไม่ได้ตั้งค่า/);
    process.env.R2_PUBLIC_URL = "https://cdn.velcut.test/";
    const ok = "https://cdn.velcut.test/promo/2026/11/0b6c6a4e-8a63-4f43-9a35-2f3f7c3f1f0e.webp";
    assert.equal(m.media.isUploadedUrl(ok, "promo"), true);
    assert.equal(m.media.isUploadedUrl("https://evil.test/promo/2026/11/0b6c6a4e-8a63-4f43-9a35-2f3f7c3f1f0e.webp", "promo"), false);
    assert.equal(m.media.isUploadedUrl("https://cdn.velcut.test/promo/../x.webp", "promo"), false);
    const { DEFAULT_PROMO } = await import("../lib/promo");
    assert.equal((await m.settings.savePromo({ ...DEFAULT_PROMO, image: ok }, A)).image, ok);
    await assert.rejects(m.settings.savePromo({ ...DEFAULT_PROMO, image: "/images/../secret.webp" }, A), /รูป/);
  } finally {
    Object.assign(process.env, saved);
  }
});

test("media: real upload to Cloudflare R2", { skip: !process.env.R2_BUCKET && "ยังไม่ได้ตั้งค่า R2 ใน .env.local" }, async () => {
  const png = await (await import("sharp")).default({ create: { width: 64, height: 64, channels: 3, background: "#1463e8" } }).png().toBuffer();
  const up = await m.media.uploadImage(new File([new Uint8Array(png)], "e2e.png", { type: "image/png" }), "promo");
  assert.ok(m.media.isUploadedUrl(up.url, "promo"));
  try {
    const res = await fetch(up.url);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/webp");
  } finally {
    await (await import("../lib/server/storage")).deletePublicObject(up.url); // ไม่ทิ้งไฟล์ทดสอบไว้ใน bucket
  }
});

test("daily settings: custom cycle, wrap-around, disabled, validation", async () => {
  await assert.rejects(m.settings.saveDailyConfig({ enabled: true, days: [] }, A), /1–60/);
  await assert.rejects(m.settings.saveDailyConfig({ enabled: true, days: [{ reward: 1.234 }] }, A), /ทศนิยม/);
  await assert.rejects(m.settings.saveDailyConfig({ enabled: true, days: [{ reward: -1 }] }, A), /0–10,000/);
  await m.settings.saveDailyConfig({ enabled: true, days: [{ reward: 1 }, { reward: 2 }, { reward: 5, highlight: true }] }, A);
  // จำลองว่าเคยรับมาแล้ว 2 วัน (เมื่อวานซืน, เมื่อวาน)
  const { txs } = await m.col.collections();
  const past = (d: string, day: number) => ({ _id: `RW-PAST-${d}`, userId: alice, kind: "reward" as const, status: "completed" as const, amount: 0, title: "", description: "", note: "", createdAt: new Date(), updatedAt: new Date(), rewardDate: d, rewardDay: day });
  await txs.insertMany([past("2000-01-01", 1), past("2000-01-02", 2)]);
  assert.deepEqual(await m.daily.getDaily(alice), { claimed: 2, claimedToday: false });
  assert.deepEqual(await m.daily.claimDaily(alice), { reward: 5, day: 3 }); // วันสุดท้ายของรอบ
  assert.deepEqual(await m.daily.getDaily(alice), { claimed: 3, claimedToday: true });
  // รอบใหม่: ย้ายรายการวันนี้ไปเป็นเมื่อวาน → วันถัดไปต้องเริ่มที่วันที่ 1
  await txs.updateOne({ userId: alice, rewardDate: m.daily.bangkokDate() }, { $set: { rewardDate: "2000-01-04" } });
  assert.deepEqual(await m.daily.claimDaily(alice), { reward: 1, day: 1 });
  await m.settings.saveDailyConfig({ enabled: false, days: [{ reward: 1 }] }, A);
  await assert.rejects(m.daily.claimDaily(bob), /ปิดระบบ/);
});

test("promptpay: EMVCo payload with valid CRC", async () => {
  const pp = await import("../lib/promptpay");
  assert.equal(pp.crc16("123456789"), "29B1"); // CRC-16/CCITT-FALSE check value
  const p = pp.promptPayPayload("081-234-5678", 200.37);
  assert.match(p, /^000201010212/);
  assert.ok(p.includes("0016A0000006770101110113" + "0066812345678"));
  assert.ok(p.includes("5406200.37"));
  assert.equal(p.slice(-4), pp.crc16(p.slice(0, -4)));
  assert.ok(pp.promptPayPayload("1234567890123", 1).includes("02131234567890123"));
  assert.throws(() => pp.promptPayPayload("12345", 1));
});

test("payments: secrets encrypted at rest, never returned", async () => {
  const sec = await import("../lib/server/secrets");
  const pay = await import("../lib/server/payments");
  const enc = sec.encryptSecret("my-secret-key-123");
  assert.equal(sec.decryptSecret(enc), "my-secret-key-123");
  assert.throws(() => sec.decryptSecret(enc.slice(0, -2) + "xx"));
  await assert.rejects(pay.savePaymentSettings({ slip2go: { enabled: true, apiUrl: "https://api.slip.test" } }, A), /Secret Key/);
  await assert.rejects(pay.savePaymentSettings({ slip2go: { apiUrl: "http://insecure.test" } }, A), /https/);
  await assert.rejects(pay.savePaymentSettings({ truemoney: { enabled: true, mobile: "123" } }, A), /10 หลัก/);
  await assert.rejects(pay.savePaymentSettings({ promptpay: { id: "999" } }, A), /พร้อมเพย์/);
  await pay.savePaymentSettings({ promptpay: { id: "0812345678", name: "ร้านทดสอบ" }, slip2go: { enabled: true, apiUrl: "https://api.slip.test/", receivers: [{ accountType: "02001", accountNumber: "081-234-5678" }] }, slipSecret: "super-secret-abcd" }, A);
  const view = await pay.getPaymentSettingsView();
  assert.equal(JSON.stringify(view).includes("super-secret"), false);
  assert.equal(view.slip2go.secretHint, "••••abcd");
  assert.equal(view.slip2go.apiUrl, "https://api.slip.test");
  assert.equal(view.slip2go.receivers[0].accountNumber, "0812345678");
  // บันทึกโดยไม่ส่ง secret → ใช้ค่าเดิม
  await pay.savePaymentSettings({ ...view, slipSecret: undefined }, A);
  assert.equal((await pay.getPaymentSettingsView()).slip2go.hasSecret, true);
  assert.deepEqual(await pay.getPaymentMethods(), { slipEnabled: true, truemoneyEnabled: false, truemoneyWalletEnabled: false, promptpayReady: true });
});

/** แทน fetch ชั่วคราวเพื่อจำลอง Slip2Go / TrueMoney */
async function withFetch(handler: (url: string, init?: RequestInit) => unknown, fn: () => Promise<void>) {
  const real = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => new Response(JSON.stringify(await handler(String(input), init)), { headers: { "content-type": "application/json" } })) as typeof fetch;
  try { await fn(); } finally { globalThis.fetch = real; }
}

test("slip: verified slip auto-credits once; duplicates and wrong amounts rejected", async () => {
  const pay = await import("../lib/server/payments");
  await pay.savePaymentSettings({ promptpay: { id: "0812345678" }, slip2go: { enabled: true, apiUrl: "https://api.slip.test" }, slipSecret: "super-secret-abcd" }, A);
  const t = await m.topup.createTopup(alice, { packageId: "p100" });
  assert.ok(t.qrPayload?.includes(t.payAmount.toFixed(2)));
  const png = await (await import("sharp")).default({ create: { width: 40, height: 60, channels: 3, background: "#fff" } }).png().toBuffer();
  const slip = () => new File([new Uint8Array(png)], "slip.png", { type: "image/png" });
  let calls = 0;
  let amount = t.payAmount;
  await withFetch((url, init) => {
    calls++;
    assert.equal(url, "https://api.slip.test/api/verify-slip/qr-image/info");
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer super-secret-abcd");
    return { code: "200200", message: "Slip is valid", data: { transRef: "TR-001", amount, dateTime: new Date().toISOString(), sender: { account: { name: "นาย ก" } }, receiver: { account: { name: "ร้าน" } } } };
  }, async () => {
    amount = t.payAmount + 1;
    await assert.rejects(m.topup.submitSlip(alice, t.id, slip()), /ยอดเงิน/);
    amount = t.payAmount;
    const r = await m.topup.submitSlip(alice, t.id, slip());
    assert.equal(r.coins, 125);
    assert.equal((await m.topup.submitSlip(alice, t.id, slip())).already, true); // ส่งซ้ำ → ไม่เติมซ้ำ
    const t2 = await m.topup.createTopup(alice, { packageId: "p50" });
    amount = t2.payAmount;
    await assert.rejects(m.topup.submitSlip(alice, t2.id, slip()), /ถูกใช้เติมไปแล้ว/); // transRef เดิม
    await assert.rejects(m.topup.submitSlip(bob, t2.id, slip()), /ไม่พบ/); // คำสั่งของคนอื่น
  });
  assert.equal(calls, 3);
  const archived = await (await import("../lib/server/slip-archive")).listArchivedSlips(t.id);
  assert.equal(archived.length, 2);
  assert.ok(archived.some(r => r.status === "verified"));
  assert.ok(archived.some(r => r.status === "rejected"));
  assert.ok(archived.every(r => !("image" in r)));
  const savedImage = await (await (await import("../lib/server/slip-archive")).slipArchive()).findOne({ _id: archived[0]._id });
  assert.ok(savedImage?.image.buffer.length);
  assert.equal((await balance(alice)).balance, 125);
  await withFetch(() => ({ code: "200501", message: "Slip is Duplicated" }), async () => {
    const t3 = await m.topup.createTopup(bob, { packageId: "p50" });
    await assert.rejects(m.topup.submitSlip(bob, t3.id, slip()), /ถูกใช้ไปแล้ว/);
  });
});

test("truemoney: redeem credits by actual amount, voucher reusable only if redeem failed", async () => {
  const pay = await import("../lib/server/payments");
  await pay.savePaymentSettings({ truemoney: { enabled: true, mobile: "0899999999" } }, A);
  const link = "https://gift.truemoney.com/campaign/?v=abcDEF1234567890";
  await assert.rejects(m.topup.topupWithTrueMoney(alice, "https://evil.test/?v=abc"), /ลิงก์ไม่ถูกต้อง/);
  await withFetch(() => ({ status: { code: "VOUCHER_EXPIRED" } }), async () => {
    await assert.rejects(m.topup.topupWithTrueMoney(alice, link), /หมดอายุ/);
  });
  await withFetch((url, init) => {
    assert.equal(url, "https://gift.truemoney.com/campaign/vouchers/abcDEF1234567890/redeem");
    assert.deepEqual(JSON.parse(String(init?.body)), { mobile: "0899999999", voucher_hash: "abcDEF1234567890" });
    return { status: { code: "SUCCESS" }, data: { my_ticket: { amount_baht: "100.00" } } };
  }, async () => {
    const r = await m.topup.topupWithTrueMoney(alice, link); // ลองใหม่ได้หลังล้มเหลว
    assert.deepEqual(r, { coins: 125, baht: 100 }); // 100 + แพ็กเกจ 5 + โปร 20%
    await assert.rejects(m.topup.topupWithTrueMoney(bob, link), /ถูกใช้เติมไปแล้ว/);
  });
  assert.deepEqual(await balance(alice), { transferable: 100, bonus: 25, balance: 125 });
  const h = await m.account.listHistory(alice);
  assert.equal(h.filter((x) => x.kind === "topup").length, 1);
});

test("finance: Thai day boundaries, settled cash, distinct users and empty days", async () => {
  const { financeRange, getFinanceReport, recordAccountActivity } = await import("../lib/server/finance");
  assert.throws(() => financeRange("2026-02-30", "2026-03-01"), /วันที่เริ่มต้น/);
  assert.throws(() => financeRange("2026-01-01", "2026-12-01"), /93 วัน/);
  assert.throws(() => financeRange("2026-11-03", "2026-11-01"), /วันเริ่มต้น/);
  assert.equal(financeRange("2026-11-01", "2026-11-01").start.toISOString(), "2026-10-31T17:00:00.000Z");
  const { txs } = await m.col.collections();
  const created = new Date("2026-11-01T10:00:00+07:00");
  const completed = new Date("2026-11-02T00:01:00+07:00");
  const topup = (id: string, method: "promptpay" | "truemoney", payAmount: number, status: "completed" | "pending" = "completed") => ({
    _id: id, userId: alice, kind: "topup" as const, status, amount: 10000, title: "", description: "", note: "", createdAt: created, updatedAt: completed, completedAt: completed,
    topup: { method, payAmount, baht: payAmount / 100, coins: 100, bonus: 0, promo: 0, expiresAt: completed },
  });
  await txs.insertMany([topup("FIN-PP", "promptpay", 10037), topup("FIN-TM", "truemoney", 5000), topup("FIN-PENDING", "promptpay", 9901, "pending"), {
    _id: "FIN-POSTER", userId: bob, kind: "poster", status: "completed", amount: -250, signature: "finance-test", title: "", description: "", note: "", createdAt: created, updatedAt: created,
  }]);
  const r = await getFinanceReport("2026-11-01", "2026-11-03");
  assert.equal(r.days.length, 3);
  assert.equal(r.totals.revenue, 150.37);
  assert.equal(r.totals.topups, 2);
  assert.equal(r.totals.payers, 1);
  assert.equal(r.totals.active, 2);
  assert.equal(r.days[0].revenue, 0);
  assert.equal(r.days[0].spent, 2.5);
  assert.equal(r.days[1].promptpay, 100.37);
  assert.equal(r.days[1].truemoney, 50);
  assert.equal(r.days[1].payers, 1);
  assert.equal(r.days[2].active, 0);
  await Promise.all([recordAccountActivity(alice), recordAccountActivity(alice)]);
  assert.equal(await (await m.mongo.getDb()).collection("daily_activity").countDocuments({ userId: alice }), 1);
});

test("truemoney: voucher total is not accepted as the received amount", async () => {
  const pay = await import("../lib/server/payments");
  await pay.savePaymentSettings({ truemoney: { enabled: true, mobile: "0899999999" } }, A);
  await withFetch(() => ({ status: { code: "SUCCESS" }, data: { voucher: { amount_baht: "100" } } }), async () => {
    await assert.rejects(pay.redeemTrueMoneyVoucher("abcDEF1234567890"), /อ่านยอดเงิน/);
  });
});

test("appearance: validates assets, colors and internal links before saving", async () => {
  const { DEFAULT_APPEARANCE } = await import("../lib/appearance");
  const { parseAppearance } = await import("../lib/server/appearance");
  const defaults = structuredClone(DEFAULT_APPEARANCE);
  assert.deepEqual(parseAppearance(defaults), defaults);
  assert.throws(() => parseAppearance({ ...defaults, primaryLight: "red;}body{display:none}" }), /สีต้อง/);
  assert.throws(() => parseAppearance({ ...defaults, logoLight: "https://evil.test/logo.png" }), /รูป/);
  assert.throws(() => parseAppearance({ ...defaults, hero: { ...defaults.hero, background: "/images/../private.png" } }), /รูป/);
  for (const href of ["https://evil.test", "//evil.test", "/\\evil.test", "/\n/evil.test"]) {
    assert.throws(() => parseAppearance({ ...defaults, hero: { ...defaults.hero, ctaHref: href } }), /ลิงก์ปุ่ม/);
  }
  assert.throws(() => parseAppearance({ ...defaults, name: "" }), /ชื่อเว็บ/);
  assert.throws(() => parseAppearance({ ...defaults, sections: { ...defaults.sections, faq: "false" } }), /ส่วนแสดง/);
  assert.throws(() => parseAppearance({ ...defaults, hero: { ...defaults.hero, wordmarkImage: "https://evil.test/x.webp" } }), /ภาพในตัวหนังสือ/);
  // ค่าที่บันทึกก่อนมีช่อง wordmark → ใช้ค่าเริ่มต้น ไม่พัง
  const { wordmarkImage: _w, wordmarkAnimate: _a, ...oldHero } = defaults.hero;
  void _w; void _a;
  const legacy = parseAppearance({ ...defaults, hero: oldHero });
  assert.equal(legacy.hero.wordmarkImage, DEFAULT_APPEARANCE.hero.wordmarkImage);
  assert.equal(legacy.hero.wordmarkAnimate, true);
  assert.equal(parseAppearance({ ...defaults, hero: { ...defaults.hero, wordmarkAnimate: false } }).hero.wordmarkAnimate, false);
});

test("appearance: persists storefront customization with audit metadata", async () => {
  const { DEFAULT_APPEARANCE, foregroundFor } = await import("../lib/appearance");
  const { saveAppearance, getAppearance } = await import("../lib/server/appearance");
  assert.equal(foregroundFor("#ffffff"), "#111114");
  assert.equal(foregroundFor("#000000"), "#ffffff");
  const changed = { ...structuredClone(DEFAULT_APPEARANCE), name: "Test Store", primaryLight: "#228855", sections: { ...DEFAULT_APPEARANCE.sections, stats: false, faq: false } };
  await saveAppearance(changed, A);
  const saved = await getAppearance();
  assert.deepEqual(saved.value, changed);
  assert.equal(saved.meta?.updatedBy, A);
  assert.ok(saved.meta?.updatedAt);
  await assert.rejects(saveAppearance({ ...changed, primaryLight: "invalid" }, B), /สีต้อง/);
  assert.equal((await getAppearance()).value.primaryLight, "#228855");
});

test("wallet-transfer: settings require slip verification and stay separate from gift vouchers", async () => {
  const pay = await import("../lib/server/payments");
  assert.deepEqual((await pay.getPaymentSettingsView()).truemoneyWallet, { enabled: false, mobile: "", name: "" });
  await assert.rejects(m.topup.createTopup(alice, { packageId: "p100", method: "truemoney_wallet" }), /ยังไม่เปิด/);
  await assert.rejects(pay.savePaymentSettings({ truemoneyWallet: { enabled: true, mobile: "123", name: "ร้าน" } }, A), /10 หลัก/);
  await assert.rejects(pay.savePaymentSettings({ truemoneyWallet: { enabled: true, mobile: "0812345678", name: "ร้าน" } }, A), /Slip2Go/);
  await pay.savePaymentSettings({
    slip2go: { enabled: true, apiUrl: "https://api.slip.test" }, slipSecret: "super-secret-abcd",
    truemoney: { enabled: true, mobile: "0899999999" },
    truemoneyWallet: { enabled: true, mobile: "0812345678", name: "ร้านวอลเล็ต" },
  }, A);
  const methods = await pay.getPaymentMethods();
  assert.equal(methods.truemoneyEnabled, true);
  assert.equal(methods.truemoneyWalletEnabled, true);
  const view = await pay.getPaymentSettingsView();
  await pay.savePaymentSettings({ ...view, truemoneyWallet: { ...view.truemoneyWallet, enabled: false } }, A);
  assert.equal((await pay.getPaymentMethods()).truemoneyEnabled, true);
  assert.equal((await pay.getPaymentMethods()).truemoneyWalletEnabled, false);
});

test("wallet-transfer: verifies the ticket receiver, archives slips and credits only once", async () => {
  const pay = await import("../lib/server/payments");
  await pay.savePaymentSettings({
    slip2go: { enabled: true, apiUrl: "https://api.slip.test", receivers: [{ accountType: "02001", accountNumber: "0899999999" }] }, slipSecret: "super-secret-abcd",
    truemoneyWallet: { enabled: true, mobile: "0812345678", name: "ร้านวอลเล็ต" },
  }, A);
  const ticket = await m.topup.createTopup(alice, { packageId: "p100", method: "truemoney_wallet" });
  assert.equal(ticket.method, "truemoney_wallet");
  assert.equal(ticket.qrPayload, null);
  assert.equal(ticket.walletMobile, "0812345678");
  assert.equal(ticket.payeeName, "ร้านวอลเล็ต");
  const view = await pay.getPaymentSettingsView();
  await pay.savePaymentSettings({ ...view, truemoneyWallet: { ...view.truemoneyWallet, mobile: "0822222222" } }, A);
  const png = await (await import("sharp")).default({ create: { width: 40, height: 60, channels: 3, background: "#fff" } }).png().toBuffer();
  const slip = () => new File([new Uint8Array(png)], "wallet.png", { type: "image/png" });
  let rejectReceiver = true;
  let calls = 0;
  await withFetch((url, init) => {
    calls++;
    assert.equal(url, "https://api.slip.test/api/verify-slip/qr-image/info");
    const payload = JSON.parse(String((init?.body as FormData).get("payload")));
    assert.equal(payload.checkDuplicate, true);
    assert.equal(payload.checkCondition, undefined);
    assert.deepEqual(payload.checkReceiver, [{ accountType: "04000", accountNumber: "0812345678" }]);
    assert.deepEqual(payload.checkAmount, { type: "eq", amount: ticket.payAmount.toFixed(2) });
    if (rejectReceiver) return { code: "200401" };
    return { code: "200200", data: { transRef: "TM-SLIP-001", amount: ticket.payAmount, dateTime: new Date().toISOString() } };
  }, async () => {
    await assert.rejects(m.topup.submitSlip(alice, ticket.id, slip()), /บัญชีผู้รับ/);
    assert.equal((await balance(alice)).balance, 0);
    rejectReceiver = false;
    assert.equal((await m.topup.submitSlip(alice, ticket.id, slip())).coins, 125);
    assert.equal((await m.topup.submitSlip(alice, ticket.id, slip())).already, true);
    await assert.rejects(m.topup.submitSlip(bob, ticket.id, slip()), /ไม่พบ/);
  });
  assert.equal(calls, 2);
  assert.equal((await balance(alice)).balance, 125);
  const archive = await (await import("../lib/server/slip-archive")).listArchivedSlips(ticket.id);
  assert.equal(archive.length, 2);
  assert.ok(archive.some(r => r.status === "rejected"));
  assert.ok(archive.some(r => r.status === "verified"));
  const { getFinanceReport } = await import("../lib/server/finance");
  const day = m.daily.bangkokDate();
  const report = await getFinanceReport(day, day);
  assert.equal(report.totals.revenue, ticket.payAmount);
  assert.equal(report.days[0].truemoney, ticket.payAmount);
});

test("profile: safe account fields, own name changes and validation", async () => {
  const { getProfile, saveProfileName } = await import("../lib/server/profile");
  const profile = await getProfile(alice);
  assert.equal(profile.email, A);
  assert.equal(profile.hasPassword, true);
  assert.equal("passwordHash" in profile, false);
  assert.equal("sessionVersion" in profile, false);
  assert.deepEqual(await saveProfileName(alice, "  Alice Updated  "), { name: "Alice Updated" });
  assert.equal((await getProfile(alice)).name, "Alice Updated");
  assert.equal((await getProfile(bob)).name, "Bob");
  assert.equal((await m.users.findUserById(alice))?.email, A);
  await assert.rejects(saveProfileName(alice, " "), /2–40/);
  await assert.rejects(saveProfileName(alice, "x".repeat(41)), /2–40/);
  await assert.rejects(saveProfileName("missing-profile", "New Name"), /ไม่พบบัญชี/);
  assert.equal((await getProfile(alice)).name, "Alice Updated");
});

test("profile: changing a password requires the old password and invalidates old sessions", async () => {
  const { changeProfilePassword } = await import("../lib/server/profile");
  const password = "a-new-password-456";
  await assert.rejects(changeProfilePassword(alice, { current: "wrong", password, confirm: password }), /ปัจจุบันไม่ถูกต้อง/);
  await assert.rejects(changeProfilePassword(alice, { current: "velcut-test-123", password: "short", confirm: "short" }), /8–128/);
  await assert.rejects(changeProfilePassword(alice, { current: "velcut-test-123", password, confirm: "different" }), /ไม่ตรงกัน/);
  await assert.rejects(changeProfilePassword(alice, { current: "velcut-test-123", password: "velcut-test-123", confirm: "velcut-test-123" }), /ต่างจากเดิม/);
  assert.equal((await m.users.findUserById(alice))?.sessionVersion ?? 0, 0);
  await changeProfilePassword(alice, { current: "velcut-test-123", password, confirm: password });
  const updated = await m.users.findUserById(alice);
  assert.equal(updated?.sessionVersion, 1);
  assert.ok(await m.users.verifyPassword(password, updated!.passwordHash!));
  assert.equal(await m.users.verifyPassword("velcut-test-123", updated!.passwordHash!), false);
  assert.ok(await m.users.verifyPassword("velcut-test-123", (await m.users.findUserById(bob))!.passwordHash!));
  assert.equal((await m.users.findUserById(bob))?.sessionVersion ?? 0, 0);
});

test("profile: Google-only account can add a password without exposing credentials", async () => {
  const { getProfile, changeProfilePassword } = await import("../lib/server/profile");
  const user = await m.users.upsertOAuthUser({ provider: "google", email: "google@velcut.test", name: "Google User", image: "https://example.test/avatar.png" });
  assert.equal((await getProfile(user.id)).hasPassword, false);
  await changeProfilePassword(user.id, { current: "", password: "google-password-123", confirm: "google-password-123" });
  const profile = await getProfile(user.id);
  assert.equal(profile.hasPassword, true);
  assert.deepEqual(profile.providers, ["google", "credentials"]);
  assert.equal(profile.image, "https://example.test/avatar.png");
  assert.equal((await m.users.findUserById(user.id))?.sessionVersion, 1);
});

test("profile: concurrent password changes accept only one update", async () => {
  const { changeProfilePassword } = await import("../lib/server/profile");
  const outcomes = await Promise.allSettled(["new-password-first", "new-password-second"].map(password => changeProfilePassword(alice, { current: "velcut-test-123", password, confirm: password })));
  assert.equal(outcomes.filter(r => r.status === "fulfilled").length, 1);
  assert.equal((await m.users.findUserById(alice))?.sessionVersion, 1);
});

test("profile: sessions refresh the saved name and reject tokens from before a password change", async () => {
  const { handlers } = await import("../auth");
  const { encode } = await import("next-auth/jwt");
  const { NextRequest } = await import("next/server");
  const { saveProfileName, changeProfilePassword } = await import("../lib/server/profile");
  assert.ok(process.env.AUTH_SECRET);
  const token = await encode({ token: { sub: alice, email: A, name: "Old Name", provider: "credentials", sessionVersion: 0 }, secret: process.env.AUTH_SECRET!, salt: "authjs.session-token", maxAge: 60 });
  const request = () => new NextRequest("http://localhost:3000/api/auth/session", { headers: { cookie: `authjs.session-token=${token}` } });
  await saveProfileName(alice, "Refreshed Name");
  const before = await handlers.GET(request());
  assert.equal(before.status, 200);
  assert.equal((await before.json()).user.name, "Refreshed Name");
  await changeProfilePassword(alice, { current: "velcut-test-123", password: "new-password-session", confirm: "new-password-session" });
  const after = await handlers.GET(request());
  assert.equal(after.status, 200);
  assert.equal(await after.json(), null);
});

test("transfer: exact decimals and minimum amount are enforced without moving money", async () => {
  await give(alice, 30, 20);
  for (const amount of [0, 0.99, -1, 1.001, Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(m.transfer.transferCoins(alice, A, B, amount), /ขั้นต่ำ/);
  }
  assert.deepEqual(await balance(alice), { transferable: 30, bonus: 20, balance: 50 });
  assert.equal((await balance(bob)).balance, 0);
});

test("transfer: concurrent different transfers cannot overdraw the sender", async () => {
  await give(alice, 10, 20);
  const results = await Promise.allSettled([
    m.transfer.transferCoins(alice, A, B, 7),
    m.transfer.transferCoins(alice, A, B, 7),
  ]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.deepEqual(await balance(alice), { transferable: 3, bonus: 20, balance: 23 });
  assert.equal((await balance(bob)).balance, 7);
});

test("library: admin uploads add heroes and skins accepted by poster checkout", async () => {
  const { saveLibraryItem, getServerCatalog, listLibrary, libraryImage } = await import("../lib/server/catalog");
  const previous = process.env.R2_PUBLIC_URL;
  process.env.R2_PUBLIC_URL = "https://cdn.velcut.test";
  try {
    const image = "https://cdn.velcut.test/catalog/2026/11/0b6c6a4e-8a63-4f43-9a35-2f3f7c3f1f0e.webp";
    await saveLibraryItem("hero", { id: "custom-test-hero", name: "Uploaded Hero", image, active: true }, A);
    await saveLibraryItem("skin", { id: "mlbb-custom-test-skin", heroId: "custom-test-hero", name: "Uploaded Skin", tier: "Grand", image, active: true, label: "Test Series" }, A);
    const catalog = await getServerCatalog();
    assert.ok(catalog.heroById.has("custom-test-hero"));
    assert.ok(catalog.heroes.some(h => h.id === "custom-test-hero"));
    const skin = catalog.skinById.get("mlbb-custom-test-skin")!;
    assert.equal(skin.heroName, "Uploaded Hero");
    assert.equal(skin.label, "Test Series");
    assert.match(skin.image, /^\/api\/catalog\/images\/skin\/mlbb-custom-test-skin\?v=/);
    assert.equal(await libraryImage("skin", skin.id), image);
    assert.equal(await libraryImage("other", skin.id), null);
    const input = { ...doc("watermark"), skins: [skin.id, ...doc().skins.slice(0, 11)] };
    assert.throws(() => m.poster.parsePosterInput("mlbb", input, 4), /สกิน/);
    const validated = m.poster.parsePosterInput("mlbb", input, 4, catalog);
    const order = await m.poster.purchasePoster(alice, validated);
    assert.ok(order.doc.skins.includes(skin.id));
    const listing = await listLibrary({ q: "Uploaded", kind: "skin" });
    assert.equal(listing.rows.length, 1);
    assert.equal(listing.rows[0].uploaded, true);
  } finally { if (previous === undefined) delete process.env.R2_PUBLIC_URL; else process.env.R2_PUBLIC_URL = previous; }
});

test("library: replacing images preserves IDs and hidden records remain available for old posters", async () => {
  const { saveLibraryItem, getServerCatalog } = await import("../lib/server/catalog");
  const old = m.catalog.getCatalog("mlbb").skins[0];
  const previous = process.env.R2_PUBLIC_URL;
  process.env.R2_PUBLIC_URL = "https://cdn.velcut.test";
  try {
    const image = "https://cdn.velcut.test/catalog/2026/11/0b6c6a4e-8a63-4f43-9a35-2f3f7c3f1f0e.webp";
    await saveLibraryItem("skin", { id: old.id, heroId: old.heroId, name: "Replacement", tier: old.tier, image, active: true }, A);
    let catalog = await getServerCatalog();
    assert.equal(catalog.skinById.get(old.id)?.name, "Replacement");
    assert.ok(catalog.skins.some(s => s.id === old.id));
    assert.match(catalog.skinById.get(old.id)!.image, /\/api\/catalog\/images\/skin\//);
    await saveLibraryItem("skin", { id: old.id, heroId: old.heroId, name: "Replacement", tier: old.tier, image, active: false }, A);
    catalog = await getServerCatalog();
    assert.equal(catalog.skins.some(s => s.id === old.id), false);
    assert.ok(catalog.skinById.has(old.id));
    assert.throws(() => m.poster.parsePosterInput("mlbb", doc(), 4, catalog), /สกิน/);
    // A metadata-only edit keeps the existing local image and does not create a broken proxy URL.
    const second = m.catalog.getCatalog("mlbb").skins[1];
    await saveLibraryItem("skin", { id: second.id, heroId: second.heroId, name: "Renamed", tier: second.tier, image: second.image, active: true }, A);
    assert.equal((await getServerCatalog()).skinById.get(second.id)?.image, second.image);
  } finally { if (previous === undefined) delete process.env.R2_PUBLIC_URL; else process.env.R2_PUBLIC_URL = previous; }
});

test("library: rejects untrusted images, invalid tiers and missing heroes", async () => {
  const { saveLibraryItem } = await import("../lib/server/catalog");
  const skin = m.catalog.getCatalog("mlbb").skins[0];
  const input = { id: skin.id, heroId: skin.heroId, name: skin.name, tier: skin.tier, image: skin.image, active: true };
  await assert.rejects(saveLibraryItem("skin", { ...input, image: "https://evil.test/skin.png" }, A), /อัปโหลด/);
  await assert.rejects(saveLibraryItem("skin", { ...input, heroId: "missing-hero" }, A), /ไม่พบฮีโร่/);
  await assert.rejects(saveLibraryItem("skin", { ...input, tier: "invalid-tier" }, A), /ระดับสกิน/);
  await assert.rejects(saveLibraryItem("skin", { ...input, id: "../private" }, A), /รหัส/);
  await assert.rejects(saveLibraryItem("hero", { id: "custom-empty", name: "New Hero", active: true }, A), /อัปโหลด/);
});

test("payments: copied endpoint URLs are normalized before testing and verifying", async () => {
  const { normalizeSlip2GoApiUrl } = await import("../lib/payments");
  const pay = await import("../lib/server/payments");
  assert.equal(normalizeSlip2GoApiUrl(" https://api.slip.test/api/verify-slip/qr-code/info/ "), "https://api.slip.test");
  assert.equal(normalizeSlip2GoApiUrl("https://api.slip.test/api/verify-slip/qr-code/info/api/account/info"), "https://api.slip.test");
  assert.equal(normalizeSlip2GoApiUrl("https://api.slip.test/tenant/api/verify-slip/qr-image/info"), "https://api.slip.test/tenant");
  await pay.savePaymentSettings({ slip2go: { enabled: true, apiUrl: "https://api.slip.test/api/verify-slip/qr-code/info" }, slipSecret: "super-secret-abcd" }, A);
  assert.equal((await pay.getPaymentSettingsView()).slip2go.apiUrl, "https://api.slip.test");
  await withFetch((url) => {
    assert.equal(url, "https://api.slip.test/api/account/info");
    return { code: "200000", message: "OK" };
  }, async () => { assert.equal((await pay.testSlip2Go("https://api.slip.test/api/verify-slip/qr-code/info")).ok, true); });
  // Previously saved full endpoints are fixed when read, without rotating the secret.
  await (await m.mongo.getDb()).collection<{ _id: string; value: unknown }>("settings").updateOne({ _id: "payments" }, { $set: { "value.slip2go.apiUrl": "https://api.slip.test/api/verify-slip/qr-code/info" } });
  await withFetch((url) => {
    assert.equal(url, "https://api.slip.test/api/verify-slip/qr-image/info");
    return { code: "200200", data: { transRef: "NORMALIZED", amount: 100.25 } };
  }, async () => { assert.equal((await pay.verifySlipImage(new File(["test"], "slip.png", { type: "image/png" }), 100.25)).amount, 100.25); });
});
