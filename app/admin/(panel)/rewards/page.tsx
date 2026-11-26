import { getDb } from "@/lib/db/mongo";
import { getRewardsConfig } from "@/lib/server/rewards";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { RewardsForm } from "@/components/admin/rewards-form";

export const metadata = { title: "ตรารีวอร์ดสกิน" };

export default async function AdminRewards() {
  const [rewards, meta] = await Promise.all([
    getRewardsConfig(),
    (await getDb()).collection<{ _id: string; updatedAt: Date; updatedBy: string }>("settings").findOne({ _id: "rewards" }, { projection: { updatedAt: 1, updatedBy: 1 } }),
  ]);
  return (
    <>
      <PageTitle title="ตรารีวอร์ดสกิน" desc={meta ? `แก้ไขล่าสุด ${formatDateTime(meta.updatedAt.toISOString())} โดย ${meta.updatedBy}` : "ยังใช้ค่าเริ่มต้นของระบบ"} />
      <RewardsForm initial={rewards} />
    </>
  );
}
