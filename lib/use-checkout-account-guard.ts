"use client";

import {useEffect, useEffectEvent} from "react";
import {checkoutAccountId, clearCheckoutAttemptKeys} from "./checkout-session";

/** Reset an open delivery/payment screen if another tab changes its account. */
export function useCheckoutAccountGuard(profileId: string | null, reset: () => void) {
  const onChanged = useEffectEvent(reset);
  useEffect(() => {
    if (!profileId) return;
    let alive = true;
    const controller = new AbortController();
    function changed() {
      if (!alive) return;
      alive = false;
      try { clearCheckoutAttemptKeys(window.sessionStorage); } catch { /* Storage is optional. */ }
      onChanged();
      window.location.reload();
    }
    function storageChanged(event: StorageEvent) {
      if (event.key !== "kab_user" && event.key !== null) return;
      let id = null;
      try { id = checkoutAccountId(JSON.parse(event.newValue || "null")?.id); } catch { /* Invalid means unverified. */ }
      if (id !== profileId) changed();
    }
    async function verify() {
      if (document.visibilityState !== "visible" || !alive) return;
      try {
        const response = await fetch("/api/customer/me", {cache:"no-store",credentials:"include",signal:controller.signal});
        if (response.status === 401) { changed(); return; }
        if (!response.ok) return;
        const result = await response.json();
        if (checkoutAccountId(result.user?.id) !== profileId) changed();
      } catch { /* Submission verifies again; network failures do not assert a logout. */ }
    }
    window.addEventListener("storage", storageChanged);
    window.addEventListener("focus", verify);
    document.addEventListener("visibilitychange", verify);
    return () => {alive=false;controller.abort();window.removeEventListener("storage",storageChanged);window.removeEventListener("focus",verify);document.removeEventListener("visibilitychange",verify);};
  }, [profileId]);
}
