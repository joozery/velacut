import Image from "next/image";
import { Download } from "lucide-react";
import type { AssetItem } from "@/lib/assets";
import { copy } from "@/lib/copy";
import { cn, fmt } from "@/lib/utils";

/** การ์ดไฟล์ในคลัง: ภาพ + ป้ายหมวด + ปุ่มดาวน์โหลด (ทั้งใบเป็นลิงก์ดาวน์โหลด) */
export function AssetCard({ item, portrait, priority }: { item: AssetItem; portrait: boolean; priority?: boolean }) {
  const label = `${item.heroName} ${item.name}`;
  return (
    <li>
      <a
        href={item.downloadUrl}
        download
        aria-label={fmt(copy.library.downloadAria, { name: label })}
        className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-surface-2 shadow-soft-sm ring-1 ring-border transition-[box-shadow,transform] duration-300 group-hover:-translate-y-0.5 group-hover:shadow-soft-lg",
            portrait ? "aspect-[200/325]" : "aspect-[300/186]",
          )}
        >
          <Image
            src={item.image}
            alt=""
            fill
            unoptimized
            priority={priority}
            sizes={portrait ? "(min-width: 1024px) 16vw, 33vw" : "(min-width: 1024px) 25vw, 50vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute bottom-2 left-2 flex items-center gap-1">
            <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {copy.library.category[item.category]}
            </span>
          </span>
          <span className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-zinc-900 opacity-0 shadow-soft transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Download className="size-4" aria-hidden />
          </span>
        </div>
        <p className="mt-2 truncate text-sm font-semibold">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.heroName}
        </p>
      </a>
    </li>
  );
}
