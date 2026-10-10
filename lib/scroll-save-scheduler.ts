/** Batch synchronous sessionStorage writes while scrolling; flush before leaving. */
export function createScrollSaveScheduler(
  save: (top: number, pageKey: string) => void,
  delayMs = 150
) {
  let pending: { top: number; pageKey: string } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function flush() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    const value = pending;
    pending = null;
    if (value) save(value.top, value.pageKey);
  }

  function schedule(top: number, pageKey: string) {
    // Never let a later route overwrite the previous route's pending position.
    if (pending && pending.pageKey !== pageKey) flush();
    pending = { top, pageKey };
    if (timer === null) timer = setTimeout(flush, delayMs);
  }

  return { schedule, flush };
}
