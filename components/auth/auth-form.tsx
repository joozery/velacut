"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { useSession } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleMark } from "@/components/icons/google-mark";
import { Input, Label } from "@/components/ui/input";
import { googleAction, loginAction, registerAction, type AuthFormState } from "@/app/(auth)/actions";
import { PASSWORD_MIN } from "@/lib/auth/schema";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";
type FormState = AuthFormState & { staleAction?: boolean };

function isStaleAction(error: unknown) {
  return error instanceof Error && (
    error.name === "UnrecognizedActionError" ||
    /Server Action .+ was not found on the server|Failed to find Server Action/.test(error.message)
  );
}

async function submitCredentials(mode: Mode, previous: FormState, form: FormData): Promise<FormState> {
  try {
    return await (mode === "login" ? loginAction : registerAction)(previous, form);
  } catch (error) {
    if (!isStaleAction(error)) throw error;
    return { staleAction: true, error: "หน้านี้เป็นเวอร์ชันเก่า กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง" };
  }
}

const COPY = {
  login: { title: "ยินดีต้อนรับกลับ", desc: "เข้าสู่ระบบเพื่อสร้างและดาวน์โหลดป้ายของคุณ", submit: "เข้าสู่ระบบ", switchText: "ยังไม่มีบัญชี?", switchLink: "สมัครสมาชิก", switchHref: "/register" },
  register: { title: "สร้างบัญชีใหม่", desc: "สมัครฟรี เก็บประวัติป้ายและเครดิตไว้ในบัญชีเดียว", submit: "สมัครสมาชิก", switchText: "มีบัญชีอยู่แล้ว?", switchLink: "เข้าสู่ระบบ", switchHref: "/login" },
} as const;

/** รหัส error ที่ Auth.js ส่งกลับมาทาง ?error= */
const URL_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "อีเมลนี้ผูกกับวิธีเข้าสู่ระบบอื่นอยู่แล้ว",
  AccessDenied: "ไม่สามารถเข้าสู่ระบบด้วยบัญชีนี้ได้",
  Configuration: "ระบบเข้าสู่ระบบยังตั้งค่าไม่ครบ กรุณาลองใหม่ภายหลัง",
  CredentialsSignin: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
};

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block disabled={pending} className="mt-1 rounded-2xl">
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

function GoogleButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="lg" block disabled={pending || !enabled} className="rounded-2xl text-sm">
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <GoogleMark />}
      ดำเนินการต่อด้วย Google
    </Button>
  );
}


function Field({ name, label, type = "text", autoComplete, error, defaultValue, hint }: { name: string; label: string; type?: string; autoComplete: string; error?: string; defaultValue?: string; hint?: string }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input id={id} name={name} type={isPassword && show ? "text" : type} autoComplete={autoComplete} defaultValue={defaultValue} required aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cn("h-11", isPassword && "pr-12")} />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} aria-pressed={show} className="absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
            {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        )}
      </div>
      {error ? <p id={`${id}-err`} className="text-xs text-danger">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AuthForm({ mode, callbackUrl, urlError, googleEnabled }: { mode: Mode; callbackUrl: string; urlError?: string; googleEnabled: boolean }) {
  const [state, formAction] = useActionState<FormState, FormData>(submitCredentials.bind(null, mode), {});
  const [staleGoogleAction, setStaleGoogleAction] = useState(false);
  const c = COPY[mode];
  const { update } = useSession();
  const updateRef = useRef(update);
  updateRef.current = update;
  // ล็อกอินสำเร็จ server action จะ redirect แบบ soft navigation — SessionProvider ไม่รู้ตัว จึงดึง session ใหม่ตอนออกจากหน้านี้
  useEffect(() => () => void updateRef.current(), []);
  const fe = state.fieldErrors ?? {};
  const error = state.error ?? (urlError ? URL_ERRORS[urlError] ?? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่" : undefined);
  const switchHref = callbackUrl === "/" ? c.switchHref : `${c.switchHref}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>

      {(error || staleGoogleAction) && (
        <div role="alert" className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <p>{staleGoogleAction ? "หน้านี้เป็นเวอร์ชันเก่า กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง" : error}</p>
          {(state.staleAction || staleGoogleAction) && <a href={mode === "login" ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="mt-2 inline-block font-semibold underline">โหลดหน้าใหม่</a>}
        </div>
      )}

      <form action={async (form) => {
        try {
          await googleAction(form);
        } catch (error) {
          if (!isStaleAction(error)) throw error;
          setStaleGoogleAction(true);
        }
      }} className="mt-5">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <GoogleButton enabled={googleEnabled} />
        {!googleEnabled && <p className="mt-2 text-center text-xs text-muted-foreground">ยังไม่ได้ตั้งค่า Google Login (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET)</p>}
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />หรือใช้อีเมล<span className="h-px flex-1 bg-border" /></div>

      <form action={formAction} noValidate className="grid gap-3.5">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {mode === "register" && <Field name="name" label="ชื่อที่แสดง" autoComplete="nickname" error={fe.name} defaultValue={state.values?.name} />}
        <Field name="email" label="อีเมล" type="email" autoComplete="email" error={fe.email} defaultValue={state.values?.email} />
        {mode === "register" ? (
          <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-3">
            <Field name="password" label="รหัสผ่าน" type="password" autoComplete="new-password" error={fe.password} hint={`อย่างน้อย ${PASSWORD_MIN} ตัว`} />
            <Field name="confirm" label="ยืนยันรหัสผ่าน" type="password" autoComplete="new-password" error={fe.confirm} />
          </div>
        ) : (
          <Field name="password" label="รหัสผ่าน" type="password" autoComplete="current-password" error={fe.password} />
        )}
        <Submit>{c.submit}</Submit>
      </form>

      {mode === "register" && <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">การสมัครสมาชิกถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว</p>}
      <p className="mt-5 text-center text-sm text-muted-foreground">{c.switchText} <Link href={switchHref} className="font-semibold text-primary hover:underline">{c.switchLink}</Link></p>
    </div>
  );
}
