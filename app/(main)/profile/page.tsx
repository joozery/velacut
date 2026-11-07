import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getProfile } from "@/lib/server/profile";
import { getWalletUnits, toSnapshot } from "@/lib/server/wallet";
import { collections } from "@/lib/server/collections";
import { ProfileDashboard } from "@/components/profile/profile-dashboard";

export const metadata: Metadata = { title: "โปรไฟล์ของฉัน" };

export default async function ProfilePage() {
  const user = (await auth())?.user;
  if (!user?.id) redirect("/login?callbackUrl=%2Fprofile");
  const { txs } = await collections();
  const [profile, wallet, posterCount] = await Promise.all([
    getProfile(user.id), getWalletUnits(user.id), txs.countDocuments({ userId: user.id, kind: "poster", status: "completed" }),
  ]);
  return <ProfileDashboard profile={profile} wallet={toSnapshot(wallet)} posterCount={posterCount} />;
}
