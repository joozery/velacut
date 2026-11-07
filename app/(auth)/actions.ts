"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { EmailTakenError, createPasswordUser } from "@/lib/auth/user-store";
import { safeCallbackUrl, validateCredentials, validateRegister, type FieldErrors } from "@/lib/auth/schema";

export type AuthFormState = { error?: string; fieldErrors?: FieldErrors; values?: { name?: string; email?: string } };

const text = (form: FormData, key: string) => String(form.get(key) ?? "");

async function passwordSignIn(email: string, password: string, redirectTo: string): Promise<AuthFormState | undefined> {
  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (e) {
    // signIn สำเร็จจะ throw redirect ออกไป — จับเฉพาะ AuthError
    if (e instanceof AuthError) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", values: { email } };
    throw e;
  }
}

export async function loginAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = text(form, "email");
  const password = text(form, "password");
  const fieldErrors = validateCredentials(email, password);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values: { email } };
  return (await passwordSignIn(email, password, safeCallbackUrl(form.get("callbackUrl")))) ?? {};
}

export async function registerAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const input = { name: text(form, "name"), email: text(form, "email"), password: text(form, "password"), confirm: text(form, "confirm") };
  const values = { name: input.name, email: input.email };
  const fieldErrors = validateRegister(input);
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };
  try {
    await createPasswordUser(input);
  } catch (e) {
    if (e instanceof EmailTakenError) return { fieldErrors: { email: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบแทน" }, values };
    throw e;
  }
  return (await passwordSignIn(input.email, input.password, safeCallbackUrl(form.get("callbackUrl")))) ?? {};
}

export async function googleAction(form: FormData) {
  await signIn("google", { redirectTo: safeCallbackUrl(form.get("callbackUrl")) });
}

export async function logoutAction() {
  await signOut({ redirect: false });
}
