export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach(fn => fn([...toasts]));
}

function addToast(type: ToastType, message: string) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, type, message }];
  notify();
  setTimeout(() => removeToast(id), 3500);
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notify();
}

export const toast = {
  success: (msg: string) => addToast('success', msg),
  error:   (msg: string) => addToast('error', msg),
  info:    (msg: string) => addToast('info', msg),
  warning: (msg: string) => addToast('warning', msg),
};
