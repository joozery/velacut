import { Binary } from "mongodb";
import { getDb } from "@/lib/db/mongo";
import { processImage } from "./media";

export type SlipArchiveDoc = {
  _id: string; topupId: string; userId: string; image: Binary;
  createdAt: Date; status: "checking" | "verified" | "rejected";
  error?: string; transRef?: string;
};

export const slipArchive = async () => (await getDb()).collection<SlipArchiveDoc>("slip_images");

/** Private images: served only by the authenticated admin route, never a public CDN. */
export async function archiveSlip(userId: string, topupId: string, file: File) {
  const image = await processImage(file);
  const id = crypto.randomUUID();
  await (await slipArchive()).insertOne({ _id: id, topupId, userId, image: new Binary(image.data), createdAt: new Date(), status: "checking" });
  return id;
}

export async function listArchivedSlips(topupId: string) {
  return (await slipArchive()).find<Omit<SlipArchiveDoc, "image">>({ topupId }, { projection: { image: 0 } }).sort({ createdAt: -1 }).limit(100).toArray();
}
