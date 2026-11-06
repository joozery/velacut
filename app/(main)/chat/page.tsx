import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.pages.chat.title };

export default function ChatPage() {
  return <ComingSoon {...copy.pages.chat} />;
}
