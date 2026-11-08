import { MongoServerError } from "mongodb";
import { getCatalog, type Catalog } from "@/lib/catalog";
import { GAME_SLUGS, type GameSlug } from "@/lib/games";
import { MAX_SKINS, MIN_SKINS, payableTotal } from "@/lib/pricing";
import { TEMPLATE_ID_RE } from "@/lib/templates";
import { fromUnits, toUnits } from "@/lib/money";
import { posterSignature, type PosterOrder } from "@/lib/account";
import { RANKS } from "@/lib/ranks";
import type { Decoration, EditorDoc } from "@/stores/editor-store";
import { collections, newId, type TxDoc } from "./collections";
import { debitSpendable } from "./wallet";
import { getTemplatesConfig } from "./templates";
import { isUploadedUrl } from "./media";

export class UserError extends Error {}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown, max = 1e9) => (typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, 0), max) : 0);

function sanitizeDecoration(raw: unknown): Decoration | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const d = raw as Record<string, unknown>;
  const isRank = (v: unknown): v is NonNullable<Decoration["rank"]> => RANKS.some((r) => r.id === v);
  const rank = isRank(d.rank) ? d.rank : undefined;
  const peakRank = isRank(d.peakRank) ? d.peakRank : undefined;
  // แบนเนอร์รับเฉพาะรูปที่อัปโหลดผ่านระบบเรา
  const banner = typeof d.banner === "string" && isUploadedUrl(d.banner, "banners") ? d.banner : undefined;
  return {
    code: str(d.code, 40), heroes: num(d.heroes, 9999), price: num(d.price), winrate: num(d.winrate, 100), matches: num(d.matches),
    down: num(d.down), honor: num(d.honor), tagline: str(d.tagline, 120), accent: /^#[0-9a-f]{6}$/i.test(String(d.accent)) ? String(d.accent) : "#fcd34d",
    coverId: str(d.coverId, 120), ...(rank ? { rank } : {}), ...(peakRank ? { peakRank } : {}), ...(banner ? { banner } : {}),
  };
}

/** ตรวจและทำความสะอาดข้อมูลป้ายจาก client — ราคา/สิทธิ์คำนวณฝั่ง server เท่านั้น */
export function parsePosterInput(game: unknown, rawDoc: unknown, rawCols: unknown, managedCatalog?: Catalog): { game: GameSlug; doc: EditorDoc; cols: number } {
  if (!GAME_SLUGS.includes(game as GameSlug)) throw new UserError("ไม่พบเกมนี้");
  const g = game as GameSlug;
  const d = (rawDoc ?? {}) as Record<string, unknown>;
  const skins = Array.isArray(d.skins) ? d.skins.filter((s): s is string => typeof s === "string") : [];
  const catalog = managedCatalog ?? getCatalog(g);
  const allowed = new Set(catalog.skins.map(s => s.id));
  if (skins.length < MIN_SKINS || skins.length > MAX_SKINS || new Set(skins).size !== skins.length || skins.some((id) => !allowed.has(id))) {
    throw new UserError("กรุณาตรวจรายการสกินก่อนดาวน์โหลด");
  }
  // แบบที่แอดมินสร้างเองมี id ไม่ตายตัว — ตรวจรูปแบบที่นี่ ส่วนการมีอยู่จริง/เปิดอยู่ตรวจตอนซื้อ
  const template = typeof d.template === "string" && TEMPLATE_ID_RE.test(d.template) ? d.template : null;
  if (!template) throw new UserError("ไม่พบแบบป้ายนี้");
  const output = d.output === "watermark" ? "watermark" : "clean";
  const cols = Number(rawCols);
  if (!Number.isInteger(cols) || cols < 1 || cols > MAX_SKINS) throw new UserError("จำนวนคอลัมน์ไม่ถูกต้อง");
  const docCols = typeof d.cols === "number" && Number.isInteger(d.cols) ? d.cols : null;
  const decoration = sanitizeDecoration(d.decoration);
  if (template === "b" && !decoration?.banner) throw new UserError("เทมเพลต B ต้องอัปโหลดแบนเนอร์ของคุณก่อนดาวน์โหลด");
  return { game: g, cols, doc: { skins, cols: docCols, template, output, ...(decoration ? { decoration } : {}) } };
}

