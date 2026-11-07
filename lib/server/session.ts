import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "./admin";
import { UserError } from "./poster";

export async function requireUser() {
  const user = (await auth())?.user;
  if (!user?.id || !user.email) throw new UserError("กรุณาเข้าสู่ระบบก่อน");
  return { id: user.id, email: user.email };
}

/** ใช้ใน server action / route: ไม่ใช่แอดมิน → throw */
/** หลังบ้านรับเฉพาะ session ที่ล็อกอินด้วยอีเมล + รหัสผ่าน (ไม่รับ Google) */
const viaPassword = (provider?: string) => provider === "credentials";

export async function requireAdmin() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email || !viaPassword(session?.provider) || !(await isAdmin(user.email))) throw new UserError("ไม่มีสิทธิ์ผู้ดูแล");
  return { id: user.id, email: user.email, name: user.name ?? user.email };
}

/** ใช้ในหน้า admin: ไม่ใช่แอดมิน → พาไปหน้า login แอดมิน */
export async function requireAdminPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.email) redirect("/admin/login");
  if (!(await isAdmin(user.email))) redirect("/admin/login?error=forbidden");
  if (!viaPassword(session?.provider)) redirect("/admin/login?error=password");
  return { id: user.id, email: user.email, name: user.name ?? user.email, image: user.image };
}
