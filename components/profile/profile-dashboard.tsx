"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, Eye, EyeOff, FileImage, History, KeyRound, Loader2, LogOut, Mail, Palette, Save, ShieldCheck, UserRound, Wallet } from "lucide-react";
import type { ProfileInfo } from "@/lib/profile";
import type { WalletSnapshot } from "@/lib/account";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { GoogleMark } from "@/components/icons/google-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useLogout } from "@/components/auth/use-logout";
import { useAccountStore } from "@/stores/account-store";
import { saveProfileNameAction, changeProfilePasswordAction } from "@/app/actions/profile";
import { formatCoinsFixed, formatInt } from "@/lib/format";
import { toast } from "@/stores/toast-store";

const date = (value: string) => new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(value));
const box = "rounded-2xl border border-border bg-surface";

function PasswordField({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return <div className="grid gap-1.5"><Label htmlFor={id} className="text-xs">{label}</Label><div className="relative"><Input id={id} type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} required maxLength={128} className="pr-11" /><button type="button" aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} aria-pressed={show} onClick={() => setShow(v => !v)} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">{show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}</button></div></div>;
}

export function ProfileDashboard({ profile, wallet: initialWallet, posterCount }: { profile: ProfileInfo; wallet: WalletSnapshot; posterCount: number }) {
  const id = useId();
  const router = useRouter();
  const { update } = useSession();
  const { logout, pending: loggingOut } = useLogout();
  const wallet = useAccountStore(s => s.account?.wallet) ?? initialWallet;
  const [name, setName] = useState(profile.name);
  const [savedName, setSavedName] = useState(profile.name);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);
  const [savingName, startName] = useTransition();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, startPassword] = useTransition();
  const busy = savingName || savingPassword || loggingOut;
  const initials = savedName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

  const saveName = (event: React.FormEvent) => {
    event.preventDefault(); setNameError(""); setNameSuccess(false);
    startName(async () => {
      const result = await saveProfileNameAction(name).catch(() => null);
      if (!result?.ok) { setNameError(result?.error ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่"); return; }
      setSavedName(result.data.name); setName(result.data.name); setNameSuccess(true);
      await update().catch(() => null);
      router.refresh();
      toast({ title: "บันทึกชื่อแล้ว", variant: "success" });
    });
  };
  const savePassword = (event: React.FormEvent) => {
    event.preventDefault(); setPasswordError("");
    if (password.length < 8) { setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirm) { setPasswordError("รหัสผ่านทั้งสองช่องไม่ตรงกัน"); return; }
    startPassword(async () => {
      const result = await changeProfilePasswordAction({ current, password, confirm }).catch(() => null);
      if (!result?.ok) { setPasswordError(result?.error ?? "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่"); return; }
      useAccountStore.getState().reset();
      window.location.assign("/login?passwordChanged=1&callbackUrl=%2Fprofile");
    });
  };

  return <div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-8 sm:pt-8">
    <nav aria-label="เส้นทางหน้าโปรไฟล์" className="mb-6 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Link href="/" className="hover:text-primary">หน้าแรก</Link><ChevronRight className="size-3" aria-hidden /><span aria-current="page">โปรไฟล์</span></nav>
    <header className="mb-6"><p className="mb-2 font-mono text-[9px] tracking-[0.18em] text-primary">YOUR ACCOUNT</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">บัญชี<span className="text-primary">ของคุณ</span></h1><p className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">จัดการข้อมูลส่วนตัว ความปลอดภัย และเครดิตในบัญชีเดียว</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <section className={`${box} overflow-hidden`} aria-label="ข้อมูลบัญชี"><div className="h-20 bg-gradient-to-br from-primary/25 via-primary-soft to-surface" /><div className="px-5 pb-5"><Avatar src={profile.image ?? undefined} alt={savedName} fallback={initials} className="-mt-10 size-20 border-4 border-surface text-xl [&>span]:text-xl" /><h2 className="mt-3 break-words text-lg font-bold">{savedName}</h2><p className="mt-1 break-all text-xs text-muted-foreground">{profile.email}</p><div className="mt-4 flex flex-wrap gap-2">{profile.providers.includes("google") && <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px]"><GoogleMark className="size-3" />Google</span>}{profile.hasPassword && <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] text-primary"><Mail className="size-3" aria-hidden />อีเมล</span>}</div><p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden />สมาชิกตั้งแต่ {date(profile.createdAt)}</p>{profile.lastLoginAt && <p className="mt-2 text-[10px] text-muted-foreground">เข้าใช้ล่าสุด {date(profile.lastLoginAt)}</p>}<p className="mt-3 text-[10px] text-muted-foreground">{profile.image ? "รูปโปรไฟล์จากบัญชีที่เชื่อมต่อ" : "รูปโปรไฟล์แสดงอักษรย่อจากชื่อบัญชี"}</p></div></section>
        <section className={`${box} p-2`} aria-label="เมนูบัญชี">{[{ href: "/posters", title: "ป้ายของฉัน", sub: `${formatInt(posterCount)} ป้าย`, icon: FileImage }, { href: "/history", title: "ประวัติรายการ", sub: "เติมเครดิต สร้างป้าย และโอน", icon: History }, { href: "/topup", title: "เติมเครดิต", sub: "เลือกแพ็กเกจและรับโบนัส", icon: Wallet }].map(item => <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-surface-2"><span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary"><item.icon className="size-4" aria-hidden /></span><span className="flex-1"><span className="block text-xs font-semibold">{item.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{item.sub}</span></span><ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary" aria-hidden /></Link>)}</section>
        <section className={`${box} flex items-center justify-between px-4 py-3`}><div className="flex items-center gap-2 text-xs"><Palette className="size-4 text-primary" aria-hidden />ธีมหน้าจอ</div><ThemeToggle /></section>
        <Button variant="ghost" block disabled={busy} onClick={logout} className="text-danger hover:bg-danger-soft"><LogOut aria-hidden />{loggingOut ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}</Button>
      </aside>
      <div className="min-w-0 space-y-5">
        <section className={`${box} p-5 sm:p-6`} aria-labelledby={`${id}-wallet`}><div className="flex items-center justify-between gap-3"><h2 id={`${id}-wallet`} className="flex items-center gap-2 text-sm font-semibold"><Wallet className="size-4 text-primary" aria-hidden />เครดิตของคุณ</h2><Link href="/topup" className="text-xs font-medium text-primary hover:underline">เติมเครดิต ↗</Link></div><p className="mt-5 text-4xl font-bold tracking-tight tabular-nums">{formatCoinsFixed(wallet.balance)} <span className="text-xs font-normal tracking-normal text-muted-foreground">เครดิต</span></p><dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4"><div><dt className="text-[11px] text-muted-foreground">เครดิตที่โอนได้</dt><dd className="mt-1 text-sm font-semibold tabular-nums">{formatCoinsFixed(wallet.transferable)}</dd></div><div><dt className="text-[11px] text-muted-foreground">โบนัส</dt><dd className="mt-1 text-sm font-semibold text-primary tabular-nums">{formatCoinsFixed(wallet.bonus)}</dd></div></dl></section>
        <section className={`${box} p-5 sm:p-6`} aria-labelledby={`${id}-info`}><h2 id={`${id}-info`} className="flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4 text-primary" aria-hidden />ข้อมูลส่วนตัว</h2><form onSubmit={saveName} className="mt-5"><fieldset disabled={busy} className="grid gap-4"><div className="grid gap-1.5"><Label htmlFor={`${id}-name`} className="text-xs">ชื่อที่แสดง</Label><Input id={`${id}-name`} value={name} onChange={e => { setName(e.target.value); setNameSuccess(false); }} autoComplete="nickname" minLength={2} maxLength={40} required aria-invalid={Boolean(nameError)} aria-describedby={nameError ? `${id}-name-error` : `${id}-name-hint`} /><p id={`${id}-name-hint`} className="text-[11px] text-muted-foreground">ใช้แสดงในเมนูบัญชี · 2–40 ตัวอักษร</p></div><div className="grid gap-1.5"><Label htmlFor={`${id}-email`} className="text-xs">อีเมล</Label><Input id={`${id}-email`} value={profile.email} readOnly className="bg-surface-2 text-muted-foreground" /><p className="text-[11px] text-muted-foreground">อีเมลนี้ใช้ระบุบัญชีและเข้าสู่ระบบ</p></div>{nameError && <p id={`${id}-name-error`} role="alert" className="text-xs text-danger">{nameError}</p>}{nameSuccess && <p role="status" className="flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="size-3.5" aria-hidden />บันทึกชื่อใหม่แล้ว</p>}<div className="flex justify-end"><Button type="submit" size="sm" disabled={busy || name.trim() === savedName}>{savingName ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึกชื่อ</Button></div></fieldset></form></section>
        <section className={`${box} p-5 sm:p-6`} aria-labelledby={`${id}-security`}><h2 id={`${id}-security`} className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" aria-hidden />ความปลอดภัย</h2><p className="mt-2 text-xs leading-6 text-muted-foreground">{profile.hasPassword ? "เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบด้วยอีเมล" : "คุณเข้าสู่ระบบด้วย Google สามารถตั้งรหัสผ่านเพื่อเพิ่มวิธีเข้าสู่ระบบด้วยอีเมลได้"}</p><form onSubmit={savePassword} className="mt-5"><fieldset disabled={busy} className="grid gap-4">{profile.hasPassword && <PasswordField id={`${id}-current`} label="รหัสผ่านปัจจุบัน" value={current} onChange={setCurrent} autoComplete="current-password" />}<div className="grid gap-4 sm:grid-cols-2"><PasswordField id={`${id}-password`} label={profile.hasPassword ? "รหัสผ่านใหม่" : "ตั้งรหัสผ่าน"} value={password} onChange={setPassword} autoComplete="new-password" /><PasswordField id={`${id}-confirm`} label="ยืนยันรหัสผ่าน" value={confirm} onChange={setConfirm} autoComplete="new-password" /></div><p className="text-[11px] leading-5 text-muted-foreground">อย่างน้อย 8 ตัวอักษร · เมื่อบันทึกแล้ว ระบบจะออกจากบัญชีทุกอุปกรณ์และให้เข้าสู่ระบบใหม่</p>{passwordError && <p role="alert" className="text-xs text-danger">{passwordError}</p>}<div className="flex justify-end"><Button type="submit" size="sm" disabled={busy || !password || !confirm || (profile.hasPassword && !current)}>{savingPassword ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}{profile.hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}</Button></div></fieldset></form></section>
      </div>
    </div>
  </div>;
}