export const toPosterOrder = (tx: TxDoc): PosterOrder => ({
  id: tx._id,
  date: tx.createdAt.toISOString(),
  amount: fromUnits(-tx.amount),
  game: tx.poster!.game as GameSlug,
  doc: tx.poster!.doc as EditorDoc,
  cols: tx.poster!.cols,
});

/** ซื้อป้าย: idempotent ตาม signature — ป้ายเดิมไม่ตัดเครดิตซ้ำ */
export async function purchasePoster(userId: string, input: ReturnType<typeof parsePosterInput>): Promise<PosterOrder> {
  const { txs } = await collections();
  const { game, doc, cols } = input;
  const signature = posterSignature(game, doc, cols);
  const existing = await txs.findOne({ userId, kind: "poster", signature });
  if (existing?.status === "completed") return toPosterOrder(existing);
  if (existing) throw new UserError("กำลังดำเนินการรายการนี้อยู่ กรุณาลองใหม่อีกครั้ง");

  // ราคาและการเปิด/ปิดแบบป้ายอ่านจากหลังบ้านทุกครั้ง — ไม่เชื่อราคาจาก client
  const templates = await getTemplatesConfig();
  const tpl = templates[doc.template];
  if (!tpl) throw new UserError("ไม่พบแบบป้ายนี้ กรุณาเลือกแบบอื่น");
  if (!tpl.enabled) throw new UserError("แบบป้ายนี้ปิดให้บริการชั่วคราว กรุณาเลือกแบบอื่น");
  if (tpl.kind === "upload" && !doc.decoration?.banner) throw new UserError("แบบป้ายนี้ต้องอัปโหลดแบนเนอร์ของคุณก่อนดาวน์โหลด");
  const amount = toUnits(payableTotal(doc.skins.length, doc.template, doc.output, templates));
  const now = new Date();
  const templateName = tpl.name;
  const tx: TxDoc = {
    _id: newId("PS"), userId, kind: "poster", status: "pending", amount: -amount,
    title: "สร้างป้าย Mobile Legends",
    description: `${templateName} · ${doc.skins.length} สกิน · ${doc.output === "watermark" ? "มีลายน้ำ" : "ไม่มีลายน้ำ"}`,
    note: amount ? "ค่าจัดสกินและเทมเพลตแบบไม่มีลายน้ำ ดาวน์โหลดป้ายเดิมซ้ำได้ฟรี" : "ดาวน์โหลดฟรีแบบมีลายน้ำ",
    createdAt: now, updatedAt: now, signature, poster: { game, doc, cols, bonusUsed: 0 },
  };
  try {
    await txs.insertOne(tx);
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      const again = await txs.findOne({ userId, kind: "poster", signature });
      if (again?.status === "completed") return toPosterOrder(again);
      throw new UserError("กำลังดำเนินการรายการนี้อยู่ กรุณาลองใหม่อีกครั้ง");
    }
    throw e;
  }

  let bonusUsed = 0;
  if (amount > 0) {
    const used = await debitSpendable(userId, amount);
    if (used === null) {
      await txs.deleteOne({ _id: tx._id, status: "pending" });
      throw new UserError("เครดิตไม่เพียงพอ กรุณาเติมเครดิต หรือเลือกดาวน์โหลดฟรีแบบมีลายน้ำ");
    }
    bonusUsed = used;
  }
  await txs.updateOne({ _id: tx._id }, { $set: { status: "completed", "poster.bonusUsed": bonusUsed, updatedAt: new Date() } });
  return toPosterOrder({ ...tx, status: "completed" });
}
