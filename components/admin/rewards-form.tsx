"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImageUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MAX_REWARDS, newRewardId, type Reward } from "@/lib/rewards";
import { saveRewardsAction } from "@/app/admin/actions";
import { toast } from "@/stores/toast-store";
import { Card } from "./ui";

function Row({ reward, index, last, onChange, onMove, onRemove }: { reward: Reward; index: number; last: boolean; onChange: (p: Partial<Reward>) => void; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const body = new FormData(); body.set("file", file);
      const res = await fetch("/api/admin/rewards", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      onChange({ image: data.url });
    } catch (e) {
      toast({ title: "อัปโหลดไม่สำเร็จ", description: e instanceof Error ? e.message : undefined, variant: "error" });
    } finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <Card className="flex items-center gap-3 p-3">
      <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-zinc-900">
        {reward.image
          // eslint-disable-next-line @next/next/no-img-element -- R2 image, plain <img> is enough in admin
          ? <img src={reward.image} alt="" className="size-16 object-contain" />
          : <ImageUp className="size-6 text-white/40" aria-hidden />}
      </div>
      <div className="grid min-w-0 flex-1 gap-1.5">
        <Label htmlFor={`reward-name-${reward.id}`} className="text-xs">ชื่อตรา #{index + 1}</Label>
        <Input id={`reward-name-${reward.id}`} value={reward.name} maxLength={40} onChange={(e) => onChange({ name: e.target.value })} className="h-10" />
        <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="sr-only" aria-label={`เลือกไฟล์รูป ${reward.name}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        <div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => ref.current?.click()}>{busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImageUp aria-hidden />}{reward.image ? "เปลี่ยนรูป" : "อัปโหลดรูป"}</Button></div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <Button type="button" size="icon-sm" variant="ghost" aria-label="เลื่อนขึ้น" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp /></Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="เลื่อนลง" disabled={last} onClick={() => onMove(1)}><ArrowDown /></Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label={`ลบ ${reward.name}`} onClick={onRemove}><Trash2 /></Button>
      </div>
    </Card>
  );
}

export function RewardsForm({ initial }: { initial: Reward[] }) {
  const [saved, setSaved] = useState(initial);
  const [list, setList] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const dirty = useMemo(() => JSON.stringify(list) !== JSON.stringify(saved), [list, saved]);
  const patch = (i: number, p: Partial<Reward>) => setList((l) => l.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (i: number, d: -1 | 1) => setList((l) => { const n = [...l]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });

  const save = () => start(async () => {
    setError("");
    const r = await saveRewardsAction(list).catch(() => null);
    if (!r?.ok) return setError(r?.error ?? "บันทึกไม่สำเร็จ");
    setSaved(r.data); setList(r.data);
    toast({ title: "บันทึกตรารีวอร์ดแล้ว", description: "ลูกค้าเห็นตัวเลือกใหม่ทันที", variant: "success" });
  });

  return (
    <div className="grid gap-3 pb-24">
      <p className="text-xs text-muted-foreground">ลูกค้าเลือกตราเหล่านี้ได้ในขั้นตกแต่ง (แบบป้ายที่มีชิ้นส่วน &quot;รีวอร์ดสกิน&quot;) · แนะนำภาพ PNG พื้นโปร่งใส ตัดขอบพอดีตรา · ลบตราที่มีป้ายซื้อไปแล้วใช้อยู่ไม่ได้</p>
      {list.map((r, i) => <Row key={r.id} reward={r} index={i} last={i === list.length - 1} onChange={(p) => patch(i, p)} onMove={(d) => move(i, d)} onRemove={() => setList((l) => l.filter((_, j) => j !== i))} />)}
      <div><Button type="button" variant="outline" disabled={list.length >= MAX_REWARDS} onClick={() => setList((l) => [...l, { id: newRewardId(), name: `ตราใหม่ ${l.length + 1}`, image: "" }])}><Plus aria-hidden />เพิ่มตรา</Button></div>
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-end gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur lg:left-64">
        {error && <p role="alert" className="mr-auto text-sm text-destructive">{error}</p>}
        <Button type="button" disabled={!dirty || pending} onClick={save}>{pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}บันทึก</Button>
      </div>
    </div>
  );
}
