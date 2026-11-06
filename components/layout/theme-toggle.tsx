"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon-sm" aria-label={copy.header.themeToggle} onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Moon aria-hidden /> : <Sun aria-hidden />}
    </Button>
  );
}
