import { MongoClient, type Db } from "mongodb";

/** เก็บ client ไว้บน globalThis กัน dev hot-reload เปิด connection ซ้ำ */
const g = globalThis as typeof globalThis & { __mongo?: Promise<MongoClient> };

function client() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  g.__mongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 8000 }).connect().catch((e) => {
    g.__mongo = undefined; // ให้ลองต่อใหม่ครั้งถัดไป
    throw e;
  });
  return g.__mongo;
}

export async function getDb(): Promise<Db> {
  return (await client()).db();
}
