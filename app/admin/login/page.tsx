import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/server/admin";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบผู้ดูแล", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  const email = session?.user?.email ?? undefined;
  const admin = email ? await isAdmin(email) : false;
  if (admin && session?.provider === "credentials") redirect("/admin");
  void (await searchParams);
  // ล็อกอินอยู่แล้วแต่เข้าหลังบ้านไม่ได้: ไม่ใช่แอดมิน หรือเป็นแอดมินที่เข้าด้วย Google
  const blocked = email ? (admin ? "password" : "forbidden") : undefined;
  return <AdminLoginForm signedInAs={email} blocked={blocked} />;
}
