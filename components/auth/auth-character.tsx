"use client";

import Image from "next/image";
import { m, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/components/motion";

export function AuthCharacter() {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      className="pointer-events-none absolute inset-x-3 top-6 bottom-48"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
    >
      <m.div
        className="relative h-full w-full"
        animate={{ y: reduceMotion ? 0 : [0, -10, 0] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src="/logo/careactor.png" alt="" fill priority sizes="50vw" className="object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.4)]" />
      </m.div>
    </m.div>
  );
}
