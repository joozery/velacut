import { getPaymentSettingsView } from "@/lib/server/payments";
import { PageTitle, formatDateTime } from "@/components/admin/ui";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";

export const metadata = { title: "ช่องทางชำระเงิน" };

export default async function AdminPayments() {
  const { meta, ...view } = await getPaymentSettingsView();
  return (
    <>
      <PageTitle title="ช่องทางชำระเงิน" desc={meta ? `แก้ไขล่าสุด ${formatDateTime(meta.updatedAt)} โดย ${meta.updatedBy}` : "เชื่อมต่อระบบตรวจสลิปและ TrueMoney เพื่อเติมเครดิตอัตโนมัติ"} />
      <PaymentSettingsForm initial={view} />
    </>
  );
}
