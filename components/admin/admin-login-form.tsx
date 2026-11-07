"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { signOut } from "next-auth/react";
import { Eye, EyeOff, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Logo } from "@/components/shared/logo";
import { adminLoginAction, type AdminLoginState } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" block disabled={pending} className="mt-1 rounded-xl">{pending && <Loader2 className="animate-spin" aria-hidden />}เข้าสู่ระบบผู้ดูแล</Button>;
}

export function AdminLoginForm({ signedInAs, blocked }: { signedInAs?: string; blocked?: "forbidden" | "password" }) {
  const [state, action] = useActionState<AdminLoginState, FormData>(adminLoginAction, {});
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)] bg-background px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex items-center justify-center gap-3"><Logo className="[&_img]:h-5" /><span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-secondary-foreground">ADMIN</span></div>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-[0_16px_40px_rgb(17_17_20/0.06)] sm:p-8">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck className="size-6" aria-hidden /></span>
          <h1 className="mt-4 text-xl font-bold tracking-tight">ระบบหลังบ้าน</h1>
          <p className="mt-1 text-sm text-muted-foreground">สำหรับผู้ดูแลเท่านั้น</p>

          {blocked && signedInAs && (
            <div role="alert" className="mt-5 rounded-2xl bg-danger-soft p-4 text-sm text-danger">
              {blocked === "password"
                ? <p>หลังบ้านต้องเข้าด้วยอีเมลและรหัสผ่านเท่านั้น ตอนนี้คุณเข้าสู่ระบบ <strong className="font-semibold break-all">{signedInAs}</strong> ด้วย Google</p>
                : <p>บัญชี <strong className="font-semibold break-all">{signedInAs}</strong> ไม่มีสิทธิ์ผู้ดูแล</p>}
              <Button variant="outline" size="sm" className="mt-3 rounded-lg" onClick={() => signOut({ redirectTo: "/admin/login" })}><LogOut aria-hidden />ออกจากระบบแล้วเข้าด้วยบัญชีอื่น</Button>
            </div>
          )}
          {state.error && <p role="alert" className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">{state.error}</p>}

          {!signedInAs && (
            <form action={action} className="mt-6 grid gap-4">
              <div className="grid gap-1.5"><Label htmlFor={`${id}-email`}>อีเมล</Label><Input id={`${id}-email`} name="email" type="email" autoComplete="username" required defaultValue={state.email} className="h-11" /></div>
              <div className="grid gap-1.5"><Label htmlFor={`${id}-pw`}>รหัสผ่าน</Label>
                <div className="relative"><Input id={`${id}-pw`} name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="h-11 pr-12" />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} aria-pressed={show} className="absolute inset-y-0 right-1 my-auto grid size-10 place-items-center rounded-xl text-muted-foreground hover:text-foreground">{show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</button>
                </div>
              </div>
              <Submit />
            </form>
          )}

        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">ทุกการกระทำในระบบหลังบ้านถูกบันทึกพร้อมอีเมลผู้ดูแล</p>
      </div>
    </main>
  );
}
