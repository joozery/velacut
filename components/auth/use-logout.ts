"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/(auth)/actions";
import { useAccountStore } from "@/stores/account-store";
import { toast } from "@/components/ui/toast";

export function useLogout() {
  const [pending, startTransition] = useTransition();

  const logout = () => {
    if (pending) return;
    startTransition(async () => {
      try {
        await logoutAction();
        useAccountStore.getState().reset();
        // Reload the document so both server content and SessionProvider use the cleared cookie.
        window.location.assign("/");
      } catch {
        toast({ variant: "error", title: "ออกจากระบบไม่สำเร็จ", description: "กรุณาลองอีกครั้ง" });
      }
    });
  };

  return { logout, pending };
}
