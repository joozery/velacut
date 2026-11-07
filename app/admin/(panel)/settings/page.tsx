import { getTopupConfig, getTopupConfigMeta } from "@/lib/server/settings";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { TopupSettingsForm } from "@/components/admin/topup-settings-form";

export const metadata = { title: "ตั้งค่าเครดิต" };

export default async function AdminSettings() {
  const [config, meta] = await Promise.all([getTopupConfig(), getTopupConfigMeta()]);
  return (
    <>
      <PageTitle title="ตั้งค่าเครดิต" desc={meta ? `แก้ไขล่าสุด ${formatDateTime(meta.updatedAt)} โดย ${meta.updatedBy}` : "ยังใช้ค่าเริ่มต้นของระบบ — บันทึกครั้งแรกเพื่อเริ่มปรับ"} />
      <TopupSettingsForm initial={config} />
    </>
  );
}
