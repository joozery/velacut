import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { safeCallbackUrl } from "@/lib/auth/schema";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string; passwordChanged?: string }> }) {
  const { callbackUrl: raw, error, passwordChanged } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);
  if (await auth()) redirect(callbackUrl);
  return <AuthForm mode="login" callbackUrl={callbackUrl} urlError={error} googleEnabled={googleEnabled} notice={passwordChanged === "1" ? "บันทึกรหัสผ่านใหม่แล้ว กรุณาเข้าสู่ระบบอีกครั้ง" : undefined} />;
}
