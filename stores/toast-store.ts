import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";
export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastState = {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** เรียกได้จากทุกที่ฝั่ง client: toast({ title: copy.toast.linkCopied }) */
export const toast = (t: Omit<ToastItem, "id">) => useToastStore.getState().push(t);
