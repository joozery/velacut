import { getDb } from "@/lib/db/mongo";

export type SiteStats = { users: number; posters: number };

let cache: { at: number; value: SiteStats } | undefined;
/** นับจริงจากฐานข้อมูล (แคช 5 วินาทีกันคนเข้าเยอะแล้วยิง DB ถี่) */
export async function getSiteStats(): Promise<SiteStats> {
  if (cache && Date.now() - cache.at < 5000) return cache.value;
  const db = await getDb();
  const [users, posters] = await Promise.all([
    db.collection("users").estimatedDocumentCount(),
    db.collection("transactions").countDocuments({ kind: "poster", status: "completed" }),
  ]);
  cache = { at: Date.now(), value: { users, posters } };
  return cache.value;
}
