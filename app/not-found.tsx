import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { copy } from "@/lib/copy";

export default function NotFound() {
  const c = copy.pages.notFound;
  return (
    <main id="main" className="container-page grid min-h-dvh place-items-center py-16">
      <PageHeader as="h1" badge="404" title={c.title} description={c.description}>
        <Button asChild className="mt-8"><Link href="/">{c.cta}</Link></Button>
      </PageHeader>
    </main>
  );
}
