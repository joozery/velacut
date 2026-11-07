"use client";

import { useId, useState, useTransition } from "react";
import { Eye, EyeOff, KeyRound, Loader2, ShieldOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PASSWORD_MIN } from "@/lib/auth/schema";
import { toast } from "@/stores/toast-store";
import { addAdminAction, resetAdminPasswordAction, setAdminRoleAction } from "@/app/admin/actions";

function PasswordInput({ id, value, onChange, autoComplete = "new-password" }: { id: string; value: string; onChange: (v: string) => void; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className="pr-12" />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} aria-pressed={show} className="absolute inset-y-0 right-1 my-auto grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground">{show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</button>
    </div>
  );
}

export function AddAdminForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const r = await addAdminAction({ email: email.trim(), name: name.trim(), password }).catch(() => null);
      if (!r?.ok) {
        setError(r?.error ?? "เพิ่มแอดมินไม่สำเร็จ");
        return;
      }
      toast({ title: "เพิ่มแอดมินแล้ว", description: email.trim(), variant: "success" });
      setEmail(""); setName(""); setPassword("");
    });
  };
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3">
      <div className="grid gap-1.5"><Label htmlFor={`${id}-e`}>อีเมล</Label><Input id={`${id}-e`} type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" /></div>
      <div className="grid gap-1.5"><Label htmlFor={`${id}-n`}>ชื่อที่แสดง <span className="font-normal text-muted-foreground">(บัญชีใหม่)</span></Label><Input id={`${id}-n`} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid gap-1.5"><Label htmlFor={`${id}-p`}>รหัสผ่าน <span className="font-normal text-muted-foreground">(บัญชีใหม่ อย่างน้อย {PASSWORD_MIN} ตัว)</span></Label><PasswordInput id={`${id}-p`} value={password} onChange={setPassword} /></div>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <Button type="submit" disabled={pending || !email.trim()}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />}เพิ่มแอดมิน</Button>
    </form>
  );
}

export function AdminRowActions({ userId, name, canRevoke, envLocked, self }: { userId: string; name: string; canRevoke: boolean; envLocked: boolean; self: boolean }) {
  const id = useId();
  const [mode, setMode] = useState<"password" | "revoke" | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const close = () => { if (!pending) { setMode(null); setPassword(""); setError(""); } };
  const run = () => start(async () => {
    setError("");
    const r = await (mode === "password" ? resetAdminPasswordAction(userId, password) : setAdminRoleAction(userId, false)).catch(() => null);
    if (!r?.ok) {
      setError(r?.error ?? "ทำรายการไม่สำเร็จ");
      return;
    }
    toast({ title: mode === "password" ? "ตั้งรหัสผ่านใหม่แล้ว" : "ถอดสิทธิ์แอดมินแล้ว", description: name, variant: "success" });
    setMode(null); setPassword("");
  });
  return (
    <>
      <div className="flex shrink-0 gap-1.5">
        <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={() => setMode("password")}><KeyRound aria-hidden />{self ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}</Button>
        {canRevoke && <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs text-danger" onClick={() => setMode("revoke")}><ShieldOff aria-hidden />ถอดสิทธิ์</Button>}
        {envLocked && !self && <span className="sr-only">ถอดสิทธิ์ไม่ได้ เพราะกำหนดใน ADMIN_EMAILS</span>}
      </div>
      <Dialog open={!!mode} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{mode === "password" ? `ตั้งรหัสผ่านใหม่ให้ ${name}` : `ถอดสิทธิ์แอดมินของ ${name}?`}</DialogTitle>
            <DialogDescription>{mode === "password" ? "รหัสผ่านเดิมจะใช้ไม่ได้ทันที แจ้งรหัสใหม่ให้เจ้าของบัญชีผ่านช่องทางที่ปลอดภัย" : "บัญชีจะยังใช้หน้าเว็บได้ตามปกติ แต่เข้าหลังบ้านไม่ได้อีก"}</DialogDescription>
          </DialogHeader>
          {mode === "password" && <div className="grid gap-1.5"><Label htmlFor={`${id}-pw`}>รหัสผ่านใหม่ (อย่างน้อย {PASSWORD_MIN} ตัว)</Label><PasswordInput id={`${id}-pw`} value={password} onChange={setPassword} /></div>}
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={pending}>ยกเลิก</Button></DialogClose>
            <Button variant={mode === "revoke" ? "danger" : "primary"} disabled={pending || (mode === "password" && password.length < PASSWORD_MIN)} onClick={run}>{pending && <Loader2 className="animate-spin" aria-hidden />}{mode === "password" ? "บันทึกรหัสผ่าน" : "ถอดสิทธิ์"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
