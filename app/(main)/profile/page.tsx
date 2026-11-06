import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.pages.profile.title };

export default function ProfilePage() {
  return <ComingSoon {...copy.pages.profile} />;
}
