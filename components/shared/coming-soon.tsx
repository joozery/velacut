import Link from "next/link";
import { Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "./page-header";
import { copy } from "@/lib/copy";
import { fmt } from "@/lib/utils";

/** หน้าชั่วคราวสำหรับ route ที่ยังไม่ถึง phase */
export function ComingSoon({ badge, title, description, phase }: { badge: string; title: string; description: string; phase: number }) {
  return (
    <div className="container-page py-12 sm:py-16">
      <PageHeader as="h1" badge={badge} title={title} description={description} />
      <Card className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Hammer className="size-6" aria-hidden />
        </span>
        <p className="font-medium">{fmt(copy.pages.phaseNote, { n: phase })}</p>
        <Button asChild variant="secondary" className="mt-2">
          <Link href="/">{copy.pages.notFound.cta}</Link>
        </Button>
      </Card>
    </div>
  );
}
