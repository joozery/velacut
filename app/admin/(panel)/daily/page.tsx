import { getDailyConfig, getSettingsMeta } from "@/lib/server/settings";
import { collections } from "@/lib/server/collections";
import { bangkokDate } from "@/lib/server/daily";
import { fromUnits } from "@/lib/money";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { DailySettingsForm } from "@/components/admin/daily-settings-form";

export const metadata = { title: "เช็กอินรายวัน" };

export default async function AdminDaily() {
  const { txs } = await collections();
  const [config, meta, todayStats] = await Promise.all([
    getDailyConfig(),
    getSettingsMeta("daily"),
    txs.aggregate<{ n: number; sum: number }>([{ $match: { kind: "reward", status: "completed", rewardDate: bangkokDate() } }, { $group: { _id: null, n: { $sum: 1 }, sum: { $sum: "$amount" } } }]).toArray(),
  ]);
  const stats = { claims: todayStats[0]?.n ?? 0, credits: fromUnits(todayStats[0]?.sum ?? 0) };
  return (
    <>
      <PageTitle title="เช็กอินรายวัน" desc={meta ? `แก้ไขล่าสุด ${formatDateTime(meta.updatedAt)} โดย ${meta.updatedBy}` : "ยังใช้ค่าเริ่มต้นของระบบ"} />
      <DailySettingsForm initial={config} stats={stats} />
    </>
  );
}
