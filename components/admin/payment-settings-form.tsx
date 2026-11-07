"use client";

import { useId, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Plug, Plus, Save, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SLIP_ACCOUNT_TYPES, normalizeSlip2GoApiUrl, type PaymentSettingsView, type SlipReceiver } from "@/lib/payments";
import { toast } from "@/stores/toast-store";
import { savePaymentSettingsAction, testSlip2GoAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring", checked ? "bg-primary" : "bg-surface-3")}>
      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

const EMPTY_RECEIVER: SlipReceiver = { accountType: "02001", accountNumber: "", accountNameTH: "", accountNameEN: "" };

export function PaymentSettingsForm({ initial }: { initial: PaymentSettingsView }) {
  const id = useId();
  const [saved, setSaved] = useState(initial);
  const [v, setV] = useState(initial);
  /** undefined = ไม่เปลี่ยน secret */
  const [secret, setSecret] = useState<string | undefined>(undefined);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [testing, startTest] = useTransition();
  const dirty = useMemo(() => secret !== undefined || JSON.stringify(v) !== JSON.stringify(saved), [v, saved, secret]);
  const s = v.slip2go;
  const setSlip = (patch: Partial<typeof s>) => setV((x) => ({ ...x, slip2go: { ...x.slip2go, ...patch } }));
  const setRecv = (i: number, patch: Partial<SlipReceiver>) => setSlip({ receivers: s.receivers.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const save = () => start(async () => {
    setError("");
    const r = await savePaymentSettingsAction({ ...v, slipSecret: secret }).catch(() => null);
    if (!r?.ok) {
      setError(r?.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const next = { ...v, slip2go: { ...v.slip2go, apiUrl: normalizeSlip2GoApiUrl(v.slip2go.apiUrl), hasSecret: secret === undefined ? v.slip2go.hasSecret : !!secret.trim(), secretHint: secret === undefined ? v.slip2go.secretHint : secret.trim() ? `••••${secret.trim().slice(-4)}` : null } };
    setSaved(next); setV(next); setSecret(undefined); setShowSecret(false);
    toast({ title: "บันทึกการตั้งค่าแล้ว", variant: "success" });
  });

  const runTest = () => startTest(async () => {
    setTest(null);
    const r = await testSlip2GoAction(s.apiUrl, secret ?? "").catch(() => null);
    if (!r?.ok) return setTest({ ok: false, text: r?.error ?? "ทดสอบไม่สำเร็จ" });
    setTest({ ok: r.data.ok, text: `${r.data.code} · ${r.data.message}` });
  });

  return (
    <div className="grid gap-4 pb-24 lg:grid-cols-2">
      {/* PromptPay ที่รับเงิน */}
      <Card className="grid gap-4 p-4 sm:p-5 lg:col-span-2">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-16 place-items-center rounded-xl border border-border bg-white p-1.5"><Image src="/images/payments/thai-qr.webp" alt="Thai QR Payment" width={791} height={240} className="h-auto w-full" /></span>
          <div><h2 className="text-sm font-semibold">พร้อมเพย์ที่รับเงิน</h2><p className="mt-0.5 text-xs text-muted-foreground">ใช้สร้าง QR PromptPay จริงพร้อมยอดเงินในหน้าเติมเครดิต · ว่าง = แสดง QR ตัวอย่าง (สแกนจ่ายไม่ได้)</p></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5"><Label htmlFor={`${id}-pp`} className="text-xs">เบอร์มือถือ / เลขบัตรประชาชน / เลขผู้เสียภาษี</Label><Input id={`${id}-pp`} value={v.promptpay.id} inputMode="numeric" maxLength={17} placeholder="08xxxxxxxx หรือ 13 หลัก" onChange={(e) => setV((x) => ({ ...x, promptpay: { ...x.promptpay, id: e.target.value.replace(/[^\d-]/g, "") } }))} className="tabular-nums" /></div>
          <div className="grid gap-1.5"><Label htmlFor={`${id}-ppn`} className="text-xs">ชื่อบัญชี (แสดงให้ผู้ใช้ตรวจก่อนโอน)</Label><Input id={`${id}-ppn`} value={v.promptpay.name} maxLength={80} placeholder="เช่น บจก. เวลคัท" onChange={(e) => setV((x) => ({ ...x, promptpay: { ...x.promptpay, name: e.target.value } }))} /></div>
        </div>
      </Card>

      {/* Slip2Go */}
      <Card className="grid content-start gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-16 place-items-center rounded-xl border border-border bg-white p-1.5"><Image src="/images/payments/promptpay.webp" alt="PromptPay" width={643} height={216} className="h-auto w-full" /></span>
            <div><h2 className="text-sm font-semibold">ตรวจสลิป PromptPay · Slip2Go</h2><p className="mt-0.5 text-xs text-muted-foreground">ผู้ใช้อัปโหลดสลิป → ตรวจยอด/บัญชีผู้รับ/สลิปซ้ำ → เติมเครดิตอัตโนมัติ</p></div>
          </div>
          <Switch checked={s.enabled} onChange={(e) => setSlip({ enabled: e })} label="เปิดใช้ Slip2Go" />
        </div>

        <div className="grid gap-1.5"><Label htmlFor={`${id}-url`} className="text-xs">API URL</Label><Input id={`${id}-url`} value={s.apiUrl} onChange={(e) => setSlip({ apiUrl: e.target.value })} onBlur={() => setSlip({ apiUrl: normalizeSlip2GoApiUrl(s.apiUrl) })} placeholder="https://… (ดูได้ในหน้า API Connect ของ Slip2Go)" spellCheck={false} autoComplete="off" /><p className="text-[11px] text-muted-foreground">ใส่ URL หลักจาก Slip2Go ระบบจะต่อเส้นทาง API ให้เอง หากวาง URL เต็มจะตัด endpoint ออกอัตโนมัติ</p></div>

        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-sec`} className="text-xs">Secret Key</Label>
          {secret === undefined ? (
            <div className="flex items-center gap-2">
              <span className="flex h-11 flex-1 items-center gap-2 rounded-2xl border border-input bg-surface-2/60 px-4 text-sm text-muted-foreground"><KeyRound className="size-4" aria-hidden />{s.hasSecret ? `ตั้งค่าแล้ว ${s.secretHint ?? ""}` : "ยังไม่ได้ตั้งค่า"}</span>
              <Button variant="outline" onClick={() => setSecret("")}>{s.hasSecret ? "เปลี่ยน" : "ตั้งค่า"}</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input id={`${id}-sec`} type={showSecret ? "text" : "password"} value={secret} onChange={(e) => setSecret(e.target.value)} autoComplete="off" spellCheck={false} placeholder={s.hasSecret ? "เว้นว่างแล้วบันทึก = ลบ Secret Key" : "วาง Secret Key จาก Slip2Go"} className="pr-11" />
                <button type="button" onClick={() => setShowSecret((x) => !x)} aria-label={showSecret ? "ซ่อน" : "แสดง"} className="absolute inset-y-0 right-1 my-auto grid size-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground">{showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              </div>
              <Button variant="ghost" onClick={() => { setSecret(undefined); setShowSecret(false); }}>ยกเลิก</Button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">เก็บแบบเข้ารหัส และไม่แสดงกลับมาอีกหลังบันทึก</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="soft" size="sm" className="rounded-lg" disabled={testing} onClick={runTest}>{testing ? <Loader2 className="animate-spin" aria-hidden /> : <Plug aria-hidden />}ทดสอบการเชื่อมต่อ</Button>
          {test && <span role="status" className={cn("inline-flex items-center gap-1 text-xs", test.ok ? "text-success" : "text-danger")}>{test.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}{test.text}</span>}
        </div>

        <div className="grid gap-2 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <div><p className="text-xs font-semibold">บัญชีรับเงินที่ต้องตรงกับสลิป</p><p className="mt-0.5 text-[11px] text-muted-foreground">สลิปผ่านเมื่อตรงกับบัญชีใดบัญชีหนึ่ง · ว่าง = ไม่ตรวจบัญชีผู้รับ (ไม่แนะนำ)</p></div>
            <Button size="sm" variant="outline" className="h-8 shrink-0 rounded-lg text-xs" disabled={s.receivers.length >= 5} onClick={() => setSlip({ receivers: [...s.receivers, EMPTY_RECEIVER] })}><Plus aria-hidden />เพิ่มบัญชี</Button>
          </div>
          {s.receivers.map((r, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">
              <div className="grid gap-1"><Label className="text-[11px]" htmlFor={`${id}-t${i}`}>รหัสประเภทบัญชี</Label><Input id={`${id}-t${i}`} value={r.accountType} list={`${id}-types`} inputMode="numeric" maxLength={5} onChange={(e) => setRecv(i, { accountType: e.target.value.replace(/\D/g, "") })} className="h-10" /></div>
              <div className="grid gap-1"><Label className="text-[11px]" htmlFor={`${id}-n${i}`}>เลขบัญชี / เบอร์พร้อมเพย์</Label><Input id={`${id}-n${i}`} value={r.accountNumber} inputMode="numeric" onChange={(e) => setRecv(i, { accountNumber: e.target.value })} className="h-10" /></div>
              <div className="grid gap-1"><Label className="text-[11px]" htmlFor={`${id}-th${i}`}>ชื่อบัญชี (ไทย ไม่มีคำนำหน้า)</Label><Input id={`${id}-th${i}`} value={r.accountNameTH} onChange={(e) => setRecv(i, { accountNameTH: e.target.value })} className="h-10" /></div>
              <div className="flex items-end gap-2"><div className="grid flex-1 gap-1"><Label className="text-[11px]" htmlFor={`${id}-en${i}`}>ชื่อบัญชี (อังกฤษ)</Label><Input id={`${id}-en${i}`} value={r.accountNameEN} onChange={(e) => setRecv(i, { accountNameEN: e.target.value })} className="h-10" /></div><Button variant="ghost" size="icon" aria-label={`ลบบัญชีที่ ${i + 1}`} className="text-danger" onClick={() => setSlip({ receivers: s.receivers.filter((_, j) => j !== i) })}><Trash2 aria-hidden /></Button></div>
            </div>
          ))}
          <datalist id={`${id}-types`}>{SLIP_ACCOUNT_TYPES.map(([c, l]) => <option key={c} value={c}>{l}</option>)}</datalist>
          <p className="text-[11px] text-muted-foreground">รหัสที่ใช้บ่อย: {SLIP_ACCOUNT_TYPES.map(([c, l]) => `${c} ${l}`).join(" · ")} — รหัสธนาคารอื่นดูในเอกสาร Slip2Go</p>
        </div>
      </Card>

      <Card className="grid content-start gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold">TrueMoney Wallet · โอนแล้วแนบสลิป</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">โอนเข้าเบอร์ร้าน แล้วตรวจสลิปด้วย Slip2Go แยกจากซองอั่งเปา</p></div>
          <Switch checked={v.truemoneyWallet.enabled} onChange={enabled => setV(x => ({ ...x, truemoneyWallet: { ...x.truemoneyWallet, enabled } }))} label="เปิดใช้ TrueMoney Wallet แบบแนบสลิป" />
        </div>
        <div className="grid gap-1.5"><Label htmlFor={`${id}-wallet-mobile`} className="text-xs">เบอร์ Wallet ที่รับโอน</Label><Input id={`${id}-wallet-mobile`} value={v.truemoneyWallet.mobile} inputMode="tel" maxLength={10} placeholder="08xxxxxxxx" onChange={e => setV(x => ({ ...x, truemoneyWallet: { ...x.truemoneyWallet, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) } }))} /></div>
        <div className="grid gap-1.5"><Label htmlFor={`${id}-wallet-name`} className="text-xs">ชื่อบัญชีผู้รับ (ให้ลูกค้าตรวจก่อนโอน)</Label><Input id={`${id}-wallet-name`} value={v.truemoneyWallet.name} maxLength={80} onChange={e => setV(x => ({ ...x, truemoneyWallet: { ...x.truemoneyWallet, name: e.target.value } }))} /></div>
        <p className="text-[11px] leading-5 text-muted-foreground">ต้องเปิด Slip2Go ก่อนใช้งาน ระบบตรวจยอดตรงกับคำสั่งและเบอร์ Wallet นี้ พร้อมเก็บภาพสลิปให้ผู้ดูแลตรวจย้อนหลัง</p>
      </Card>
      {/* TrueMoney */}
      <Card className="grid content-start gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-16 place-items-center rounded-xl border border-border bg-white p-1.5"><Image src="/images/payments/truemoney.webp" alt="TrueMoney" width={220} height={43} className="h-auto w-full" /></span>
            <div><h2 className="text-sm font-semibold">ซองอั่งเปา TrueMoney</h2><p className="mt-0.5 text-xs text-muted-foreground">ผู้ใช้วางลิงก์ซอง → ระบบรับซองเข้าเบอร์ร้าน → เติมเครดิตตามยอดที่ได้จริง</p></div>
          </div>
          <Switch checked={v.truemoney.enabled} onChange={(e) => setV((x) => ({ ...x, truemoney: { ...x.truemoney, enabled: e } }))} label="เปิดใช้ซองอั่งเปา TrueMoney" />
        </div>
        <div className="grid gap-1.5"><Label htmlFor={`${id}-tm`} className="text-xs">เบอร์ TrueMoney Wallet ที่รับเงิน</Label><Input id={`${id}-tm`} value={v.truemoney.mobile} inputMode="tel" maxLength={12} placeholder="08xxxxxxxx" onChange={(e) => setV((x) => ({ ...x, truemoney: { ...x.truemoney, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) } }))} className="max-w-xs tabular-nums" /></div>
        <p className="rounded-xl bg-warning/10 p-3 text-[11px] leading-5 text-foreground">การรับซองใช้ระบบหน้าเว็บของ TrueMoney (ไม่ใช่ API ทางการ) — TrueMoney อาจเปลี่ยนหรือบล็อกได้ทุกเมื่อ ถ้ารับซองไม่สำเร็จ ผู้ใช้จะเห็นข้อความให้ติดต่อแอดมิน และซองยังไม่ถูกรับ</p>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur lg:left-[240px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
          <p className={cn("mr-auto text-xs", error ? "text-danger" : "text-muted-foreground")} role={error ? "alert" : "status"}>{error || (dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : "ค่าตรงกับที่บันทึกไว้")}</p>
          <Button variant="outline" size="sm" disabled={pending || !dirty} onClick={() => { setV(saved); setSecret(undefined); setError(""); }}>ยกเลิกการแก้ไข</Button>
          <Button size="sm" disabled={pending || !dirty} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึก</Button>
        </div>
      </div>
    </div>
  );
}
