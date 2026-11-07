import { getDb } from "@/lib/db/mongo";
import { getTemplatesConfig } from "@/lib/server/templates";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { TemplatesForm } from "@/components/admin/templates-form";

export const metadata = { title: "เทมเพลตป้าย" };

export default async function AdminTemplates() {
  const [config, meta, usage] = await Promise.all([
    getTemplatesConfig(),
    (await getDb()).collection<{ _id: string; updatedAt: Date; updatedBy: string }>("settings").findOne({ _id: "templates" }, { projection: { updatedAt: 1, updatedBy: 1 } }),
    (await getDb()).collection("transactions").aggregate<{ _id: string; n: number }>([{ $match: { kind: "poster", status: "completed" } }, { $group: { _id: "$poster.doc.template", n: { $sum: 1 } } }]).toArray(),
  ]);
  const used = Object.fromEntries(usage.map((u) => [u._id, u.n]));
  return (
    <>
      <PageTitle title="เทมเพลตป้าย" desc={meta ? `แก้ไขล่าสุด ${formatDateTime(meta.updatedAt.toISOString())} โดย ${meta.updatedBy}` : "ยังใช้ค่าเริ่มต้นของระบบ"} />
      <TemplatesForm initial={config} used={used} />
    </>
  );
}
