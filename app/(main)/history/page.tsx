import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.pages.history.title };

export default function HistoryPage() {
  return <ComingSoon {...copy.pages.history} />;
}
