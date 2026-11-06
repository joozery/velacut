"use client";

import { useRouter } from "next/navigation";
import { GameIcon } from "@/components/shared/game-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GAMES, type GameSlug } from "@/lib/games";
import { copy } from "@/lib/copy";

export function GameSelect({ value }: { value: GameSlug }) {
  const router = useRouter();
  return (
    <Select value={value} onValueChange={(v) => router.push(`/generate/${v}`)}>
      <SelectTrigger size="sm" aria-label={copy.editor.changeGame} className="min-w-24 border-transparent bg-transparent font-semibold hover:bg-surface-2">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GAMES.map((g) => (
          <SelectItem key={g.slug} value={g.slug}>
            <span className="flex items-center gap-2">
              <GameIcon game={g} className="size-5 rounded-md" />
              {g.shortName}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
