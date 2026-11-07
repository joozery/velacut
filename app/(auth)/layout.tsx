import Image from "next/image";
import { Logo } from "@/components/shared/logo";
import { AuthCharacter } from "@/components/auth/auth-character";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-dvh bg-background lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:overflow-hidden">
      <section className="flex flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 sm:px-10 lg:min-h-0 no-scrollbar lg:overflow-y-auto lg:overscroll-contain">
        <Logo className="[&_img]:h-5 sm:[&_img]:h-6" />
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-6">{children}</div>
      </section>
      <aside aria-hidden className="relative isolate m-3 hidden overflow-hidden rounded-3xl bg-ink lg:block">
        <Image src="/images/auth-arena-portrait-v1.webp" alt="" fill priority sizes="55vw" className="object-cover object-top opacity-80" />
        <AuthCharacter />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(10_16_32/0.92)_0%,rgb(10_16_32/0.35)_45%,transparent_100%)]" />
        <div className="absolute inset-x-10 bottom-10 text-white">
          <p className="mb-3 font-mono text-[10px] font-medium tracking-[0.2em] text-white/70">MLBB ID POSTER STUDIO</p>
          <p className="max-w-md text-3xl leading-tight font-bold tracking-tight">สร้างป้ายขายไอดีสวยๆ<br />ในไม่กี่นาที</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">เลือกสกินจากคลัง จัดเรียง ตกแต่ง แล้วดาวน์โหลดได้ทันที</p>
        </div>
      </aside>
    </main>
  );
}
