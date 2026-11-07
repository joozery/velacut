"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { Gift, MessageCircle, X } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { CoinIcon } from "@/components/shared/coin";
import { DailyRewardDialog } from "./daily-reward-dialog";
import { copy } from "@/lib/copy";
import { formatCoins } from "@/lib/format";
import type { DailyConfig } from "@/lib/daily";
import { contactChannels, type ContactChannel } from "@/lib/contact";
import { useAppearance } from "@/components/shared/appearance-provider";
import { toast } from "@/stores/toast-store";
import { cn, fmt } from "@/lib/utils";
import { nextRewardDay, useDaily } from "@/stores/account-store";

const NUDGE_DELAY = 1500;
const NUDGE_KEY = "velacut-reward-nudge-dismissed";

const dockBtn =
  "relative grid size-11 place-items-center rounded-full text-foreground transition-[background-color,transform] hover:bg-surface-2 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-[22px]";

/** มือถือ: เลื่อนลง = หลบไปขวา, เลื่อนขึ้น = กลับมา */
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)");
    const onScroll = () => {
      if (!mobile.matches) return setHidden(false);
      const y = window.scrollY;
      const delta = y - last.current;
      if (Math.abs(delta) > 8) setHidden(delta > 0 && y > 200);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

/** ปุ่มช่องทางติดต่อ 1 ปุ่ม (สไลด์ออกจากปุ่มแชท) */
function ChannelButton({ ch, index, total, onDone }: { ch: ContactChannel; index: number; total: number; onDone: () => void }) {
  const name = copy.dock.channels[ch.id];
  const cls =
    "grid size-11 place-items-center rounded-full border border-border bg-white shadow-soft-lg transition-transform hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  // eslint-disable-next-line @next/next/no-img-element -- SVG ขนาดเล็กใน public ไม่ต้องผ่าน image optimizer
  const icon = <img src={ch.icon} alt="" width={24} height={24} className="size-6" draggable={false} />;

  return (
    <m.li
      initial={{ opacity: 0, y: 24, scale: 0.6 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 520, damping: 30, delay: index * 0.045 } }}
      exit={{ opacity: 0, y: 24, scale: 0.6, transition: { duration: 0.14, delay: (total - 1 - index) * 0.025 } }}
    >
      <Tooltip content={name} side="left">
        {ch.href ? (
          <Link
            href={ch.href}
            aria-label={name}
            onClick={onDone}
            className={cls}
            {...(ch.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {icon}
          </Link>
        ) : (
          // ยังไม่ได้ตั้งค่าลิงก์ในหลังบ้าน — แจ้งเตือนแทนการพาไปหน้าว่าง
          <button
            type="button"
            aria-label={name}
            className={cls}
            onClick={() => toast({ title: fmt(copy.dock.contactNotSet, { name }), description: copy.dock.contactNotSetDesc })}
          >
            {icon}
          </button>
        )}
      </Tooltip>
    </m.li>
  );
}

/** dock ทางลัดมุมขวาล่าง: รางวัลรายวัน + แชทซัพพอร์ต */
export function FloatingActions({ daily }: { daily: DailyConfig }) {
  const pathname = usePathname();
  const site = useAppearance();
  // แสดงเฉพาะช่องทางที่ตั้งลิงก์ไว้ — ถ้ายังไม่ตั้งเลยสักช่อง แสดงทั้งหมดพร้อมแจ้งว่ายังไม่ได้ตั้งค่า
  const configured = contactChannels(site.social).filter((ch) => ch.href);
  const channels = configured.length ? configured : contactChannels(site.social);
  const [heroActionsVisible, setHeroActionsVisible] = useState(false);
  const { claimed, claimedToday } = useDaily();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const contactId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const hidden = useHideOnScrollDown();

  useEffect(() => {
    let actions: HTMLElement | null = null;
    const observer = new IntersectionObserver(([entry]) => setHeroActionsVisible(entry.isIntersecting));
    const watchActions = () => {
      const next = document.getElementById("hero-actions");
      if (next === actions) return;
      observer.disconnect();
      actions = next;
      setHeroActionsVisible(false);
      if (actions) observer.observe(actions);
    };
    watchActions();
    // SmoothScroll can replace the landing subtree after hydration.
    const mutations = new MutationObserver(watchActions);
    const main = document.getElementById("main");
    if (main) mutations.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  // ปิดเมนูช่องทางติดต่อเมื่อคลิกข้างนอก / กด Esc
  useEffect(() => {
    if (!contactOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setContactOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setContactOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [contactOpen]);
  const day = nextRewardDay(claimed, daily.days.length);
  const reward = daily.days[day - 1]?.reward ?? 0;

  // บับเบิลชวนเช็กอิน: โผล่หลังเข้าเว็บสักพัก ถ้ายังไม่รับและยังไม่เคยปิดในแท็บนี้
  useEffect(() => {
    if (claimedToday || !daily.enabled) return setNudge(false);
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(NUDGE_KEY) === "1";
    } catch {}
    if (dismissed) return;
    const t = setTimeout(() => setNudge(true), NUDGE_DELAY);
    return () => clearTimeout(t);
  }, [claimedToday, daily.enabled]);

  const dismissNudge = () => {
    setNudge(false);
    try {
      sessionStorage.setItem(NUDGE_KEY, "1");
    } catch {}
  };

  const openReward = () => {
    setNudge(false);
    setRewardOpen(true);
  };

  return (
    <m.div
      id="floating-actions"
      ref={rootRef}
      aria-label={copy.dock.aria}
      role="group"
      animate={{ x: hidden && !rewardOpen && !contactOpen ? 84 : 0, opacity: hidden && !rewardOpen && !contactOpen ? 0.6 : 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={cn("fixed right-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 flex items-end gap-2 sm:right-5 md:bottom-6", heroActionsVisible && !rewardOpen && !contactOpen && "invisible pointer-events-none")}
    >
      {/* บับเบิลชวนรับรางวัล */}
      <AnimatePresence>
        {nudge && !claimedToday && !contactOpen && (
          <m.div
            key="nudge"
            initial={{ opacity: 0, x: 12, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="relative mb-[3.4rem] flex items-center gap-1 rounded-2xl border border-border bg-surface py-1 pr-1 pl-1 shadow-soft-lg"
          >
            <button
              type="button"
              onClick={openReward}
              aria-label={copy.dock.nudgeOpen}
              className="flex items-center gap-2.5 rounded-xl py-1.5 pr-2 pl-2 text-left transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <CoinIcon className="size-7 shrink-0" />
              <span className="leading-tight">
                <span className="block text-xs text-muted-foreground">{fmt(copy.dock.nudge, { day })}</span>
                <span className="block text-sm font-semibold">{fmt(copy.dock.nudgeReward, { n: formatCoins(reward) })}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={dismissNudge}
              aria-label={copy.dock.nudgeClose}
              className="grid size-7 place-items-center self-start rounded-lg text-muted-foreground hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="size-3.5" aria-hidden />
            </button>
            {/* หางบับเบิลชี้ไปที่ปุ่มของขวัญ */}
            <span aria-hidden className="absolute -right-[5px] bottom-4 size-2.5 rotate-45 border-t border-r border-border bg-surface" />
          </m.div>
        )}
      </AnimatePresence>

      {/* dock */}
      <div className="relative flex flex-col gap-1 rounded-full border border-border bg-surface/90 p-1 shadow-soft-lg backdrop-blur-md">
        {daily.enabled && <>
        <Tooltip content={copy.dailyReward.fabAria} side="left">
          <button type="button" onClick={openReward} aria-label={copy.dailyReward.fabAria} className={cn(dockBtn, !claimedToday && "text-primary")}>
            <m.span
              animate={claimedToday ? { rotate: 0 } : { rotate: [0, -12, 10, -6, 0] }}
              transition={claimedToday ? { duration: 0 } : { duration: 0.8, repeat: Infinity, repeatDelay: 4 }}
              className="grid place-items-center"
            >
              <Gift aria-hidden />
            </m.span>
            {/* เลขวันเช็กอิน */}
            <span aria-hidden className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-1.5 text-[9px] leading-[14px] font-bold text-secondary-foreground tabular-nums">
              {claimedToday ? claimed : day}
            </span>
            {!claimedToday && (
              <span aria-hidden className="absolute top-1.5 right-1.5 flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex size-2.5 rounded-full border-2 border-surface bg-danger" />
              </span>
            )}
          </button>
        </Tooltip>

        <span aria-hidden className="mx-auto h-px w-6 bg-border" />
        </>}

        <button
          type="button"
          onClick={() => {
            setNudge(false);
            setContactOpen((o) => !o);
          }}
          aria-label={contactOpen ? copy.dock.contactClose : copy.dock.contactOpen}
          aria-expanded={contactOpen}
          aria-controls={contactId}
          title={contactOpen ? undefined : `${copy.chatFab.aria} · ${copy.chatFab.online}`}
          className={cn(dockBtn, contactOpen && "bg-secondary text-secondary-foreground hover:bg-secondary-hover")}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={contactOpen ? "x" : "chat"}
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              {contactOpen ? <X aria-hidden /> : <MessageCircle aria-hidden />}
            </m.span>
          </AnimatePresence>
          {!contactOpen && <span aria-hidden className="absolute right-2 bottom-2 size-2.5 rounded-full border-2 border-surface bg-success" />}
        </button>

        {/* ช่องทางติดต่อ: สไลด์ขึ้นไปด้านบน เหนือ dock (LINE อยู่ล่างสุด ใกล้ปุ่มแชท) */}
        <AnimatePresence>
          {contactOpen && (
            <m.ul
              id={contactId}
              aria-label={copy.dock.contactMenu}
              className="absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 flex-col-reverse items-center gap-2"
            >
              {channels.map((ch, i) => (
                <ChannelButton key={ch.id} ch={ch} index={i} total={channels.length} onDone={() => setContactOpen(false)} />
              ))}
            </m.ul>
          )}
        </AnimatePresence>
      </div>

      {daily.enabled && <DailyRewardDialog config={daily} open={rewardOpen} onOpenChange={setRewardOpen} />}
    </m.div>
  );
}
