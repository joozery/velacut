"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { Skin } from "@/lib/catalog";
import { getTier } from "@/lib/tiers";
import { cn } from "@/lib/utils";
import { placeholderGradient } from "./placeholders";

/**
 * การ์ดสกินพร้อมภาพจริง: เลขลำดับ + badge ระดับ + ชื่อ
 * ภาพเป็น webp ขนาดเล็กที่ resize ไว้แล้ว จึงใช้ unoptimized (ไม่ผ่าน image optimizer)
 */
export function SkinThumb({
  skin,
  index,
  compact,
  showHero,
  hideTier,
  size = "md",
  className,
  priority,
  sizes = "120px",
}: {
  skin: Skin;
  index?: number;
  compact?: boolean;
  showHero?: boolean;
  hideTier?: boolean;
  /**
   * xs = การ์ดเล็กมาก (กริด 8 คอลัมน์ในป้ายตัวอย่าง) — badge เล็กลงไม่ให้ทับกัน
   * lg = การ์ดใหญ่ในพื้นที่ทำงาน — ตัวอักษรขยายตามความกว้างการ์ด (container query)
   */
  size?: "xs" | "md" | "lg";
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const tier = getTier(skin.game, skin.tier);

  return (
    <div className={cn("@container relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2 text-white", className)}>
      {failed ? (
        <div className={cn("absolute inset-0 grid place-items-center bg-gradient-to-br", placeholderGradient(skin.id))}>
          <ImageIcon aria-hidden className="size-1/3 opacity-30" />
        </div>
      ) : (
        <Image
          src={skin.image}
          alt=""
          fill
          sizes={sizes}
          unoptimized
          priority={priority}
          draggable={false}
          onError={() => setFailed(true)}
          className="object-cover select-none"
        />
      )}
      {index !== undefined && (
        <span
          className={cn(
            "absolute grid place-items-center bg-black/60 font-bold backdrop-blur-sm",
            size === "xs" && "top-0.5 left-0.5 size-3.5 rounded-[3px] text-[7px]",
            size === "md" && "top-1.5 left-1.5 size-5 rounded-md text-[10px]",
            size === "lg" && "top-[5%] left-[5%] size-[clamp(18px,12cqw,30px)] rounded-full text-[clamp(10px,6.5cqw,15px)]",
          )}
        >
          {index}
        </span>
      )}
      {!hideTier && <span
        title={tier.label}
        className={cn(
          "absolute leading-none font-bold shadow-sm",
          size === "xs" && "top-0.5 right-0.5 rounded-[3px] px-0.5 py-px text-[6px]",
          size === "md" && "top-1.5 right-1.5 rounded-md px-1.5 py-0.5 text-[10px]",
          // lg: วางถัดจากเลขลำดับ เพื่อให้มุมขวาบนว่างไว้สำหรับปุ่มลบ
          size === "lg" && "top-[calc(5%+clamp(3px,1.5cqw,6px))] left-[calc(5%+clamp(18px,12cqw,30px)+4px)] rounded-md px-[0.5em] py-[0.3em] text-[clamp(9px,5.5cqw,13px)]",
          tier.className,
        )}
      >
        {tier.short}
      </span>}
      {!compact && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
            size === "lg" ? "px-[6%] pt-[30%] pb-[6%] text-center" : "px-2 pt-6 pb-1.5",
          )}
        >
          <p
            className={cn(
              "leading-tight font-semibold drop-shadow",
              size === "lg" ? "line-clamp-2 text-[clamp(11px,9cqw,22px)] text-balance" : "truncate text-xs",
            )}
          >
            {skin.name}
          </p>
          {showHero && <p className="truncate text-[10px] opacity-80">{skin.heroName}</p>}
        </div>
      )}
    </div>
  );
}
