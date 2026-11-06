import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowUpRight, BookOpen, CircleHelp, Gamepad2, History, House, Images, MessageCircle, UserRound, Wallet } from "lucide-react";
import { GameIcon } from "@/components/shared/game-icon";
import { copy } from "@/lib/copy";
import { CONTACT_CHANNELS } from "@/lib/contact";
import { DEFAULT_GAME, GAMES } from "@/lib/games";
import { fmt } from "@/lib/utils";

export function SiteFooter() {
  const c = copy.footer;
  const groups = [
    { title: "เมนูหลัก", items: [
      { href: "/", label: copy.nav.home, icon: House },
      { href: "/topup", label: copy.nav.topup, icon: Wallet },
      { href: "/history", label: "ประวัติรายการ", icon: History },
      { href: "/profile", label: copy.header.profile, icon: UserRound },
    ] },
    { title: "เครื่องมือ", items: [
      { href: `/generate/${DEFAULT_GAME}`, label: "สร้างป้าย MLBB", icon: Gamepad2 },
      { href: `/assets/${DEFAULT_GAME}`, label: copy.nav.assets, icon: Images },
      { href: "/#pricing", label: "ราคาและคอยน์", icon: Wallet },
    ] },
    { title: "ข้อมูลเพิ่มเติม", items: [
      { href: "/#steps", label: "คู่มือสร้างป้าย", icon: BookOpen },
      { href: "/#faq", label: c.faq, icon: CircleHelp },
      { href: "/chat", label: c.contact, icon: MessageCircle },
    ] },
  ];
  const channels = CONTACT_CHANNELS.filter((channel) => channel.href);

  return (
    <footer className="relative isolate overflow-hidden bg-[#06152f] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-20 aspect-[2/1] [mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)]">
        <Image src="/images/footer-wave-background-v1.webp" alt="" fill sizes="100vw" className="object-cover object-top" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-12 bg-gradient-to-b from-background to-transparent sm:h-20" />
      <svg aria-hidden="true" viewBox="0 0 1440 110" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-24 w-full text-[#1463e8]"><path d="M0 60C220-45 360 150 680 70S1120-25 1440 60V110H0Z" fill="currentColor" opacity="0.08" /><path d="M0 70C260-30 360 140 700 65S1160-15 1440 55" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" /></svg>

      <div className="mx-auto max-w-7xl px-5 pt-28 pb-6 sm:px-8 sm:pt-36 xl:pt-[clamp(10rem,13vw,15rem)]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-3 xl:grid-cols-[1.45fr_.85fr_.95fr_1fr_1.15fr] xl:gap-6">
          <div className="col-span-2 md:col-span-3 xl:col-span-1">
            <Link href="/" aria-label={copy.header.logoAria} className="inline-flex rounded-lg"><Image src="/logo/logo-dark.png" alt={copy.brand.name} width={900} height={122} className="h-6 w-auto sm:h-7" /></Link>
            <p className="mt-4 max-w-xs text-xs leading-6 text-white/70">{c.about}<br /><span className="text-[#8ec5ff]">จัดสกินให้เป็นป้ายที่เป็นคุณ</span></p>
            <div className="mt-4 flex flex-wrap gap-2">{GAMES.map((game) => <Link key={game.slug} href={`/generate/${game.slug}`} className="group inline-flex items-center gap-2 rounded-xl border border-blue-300/20 bg-white/5 py-2 pr-3 pl-2 text-[11px] font-semibold transition-colors hover:border-blue-300/50 hover:bg-blue-400/10"><GameIcon game={game} className="size-7 rounded-lg" />{game.shortName}<ArrowUpRight className="size-3 text-blue-200/60" aria-hidden /></Link>)}</div>
            {channels.length > 0 && <nav aria-label="โซเชียลมีเดีย VELCUT" className="mt-4 flex gap-2">{channels.map((channel) => <a key={channel.id} href={channel.href} target="_blank" rel="noopener noreferrer" aria-label={copy.dock.channels[channel.id]} className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/5 transition-colors hover:bg-blue-400/20"><Image src={channel.icon} alt="" width={18} height={18} /></a>)}</nav>}
          </div>

          {groups.map((group) => <nav key={group.title} aria-label={`${group.title}ท้ายเว็บ`} className="min-w-0 xl:border-l xl:border-blue-200/15 xl:pl-5">
            <h2 className="mb-3 text-[13px] font-semibold text-white">{group.title}</h2>
            <ul className="grid gap-1">{group.items.map(({ href, label, icon: Icon }) => <li key={href}><Link href={href} className="group flex min-h-9 items-center gap-2 text-[11px] leading-5 text-white/65 transition-colors hover:text-[#8ec5ff]"><Icon className="size-4 shrink-0 text-blue-100/60 transition-colors group-hover:text-[#8ec5ff]" strokeWidth={1.6} aria-hidden /><span>{label}</span></Link></li>)}</ul>
          </nav>)}

          <div className="min-w-0 md:col-span-2 xl:col-span-1">
            <div className="rounded-2xl border border-blue-300/30 bg-[linear-gradient(145deg,rgba(51,101,175,0.35),rgba(9,29,60,0.9))] p-3 shadow-[inset_0_1px_0_rgb(147_197_253/0.15)] sm:p-4 xl:mt-7">
              <span className="mb-3 grid size-9 place-items-center rounded-xl border border-blue-300/20 bg-blue-400/10 text-[#8ec5ff]"><MessageCircle className="size-5" strokeWidth={1.6} aria-hidden /></span>
              <h2 className="text-xs leading-5 font-semibold sm:text-sm">มีคำถามหรือปัญหา?</h2>
              <p className="mt-1.5 text-[10px] leading-5 text-white/60">สอบถามเรื่องป้ายและการใช้งานกับทีมงานของเรา</p>
              <Link href="/chat" className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#1463e8] px-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#2677ff]">แชทกับเรา<ArrowRight className="size-3.5" aria-hidden /></Link>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-blue-200/20 pt-4 sm:mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] leading-5 text-white/65"><p>{fmt(c.rights, { year: new Date().getFullYear(), brand: copy.brand.name })}</p><a href="#main" className="inline-flex min-h-8 items-center gap-2 text-blue-200 transition-colors hover:text-white">กลับด้านบน<ArrowUp className="size-3.5" aria-hidden /></a></div>
          <div className="mt-2 max-w-4xl space-y-1 text-[9px] leading-5 text-white/40"><p>{c.disclaimer}</p><p>{fmt(c.credits, { mlbb: "MLBBDex" }).split(/(MLBBDex)/).map((part, i) => part === "MLBBDex" ? <a key={i} href="https://mlbbdex.com" className="underline decoration-white/25 underline-offset-2 transition-colors hover:text-blue-200" target="_blank" rel="noreferrer">{part}</a> : part)}</p></div>
        </div>
      </div>
    </footer>
  );
}
