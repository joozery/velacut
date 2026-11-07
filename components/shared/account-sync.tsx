"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAccountStore } from "@/stores/account-store";

/** โหลดข้อมูลบัญชีเมื่อล็อกอิน / ล้างเมื่อออกจากระบบ */
export function AccountSync() {
  const { data, status } = useSession();
  const userId = data?.user?.id;
  useEffect(() => {
    const store = useAccountStore.getState();
    if (status === "authenticated") void store.refresh();
    else if (status === "unauthenticated") store.reset();
  }, [status, userId]);
  return null;
}
