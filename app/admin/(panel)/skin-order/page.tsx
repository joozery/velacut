import { getBaseCatalog, mergeCatalog, orderedSkinIds } from "@/lib/catalog";
import { getCatalogChanges } from "@/lib/server/catalog";
import { requireAdminPage } from "@/lib/server/session";
import { PageTitle } from "@/components/admin/ui";
import { SkinOrderManager } from "@/components/admin/skin-order-manager";

export const metadata = { title: "ลำดับเรียงสกิน" };

export default async function AdminSkinOrder() {
  await requireAdminPage();
  const changes = await getCatalogChanges();
  const catalog = mergeCatalog(getBaseCatalog("mlbb"), changes);
  const ids = orderedSkinIds(catalog.skins, changes.skinOrder);
  const items = ids.map((id) => { const s = catalog.skinById.get(id)!; return { id, name: s.name, hero: s.heroName, tier: s.tier, image: s.image }; });
  return (
    <>
      <PageTitle title="ลำดับเรียงสกิน" desc="จัดลำดับสกินทั้งหมดที่นี่ — เมื่อลูกค้ากดปุ่ม “เรียงสกิน” สกินที่เลือกไว้จะเรียงตามลำดับนี้" />
      <SkinOrderManager initial={items} customized={(changes.skinOrder?.length ?? 0) > 0} />
    </>
  );
}
