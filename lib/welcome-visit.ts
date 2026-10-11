export const WELCOME_DELAY_MS = 40_000;
const VISIT_KEY = "kab_welcome_visit_v1";
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function welcomeVisit(storage: StorageLike, now: number) {
  let start = now, shown = false;
  try {
    const saved = JSON.parse(storage.getItem(VISIT_KEY) || "null");
    if (saved && Number.isFinite(saved.start) && saved.start <= now) {
      start = saved.start; shown = saved.shown === true;
    }
  } catch { /* Storage may be disabled. The mounted component still remembers. */ }
  function markShown() {
    shown = true;
    try { storage.setItem(VISIT_KEY, JSON.stringify({ start, shown })); } catch { /* optional persistence */ }
  }
  try { storage.setItem(VISIT_KEY, JSON.stringify({ start, shown })); } catch { /* optional persistence */ }
  return { shown, remaining: Math.max(0, WELCOME_DELAY_MS - (now - start)), markShown };
}
export function welcomeRouteAllowed(path: string) {
  return !/^\/(signup|login|checkout|payment|cart|profile|orders|admin|driver|delivery|delivery-company)(\/|$)/.test(path);
}
