import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.pages.topup.title };

export default function TopupPage() {
  return <ComingSoon {...copy.pages.topup} />;
}
