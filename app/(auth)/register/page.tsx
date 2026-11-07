import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, googleEnabled } from "@/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { safeCallbackUrl } from "@/lib/auth/schema";

export const metadata: Metadata = { title: "สมัครสมาชิก" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const { callbackUrl: raw, error } = await searchParams;
  const callbackUrl = safeCallbackUrl(raw);
  if (await auth()) redirect(callbackUrl);
  return <AuthForm mode="register" callbackUrl={callbackUrl} urlError={error} googleEnabled={googleEnabled} />;
}
