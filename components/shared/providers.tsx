"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { MotionProvider } from "@/components/motion";
import { AccountSync } from "./account-sync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
    <AccountSync />
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionProvider>
        <TooltipProvider delayDuration={250}>
          {children}
          <Toaster />
        </TooltipProvider>
      </MotionProvider>
    </ThemeProvider>
    </SessionProvider>
  );
}
