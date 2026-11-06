"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { copy } from "@/lib/copy";
import { ASSET_SORTS, assetsHref, type AssetSort } from "@/lib/assets";
import type { GameSlug } from "@/lib/games";

export function SortSelect({ game, value, q, tier }: { game: GameSlug; value: AssetSort; q: string; tier: string | null }) {
  const router = useRouter();
  return (
    <Select value={value} onValueChange={(v) => router.push(assetsHref(game, { q, tier }, { sort: v, page: 1 }), { scroll: false })}>
      <SelectTrigger aria-label={copy.library.sortAria} className="w-full rounded-full sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ASSET_SORTS.map((s) => (
          <SelectItem key={s} value={s}>
            {copy.library.sort[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
