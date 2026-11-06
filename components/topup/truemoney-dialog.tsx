"use client";

import { useEffect, useId, useState } from "react";
import { ClipboardPaste, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UiIcon } from "@/components/icons/ui-icon";
import { copy } from "@/lib/copy";
import { formatBaht, formatInt } from "@/lib/format";
import { cn, fmt } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

const t = copy.topup.truemoney;

/** ลิงก์ซองของขวัญ TrueMoney */
const GIFT_LINK_RE = /^https:\/\/gift\.truemoney\.com\/campaign\/\?v=[A-Za-z0-9]{10,64}$/;

/**
 * เติมคอยน์ด้วยซองของขวัญ TrueMoney: ผู้ใช้สร้างซองตามยอด แล้ววางลิงก์
 * Phase 4: server action รับลิงก์ → redeem ซองเข้าเบอร์ร้าน → ตรวจยอดตรงกับคำสั่ง → เติมคอยน์ใน transaction
 */
export function TrueMoneyDialog({
  open,
  onOpenChange,
  baht,
  coins,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baht: number;
  coins: number;
}) {
  const id = useId();
  const [link, setLink] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = GIFT_LINK_RE.test(link.trim());

  useEffect(() => {
    if (!open) {
      setLink("");
      setTouched(false);
    }
  }, [open]);

  const paste = async () => {
    try {
      setLink((await navigator.clipboard.readText()).trim());
      setTouched(true);
    } catch {}
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    toast({ title: t.done, description: t.doneDesc });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader className="items-center pr-0 text-center">
            <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-[#ff8200] text-white shadow-soft-sm">
              <UiIcon name="wallet-balance" className="size-7" />
            </span>
            <DialogTitle>{t.title}</DialogTitle>
            <DialogDescription>{t.description}</DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl bg-surface-2 p-4 text-center">
            <p className="text-xs text-muted-foreground">{t.amount}</p>
            <p className="mt-0.5 text-3xl font-bold tabular-nums">฿{formatBaht(baht)}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              = {formatInt(coins)} {copy.topup.coins}
            </p>
          </div>

          <ol className="grid gap-2 text-sm">
            {t.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#ff8200]/15 text-xs font-bold text-[#c25e00] dark:text-[#ffa14d]">{i + 1}</span>
                <span className="pt-0.5">{fmt(step, { n: formatInt(baht) })}</span>
              </li>
            ))}
          </ol>

          <div className="grid gap-2">
            <label htmlFor={`${id}-link`} className="text-sm font-medium">{t.linkLabel}</label>
            <div className="flex gap-2">
              <input
                id={`${id}-link`}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={() => link && setTouched(true)}
                placeholder={t.linkPlaceholder}
                aria-invalid={touched && !valid}
                aria-describedby={touched && !valid ? `${id}-err` : undefined}
                className={cn(
                  "h-11 min-w-0 flex-1 rounded-xl border border-input bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
                  touched && !valid && "border-danger",
                )}
              />
              <Button type="button" variant="outline" onClick={paste} className="h-11 shrink-0 rounded-xl">
                <ClipboardPaste aria-hidden />
                {t.paste}
              </Button>
            </div>
            {touched && !valid && (
              <p id={`${id}-err`} className="text-xs text-danger">{t.linkError}</p>
            )}
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-xs text-foreground">
            <TriangleAlert className="mt-px size-4 shrink-0 text-warning" aria-hidden />
            {t.warn}
          </p>

          <Button type="submit" size="lg" block className="rounded-xl bg-[#ff8200] text-white hover:bg-[#e67500]">
            {t.submit}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">{t.note}</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
