"use client";
import { useEffect } from "react";

/** Poll only a private revision counter. Download orders only after a change.
 * Pauses in background tabs, refreshes when returning online/visible, and
 * never overlaps polls. No customer data is sent through public channels. */
export function useOrderFeed(
  refresh: () => Promise<void | boolean>,
  endpoint = "/api/staff/order-feed",
  authorization?: () => Promise<string>,
) {
  useEffect(() => {
    let disposed = false;
    let running = false;
    let stopped = false;
    let revision: string | null = null;
    let controller: AbortController | null = null;
    async function check(force = false) {
      if (disposed || stopped || running || document.visibilityState === "hidden") return;
      running = true;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 10_000);
      try {
        const token = authorization ? await authorization() : "";
        if (disposed || controller.signal.aborted) return;
        const response = await fetch(endpoint, { credentials: "include", cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal });
        if (disposed) return;
        if (response.status === 401 || response.status === 403) { stopped = true; await refresh(); return; }
        if (!response.ok) return;
        const data = await response.json();
        if (disposed || typeof data.revision !== "string") return;
        if (force || revision !== data.revision) {
          // Store the observed revision only after loading succeeds. A later
          // change during that load is picked up by the next poll.
          const loaded = await refresh();
          if (loaded !== false) revision = data.revision;
        }
      } catch { /* Keep the last revision; retry after transient network errors. */ }
      finally { window.clearTimeout(timeout); running = false; }
    }
    const interval = window.setInterval(() => void check(), 5000);
    const resume = () => void check(true);
    const visibility = () => { if (document.visibilityState === "hidden") controller?.abort(); else resume(); };
    window.addEventListener("focus", resume);
    window.addEventListener("online", resume);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true; controller?.abort(); window.clearInterval(interval);
      window.removeEventListener("focus", resume); window.removeEventListener("online", resume);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [refresh, endpoint, authorization]);
}
