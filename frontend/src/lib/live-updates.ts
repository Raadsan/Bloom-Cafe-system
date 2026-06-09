export const ORDERS_CHANGED = "orders_changed";
export const REFRESH_NOTIFICATIONS = "refresh_notifications";

export type OrderSocketPayload = {
  id?: number;
  status?: string;
  table?: number;
  orderType?: string;
  action?: "new" | "update" | "ready";
};

export function dispatchOrdersChanged(detail: OrderSocketPayload) {
  window.dispatchEvent(new CustomEvent(ORDERS_CHANGED, { detail }));
}

export function dispatchRefreshNotifications() {
  window.dispatchEvent(new CustomEvent(REFRESH_NOTIFICATIONS));
}

/** Debounced handler — avoids rapid API refetches when many socket events arrive. */
export function onDebouncedEvent<T>(
  eventName: string,
  handler: (detail: T) => void,
  delayMs = 600
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const listener = (e: Event) => {
    if (timer) clearTimeout(timer);
    const detail = (e as CustomEvent<T>).detail;
    timer = setTimeout(() => handler(detail), delayMs);
  };

  window.addEventListener(eventName, listener);
  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener(eventName, listener);
  };
}
