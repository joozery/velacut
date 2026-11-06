import { LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GridStep } from "@/components/editor/grid-step";
import { TemplateStep } from "@/components/editor/template-step";
import { DecorateStep } from "@/components/editor/decorate-step";
import { copy } from "@/lib/copy";
import { getGame, parseStep } from "@/lib/games";
import { fmt } from "@/lib/utils";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const game = getGame((await params).game)!;
  const step = parseStep((await searchParams).step);

  if (game.mode === "library" && step === "grid") {
    return (
      <div className="h-full px-3 py-4 pb-20 sm:px-6 sm:py-6 lg:pb-6">
        <GridStep game={game.slug} />
      </div>
    );
  }

  if (game.mode === "library" && step === "template") {
    return <TemplateStep game={game.slug} />;
  }

  if (game.mode === "library" && step === "decorate") {
    return <DecorateStep game={game.slug} />;
  }

  // checkout และ editor Free Fire
  const stepLabel = game.mode === "upload" ? game.shortName : copy.editor.steps[step];
  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6">
      <Card className="grid min-h-[50dvh] place-items-center border-dashed p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <LayoutGrid className="size-6" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold">{fmt(copy.editor.placeholder.title, { step: stepLabel })}</h1>
          <p className="max-w-sm text-sm text-muted-foreground">{fmt(copy.editor.placeholder.description, { phase: 3 })}</p>
        </div>
      </Card>
    </div>
  );
}
