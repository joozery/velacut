"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_TOPUP_CONFIG, quoteTopup, type TopupConfig, type TopupPackage } from "@/lib/topup";
import { formatCoins, formatInt } from "@/lib/format";
import { toast } from "@/stores/toast-store";
import { saveTopupConfigAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

const NO_TAG = "none";
const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring", checked ? "bg-primary" : "bg-surface-3")}>
      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

function NumField({ label, value, onChange, suffix, hint, step = "1" }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; hint?: string; step?: string }) {
  const id = useId();
  const [text, setText] = useState(String(value));
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input id={id} inputMode="decimal" value={text} step={step} onChange={(e) => { const t = e.target.value.replace(/[^\d.]/g, ""); setText(t); onChange(num(t)); }} className={cn("h-10 tabular-nums", suffix && "pr-14")} />
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, desc, action, children }: { title: string; desc?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">{title}</h2>{desc && <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>}</div>{action}</div>
      {children}
    </Card>
  );
}

export function TopupSettingsForm({ initial }: { initial: TopupConfig }) {
  const [saved, setSaved] = useState<TopupConfig>(initial);
  const [cfg, setCfg] = useState<TopupConfig>(initial);
  // key ใหม่เมื่อรีเซ็ต เพื่อให้ช่องกรอกอ่านค่าใหม่
  const [formKey, setFormKey] = useState(0);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(saved), [cfg, saved]);

  const setPkg = (i: number, patch: Partial<TopupPackage>) => setCfg((c) => ({ ...c, packages: c.packages.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const move = (i: number, d: -1 | 1) => setCfg((c) => { const a = [...c.packages]; [a[i], a[i + d]] = [a[i + d], a[i]]; return { ...c, packages: a }; });
  const reset = (to: TopupConfig) => { setCfg(to); setFormKey((k) => k + 1); setError(""); };

  const save = () => start(async () => {
    setError("");
    const r = await saveTopupConfigAction(cfg).catch(() => null);
    if (!r?.ok) {
      setError(r?.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    // ค่าที่ server จัดให้แล้ว (เรียงแพ็กเกจ, id) — รีเซ็ตช่องกรอกให้ตรง
    setSaved(r.data);
    reset(r.data);
    toast({ title: "บันทึกการตั้งค่าแล้ว", description: "หน้าเติมเครดิตใช้ค่าใหม่ทันที", variant: "success" });
  });

  const valid = (n: number) => Number.isFinite(n);
  const preview = (baht: number, bonus: number, first: boolean) => (valid(baht) && valid(cfg.coinPerBaht) && valid(bonus) ? quoteTopup(cfg, baht, bonus, first) : null);

  return (
    <div key={formKey} className="grid gap-4 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid content-start gap-4">
        <Section title="อัตราแลกเปลี่ยน" desc="เครดิตหลักเข้ากระเป๋า 'โอนได้' ส่วนโบนัสแพ็กเกจและโปรเข้ากระเป๋า 'โบนัส'">
          <div className="max-w-xs"><NumField label="เครดิตที่ได้ต่อ 1 บาท" value={cfg.coinPerBaht} onChange={(n) => setCfg({ ...cfg, coinPerBaht: n })} suffix="เครดิต" step="0.01" hint="ปัดเศษเครดิตหลักลงเป็นจำนวนเต็ม" /></div>
        </Section>

        <Section title="แพ็กเกจเติมเครดิต" desc="เรียงตามยอดเงินอัตโนมัติเมื่อบันทึก · ปิดไว้ = ไม่แสดงให้ผู้ใช้เลือก"
          action={<Button size="sm" variant="soft" className="h-8 rounded-lg text-xs" disabled={cfg.packages.length >= 12} onClick={() => setCfg({ ...cfg, packages: [...cfg.packages, { id: `new-${Date.now().toString(36)}`, baht: NaN, bonus: 0, active: true }] })}><Plus aria-hidden />เพิ่มแพ็กเกจ</Button>}>
          <div className="grid gap-2">
            <div className="hidden grid-cols-[2.75rem_1fr_1fr_8rem_5.5rem_7rem] gap-2 px-1 text-[11px] text-muted-foreground md:grid"><span>เปิด</span><span>จ่าย (บาท)</span><span>โบนัส (เครดิต)</span><span>ป้าย</span><span className="text-right">ได้รับ</span><span /></div>
            {cfg.packages.map((p, i) => {
              const q = preview(p.baht, p.bonus, false);
              return (
                <div key={p.id} className={cn("grid grid-cols-2 items-end gap-2 rounded-xl border border-border p-3 md:grid-cols-[2.75rem_1fr_1fr_8rem_5.5rem_7rem] md:items-center md:border-0 md:p-1", p.active === false && "opacity-55")}>
                  <div className="col-span-2 flex items-center gap-2 md:col-span-1"><Switch checked={p.active !== false} onChange={(v) => setPkg(i, { active: v })} label={`เปิดแพ็กเกจที่ ${i + 1}`} /><span className="text-xs text-muted-foreground md:hidden">แพ็กเกจที่ {i + 1}</span></div>
                  <Input aria-label={`แพ็กเกจที่ ${i + 1} จ่ายกี่บาท`} inputMode="numeric" defaultValue={valid(p.baht) ? String(p.baht) : ""} placeholder="บาท" onChange={(e) => setPkg(i, { baht: num(e.target.value.replace(/\D/g, "")) })} className="h-10 tabular-nums" />
                  <Input aria-label={`แพ็กเกจที่ ${i + 1} โบนัสกี่เครดิต`} inputMode="numeric" defaultValue={String(p.bonus)} placeholder="โบนัส" onChange={(e) => setPkg(i, { bonus: num(e.target.value.replace(/\D/g, "")) || 0 })} className="h-10 tabular-nums" />
                  <Select value={p.tag ?? NO_TAG} onValueChange={(v) => setPkg(i, { tag: v === NO_TAG ? undefined : (v as TopupPackage["tag"]) })}>
                    <SelectTrigger aria-label={`ป้ายแพ็กเกจที่ ${i + 1}`} size="sm" className="h-10 w-full rounded-xl text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={NO_TAG}>ไม่มีป้าย</SelectItem><SelectItem value="popular">ยอดนิยม</SelectItem><SelectItem value="best">คุ้มที่สุด</SelectItem></SelectContent>
                  </Select>
                  <p className="text-right text-sm font-semibold tabular-nums">{q ? `${formatInt(q.total)}` : "—"}<span className="ml-1 text-[10px] font-normal text-muted-foreground">เครดิต</span></p>
                  <div className="flex justify-end gap-0.5">
                    <Button size="icon-sm" variant="ghost" aria-label="เลื่อนขึ้น" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp aria-hidden /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label="เลื่อนลง" disabled={i === cfg.packages.length - 1} onClick={() => move(i, 1)}><ArrowDown aria-hidden /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label={`ลบแพ็กเกจที่ ${i + 1}`} className="text-danger" onClick={() => setCfg({ ...cfg, packages: cfg.packages.filter((_, j) => j !== i) })}><Trash2 aria-hidden /></Button>
                  </div>
                </div>
              );
            })}
            {!cfg.packages.length && <p className="py-6 text-center text-sm text-muted-foreground">ยังไม่มีแพ็กเกจ</p>}
          </div>
        </Section>

        <Section title="โปรเติมครั้งแรก" desc="ให้เครดิตโบนัสเพิ่มเป็น % ของเครดิตหลัก เฉพาะการเติมสำเร็จครั้งแรกของแต่ละบัญชี" action={<Switch checked={cfg.firstTopup.enabled} onChange={(v) => setCfg({ ...cfg, firstTopup: { ...cfg.firstTopup, enabled: v } })} label="เปิดโปรเติมครั้งแรก" />}>
          <div className={cn("grid gap-3 sm:grid-cols-2", !cfg.firstTopup.enabled && "pointer-events-none opacity-50")}>
            <NumField label="โบนัสเพิ่ม" value={cfg.firstTopup.bonusPct} onChange={(n) => setCfg({ ...cfg, firstTopup: { ...cfg.firstTopup, bonusPct: n } })} suffix="%" />
            <NumField label="เมื่อเติมตั้งแต่" value={cfg.firstTopup.minBaht} onChange={(n) => setCfg({ ...cfg, firstTopup: { ...cfg.firstTopup, minBaht: n } })} suffix="บาท" />
          </div>
        </Section>

        <Section title="เติมแบบกำหนดยอดเอง" desc="ผู้ใช้พิมพ์ยอดเองได้ (ไม่มีโบนัสแพ็กเกจ)" action={<Switch checked={cfg.custom.enabled} onChange={(v) => setCfg({ ...cfg, custom: { ...cfg.custom, enabled: v } })} label="เปิดเติมแบบกำหนดยอดเอง" />}>
          <div className={cn("grid gap-3 sm:grid-cols-2", !cfg.custom.enabled && "pointer-events-none opacity-50")}>
            <NumField label="ยอดต่ำสุด" value={cfg.custom.minBaht} onChange={(n) => setCfg({ ...cfg, custom: { ...cfg.custom, minBaht: n } })} suffix="บาท" />
            <NumField label="ยอดสูงสุด" value={cfg.custom.maxBaht} onChange={(n) => setCfg({ ...cfg, custom: { ...cfg.custom, maxBaht: n } })} suffix="บาท" />
          </div>
        </Section>

        <Section title="การชำระเงิน">
          <div className="max-w-xs"><NumField label="อายุ QR PromptPay" value={cfg.qrTtlMin} onChange={(n) => setCfg({ ...cfg, qrTtlMin: n })} suffix="นาที" hint="5–120 นาที · หมดเวลาแล้วยอดเศษสตางค์จะถูกปล่อยให้ใช้ซ้ำ" /></div>
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold">ตัวอย่างที่ผู้ใช้เห็น</h2>
          <p className="mt-1 text-xs text-muted-foreground">ผู้ใช้ทั่วไป / เติมครั้งแรก</p>
          <ul className="mt-4 grid gap-2">
            {cfg.packages.filter((p) => p.active !== false && valid(p.baht)).sort((a, b) => a.baht - b.baht).map((p) => {
              const normal = preview(p.baht, p.bonus, false);
              const first = preview(p.baht, p.bonus, true);
              return (
                <li key={p.id} className="flex items-baseline justify-between gap-2 rounded-xl bg-surface-2/60 px-3 py-2 text-sm">
                  <span className="font-semibold tabular-nums">฿{formatInt(p.baht)}</span>
                  <span className="text-right tabular-nums">{normal ? formatInt(normal.total) : "—"}{first && normal && first.total > normal.total && <span className="ml-1.5 text-xs text-primary">/ {formatInt(first.total)}</span>}<span className="ml-1 text-[10px] text-muted-foreground">เครดิต</span></span>
                </li>
              );
            })}
          </ul>
          {cfg.custom.enabled && <p className="mt-3 text-[11px] text-muted-foreground">กำหนดเอง ฿{formatInt(cfg.custom.minBaht || 0)}–{formatInt(cfg.custom.maxBaht || 0)} · 1 บาท = {valid(cfg.coinPerBaht) ? formatCoins(cfg.coinPerBaht) : "—"} เครดิต</p>}
        </Card>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur lg:left-[240px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
          <p className={cn("mr-auto text-xs", error ? "text-danger" : "text-muted-foreground")} role={error ? "alert" : "status"}>{error || (dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : "ค่าตรงกับที่บันทึกไว้")}</p>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => reset(DEFAULT_TOPUP_CONFIG)}><RotateCcw aria-hidden />ค่าเริ่มต้นระบบ</Button>
          <Button variant="outline" size="sm" disabled={pending || !dirty} onClick={() => reset(saved)}>ยกเลิกการแก้ไข</Button>
          <Button size="sm" disabled={pending || !dirty} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึก</Button>
        </div>
      </div>
    </div>
  );
}
