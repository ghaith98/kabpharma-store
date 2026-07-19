"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const ONLINE_PRESENCE_CHANNEL =
  "kab-store-online-users-v3";
const PRESENCE_ID_STORAGE_KEY =
  "kab_presence_id";
const START_DELAY_MS = 1_500;

function createPresenceId() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getOrCreatePresenceId() {
  try {
    const savedId = localStorage.getItem(
      PRESENCE_ID_STORAGE_KEY
    );

    if (savedId) return savedId;

    const id = createPresenceId();

    localStorage.setItem(
      PRESENCE_ID_STORAGE_KEY,
      id
    );

    return id;
  } catch {
    return createPresenceId();
  }
}

function isCustomerLoggedIn() {
  try {
    return Boolean(localStorage.getItem("kab_user"));
  } catch {
    return false;
  }
}

export default function OnlinePresenceTracker() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname || "/");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);

  const trackCurrentPresence = useCallback(async () => {
    const channel = channelRef.current;

    if (!channel || !subscribedRef.current) return;

    try {
      await channel.track({
        page: pathnameRef.current,
        is_logged_in: isCustomerLoggedIn(),
        online_at: new Date().toISOString(),
      });
    } catch {
      // Presence analytics must never affect storefront UX.
    }
  }, []);

  useEffect(() => {
    pathnameRef.current = pathname || "/";

    if (subscribedRef.current) {
      void trackCurrentPresence();
    }
  }, [pathname, trackCurrentPresence]);

  useEffect(() => {
    let disposed = false;
    let channel: RealtimeChannel | null = null;

    function handleFocus() {
      if (!disposed) {
        void trackCurrentPresence();
      }
    }

    function handleVisibilityChange() {
      if (
        !disposed &&
        document.visibilityState === "visible"
      ) {
        void trackCurrentPresence();
      }
    }

    const startTimer = window.setTimeout(() => {
      if (disposed) return;

      channel = supabase.channel(
        ONLINE_PRESENCE_CHANNEL,
        {
          config: {
            presence: {
              key: getOrCreatePresenceId(),
            },
          },
        }
      );
      channelRef.current = channel;

      channel.subscribe(async (status) => {
        if (disposed) return;

        if (status === "SUBSCRIBED") {
          subscribedRef.current = true;
          await trackCurrentPresence();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          subscribedRef.current = false;
        }
      });

      window.addEventListener("focus", handleFocus);
      document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    }, START_DELAY_MS);

    return () => {
      disposed = true;
      subscribedRef.current = false;
      window.clearTimeout(startTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (channelRef.current === channel) {
        channelRef.current = null;
      }

      if (channel) {
        void channel.untrack().catch(() => undefined);
        void supabase
          .removeChannel(channel)
          .catch(() => undefined);
      }
    };
  }, [trackCurrentPresence]);

  return null;
}
