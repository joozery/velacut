"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import { useToastStore, type ToastVariant } from "@/stores/toast-store";

export { toast } from "@/stores/toast-store";

const icons: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="size-5 text-primary" aria-hidden />,
  success: <CheckCircle2 className="size-5 text-success" aria-hidden />,
  error: <XCircle className="size-5 text-danger" aria-hidden />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <ToastPrimitive.Provider swipeDirection="down" duration={3500}>
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          duration={t.duration}
          onOpenChange={(open) => !open && dismiss(t.id)}
          className={cn(
            "pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft-lg",
            "data-[state=open]:animate-pop data-[state=closed]:animate-fade-out",
            "data-[swipe=move]:translate-y-(--radix-toast-swipe-move-y) data-[swipe=end]:animate-fade-out",
          )}
        >
          {icons[t.variant ?? "default"]}
          <div className="grid flex-1 gap-0.5">
            <ToastPrimitive.Title className="text-sm font-semibold">{t.title}</ToastPrimitive.Title>
            {t.description && (
              <ToastPrimitive.Description className="text-sm text-muted-foreground">{t.description}</ToastPrimitive.Description>
            )}
          </div>
          <ToastPrimitive.Close
            aria-label={copy.common.close}
            className="-m-1 inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2"
          >
            <X className="size-4" aria-hidden />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-24 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 outline-none md:bottom-6" />
    </ToastPrimitive.Provider>
  );
}
