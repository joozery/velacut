import { getPromo, getSettingsMeta } from "@/lib/server/settings";
import { storageConfigured } from "@/lib/server/storage";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { PromoSettingsForm } from "@/components/admin/promo-settings-form";

export const metadata = { title: "โปรโมชัน" };

export default async function AdminPromo() {
  const [promo, meta] = await Promise.all([getPromo(), getSettingsMeta("promo")]);
  return (
    <>
      <PageTitle title="โปรโมชัน" desc={meta ? `แก้ไขล่าสุด ${formatDateTime(meta.updatedAt)} โดย ${meta.updatedBy}` : "แถบประกาศด้านบนและ modal โปรโมชัน — ยังใช้ค่าเริ่มต้น"} />
      <PromoSettingsForm initial={promo} uploadReady={storageConfigured()} />
    </>
  );
}
