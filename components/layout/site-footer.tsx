import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { copy } from "@/lib/copy";
import { GAMES } from "@/lib/games";
import { fmt } from "@/lib/utils";

export function SiteFooter() {
  const c = copy.footer;
  const links = [
    { href: "/#steps", label: c.howTo },
    { href: "/#pricing", label: c.pricing },
    { href: "/#faq", label: c.faq },
    { href: "/topup", label: copy.nav.topup },
    { href: "/history", label: copy.nav.history },
    { href: "/chat", label: c.contact },
  ];
  return (
    <footer className="pb-24 sm:pb-0">
      <div className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{c.about}</p>
        </div>
        <nav aria-label={c.product}>
          <h2 className="text-sm font-semibold">{c.product}</h2>
          <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
            {GAMES.map((g) => (
              <li key={g.slug}>
                <Link className="hover:text-foreground" href={`/generate/${g.slug}`}>{g.name}</Link>
              </li>
            ))}
            <li><Link className="hover:text-foreground" href="/assets/rov">{copy.nav.assets}</Link></li>
          </ul>
        </nav>
        <nav aria-label={c.links}>
          <h2 className="text-sm font-semibold">{c.support}</h2>
          <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
            {links.map((l) => (
              <li key={l.href}><Link className="hover:text-foreground" href={l.href}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      </div>
      <div className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>{fmt(c.rights, { year: new Date().getFullYear(), brand: copy.brand.name })}</p>
        <div className="flex flex-col gap-1 normal-case tracking-normal sm:items-end sm:text-right">
          <p>{c.disclaimer}</p>
          <p>
            {fmt(c.credits, { rov: "dxawdc/rov-skins", mlbb: "MLBBDex" })
              .split(/(dxawdc\/rov-skins|MLBBDex)/)
              .map((part, i) =>
                part === "dxawdc/rov-skins" ? (
                  <a key={i} href="https://github.com/dxawdc/rov-skins" className="underline hover:text-foreground" target="_blank" rel="noreferrer">{part}</a>
                ) : part === "MLBBDex" ? (
                  <a key={i} href="https://mlbbdex.com" className="underline hover:text-foreground" target="_blank" rel="noreferrer">{part}</a>
                ) : (
                  part
                ),
              )}
          </p>
        </div>
      </div>
      </div>
    </footer>
  );
}
