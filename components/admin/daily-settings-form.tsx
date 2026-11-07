"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { Check, Gift, Loader2, RotateCcw, Save, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CoinIcon } from "@/components/shared/coin";
import { DAILY_MAX_DAYS, DEFAULT_DAILY, buildDailyDays, type DailyConfig } from "@/lib/daily";
import { formatCoins, formatCoinsFixed } from "@/lib/format";
import { toast } from "@/stores/toast-store";
import { saveDailyConfigAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-ring", checked ? "bg-primary" : "bg-surface-3")}>
      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

function Num({ label, value, onChange, suffix, id }: { label: string; value: number; onChange: (n: number) => void; suffix?: string; id: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative"><Input id={id} inputMode="decimal" defaultValue={String(value)} onChange={(e) => onChange(num(e.target.value.replace(/[^\d.]/g, "")))} className={cn("h-10 tabular-nums", suffix && "pr-14")} />{suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{suffix}</span>}</div>
    </div>
  );
}

export function DailySettingsForm({ initial, stats }: { initial: DailyConfig; stats: { claims: number; credits: number } }) {
  const id = useId();
  const [saved, setSaved] = useState(initial);
  const [cfg, setCfg] = useState(initial);
  const [gridKey, setGridKey] = useState(0);
  const [gen, setGen] = useState({ length: initial.days.length, base: 0.5, everyN: 7, everyNReward: 3, lastReward: 10 });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(saved), [cfg, saved]);
  const total = cfg.days.reduce((s, d) => s + (Number.isFinite(d.reward) ? d.reward : 0), 0);

  const replace = (next: DailyConfig) => { setCfg(next); setGridKey((k) => k + 1); setError(""); };
  const setDay = (i: number, patch: Partial<DailyConfig["days"][number]>) => setCfg((c) => ({ ...c, days: c.days.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));
  const setLength = (n: number) => {
    if (!Number.isInteger(n) || n < 1 || n > DAILY_MAX_DAYS) return;
    const last = cfg.days[cfg.days.length - 1] ?? { reward: 0.5, highlight: false };
    replace({ ...cfg, days: n <= cfg.days.length ? cfg.days.slice(0, n) : [...cfg.days, ...Array.from({ length: n - cfg.days.length }, () => ({ reward: last.highlight ? 0.5 : last.reward, highlight: false }))] });
  };
  const generate = () => {
    const v = [gen.length, gen.base, gen.everyN, gen.everyNReward, gen.lastReward];
    if (v.some((x) => !Number.isFinite(x) || x < 0) || !Number.isInteger(gen.length) || gen.length < 1 || gen.length > DAILY_MAX_DAYS) return setError(`กรอกตัวเลขให้ครบ (จำนวนวัน 1–${DAILY_MAX_DAYS})`);
    replace({ ...cfg, days: buildDailyDays(gen) });
    toast({ title: "สร้างตารางรางวัลแล้ว", description: "ตรวจดูแล้วกดบันทึก", variant: "success" });
  };

  const save = () => start(async () => {
    setError("");
    const r = await saveDailyConfigAction(cfg).catch(() => null);
    if (!r?.ok) {
      setError(r?.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    setSaved(r.data);
    replace(r.data);
    toast({ title: "บันทึกการตั้งค่าเช็กอินแล้ว", description: "ผู้ใช้เห็นตารางใหม่ทันที", variant: "success" });
  });

  return (
    <div className="grid gap-4 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid content-start gap-4">
        <Card className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div>
            <h2 className="text-sm font-semibold">เปิดใช้เช็กอินรายวัน</h2>
            <p className="mt-1 text-xs text-muted-foreground">{cfg.enabled ? "ผู้ใช้เห็นปุ่มของขวัญมุมขวาล่างและรับรางวัลได้วันละครั้ง (ตัดรอบเที่ยงคืนเวลาไทย)" : "ปิดอยู่ — ซ่อนปุ่มของขวัญ และรับรางวัลไม่ได้"}</p>
          </div>
          <Switch checked={cfg.enabled} onChange={(v) => setCfg({ ...cfg, enabled: v })} label="เปิดใช้เช็กอินรายวัน" />
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">สร้างตารางแบบเร็ว</h2><p className="mt-1 text-xs text-muted-foreground">ตั้งรางวัลทั้งรอบในคลิกเดียว แล้วค่อยปรับรายวันด้านล่าง</p></div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Num id={`${id}-gl`} label="จำนวนวัน" value={gen.length} onChange={(n) => setGen({ ...gen, length: n })} suffix="วัน" />
            <Num id={`${id}-gb`} label="วันปกติ" value={gen.base} onChange={(n) => setGen({ ...gen, base: n })} suffix="เครดิต" />
            <Num id={`${id}-gn`} label="ทุก ๆ" value={gen.everyN} onChange={(n) => setGen({ ...gen, everyN: n })} suffix="วัน" />
            <Num id={`${id}-gr`} label="ได้" value={gen.everyNReward} onChange={(n) => setGen({ ...gen, everyNReward: n })} suffix="เครดิต" />
            <Num id={`${id}-gx`} label="วันสุดท้าย" value={gen.lastReward} onChange={(n) => setGen({ ...gen, lastReward: n })} suffix="เครดิต" />
          </div>
          <Button variant="soft" size="sm" className="mt-3 rounded-lg" onClick={generate}><Wand2 aria-hidden />สร้างตาราง</Button>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="text-sm font-semibold">รางวัลรายวัน</h2><p className="mt-1 text-xs text-muted-foreground">กดไอคอนของขวัญเพื่อตั้งเป็นวันรางวัลใหญ่ · ครบรอบแล้วเริ่มวันที่ 1 ใหม่</p></div>
            <div className="w-32"><Num key={`len-${gridKey}`} id={`${id}-len`} label="วันต่อรอบ" value={cfg.days.length} onChange={setLength} suffix="วัน" /></div>
          </div>
          <ol key={gridKey} className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {cfg.days.map((d, i) => (
              <li key={i} className={cn("flex items-center gap-2 rounded-xl border p-2", d.highlight ? "border-primary/40 bg-primary-soft/40" : "border-border")}>
                <span className="w-9 shrink-0 text-center text-[11px] font-semibold text-muted-foreground tabular-nums">วัน {i + 1}</span>
                <Input aria-label={`รางวัลวันที่ ${i + 1}`} inputMode="decimal" defaultValue={String(d.reward)} onChange={(e) => setDay(i, { reward: num(e.target.value.replace(/[^\d.]/g, "")) })} className="h-9 min-w-0 rounded-lg px-2 text-sm tabular-nums" />
                <button type="button" aria-label={`ตั้งวันที่ ${i + 1} เป็นรางวัลใหญ่`} aria-pressed={d.highlight} onClick={() => setDay(i, { highlight: !d.highlight })} className={cn("grid size-8 shrink-0 place-items-center rounded-lg transition-colors", d.highlight ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-2")}><Gift className="size-4" aria-hidden /></button>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-4 sm:p-5">
          <h2 className="text-sm font-semibold">สรุป</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">รอบละ</dt><dd className="tabular-nums">{cfg.days.length} วัน</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">เครดิตต่อรอบ (ถ้ามาครบ)</dt><dd className="font-semibold tabular-nums">{formatCoinsFixed(total)}</dd></div>
            <div className="flex justify-between border-t border-border pt-2"><dt className="text-muted-foreground">วันนี้มีคนรับแล้ว</dt><dd className="tabular-nums">{stats.claims.toLocaleString("th-TH")} คน</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">แจกไปวันนี้</dt><dd className="tabular-nums">{formatCoinsFixed(stats.credits)} เครดิต</dd></div>
          </dl>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">เครดิตจากเช็กอินเข้ากระเป๋าโบนัส ใช้สร้างป้ายได้ แต่โอนไม่ได้</p>
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold">ตัวอย่างที่ผู้ใช้เห็น</h2>
          <ol className="grid grid-cols-5 gap-1.5">
            {cfg.days.map((d, i) => (
              <li key={i} className={cn("flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-center", i === 0 ? "border-2 border-primary bg-primary-soft" : d.highlight ? "border-border bg-gradient-to-br from-primary-soft to-surface" : "border-border bg-surface")}>
                <span className="text-[9px] font-medium">{i === 0 ? "วันนี้" : i + 1}</span>
                {d.highlight ? <Gift className="size-3.5 text-primary" aria-hidden /> : <CoinIcon className="size-3.5" />}
                <span className="text-[9px] font-semibold tabular-nums">{Number.isFinite(d.reward) ? formatCoins(d.reward) : "—"}</span>
              </li>
            ))}
          </ol>
        </Card>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur lg:left-[240px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
          <p className={cn("mr-auto flex items-center gap-1.5 text-xs", error ? "text-danger" : "text-muted-foreground")} role={error ? "alert" : "status"}>{!error && !dirty && <Check className="size-3.5" aria-hidden />}{error || (dirty ? "มีการแก้ไขที่ยังไม่บันทึก" : "ค่าตรงกับที่บันทึกไว้")}</p>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => replace(DEFAULT_DAILY)}><RotateCcw aria-hidden />ค่าเริ่มต้นระบบ</Button>
          <Button variant="outline" size="sm" disabled={pending || !dirty} onClick={() => replace(saved)}>ยกเลิกการแก้ไข</Button>
          <Button size="sm" disabled={pending || !dirty} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึก</Button>
        </div>
      </div>
    </div>
  );
}
