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

function createPresenceId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getOrCreatePresenceId() {
  try {
    const savedId = window.localStorage.getItem(
      PRESENCE_ID_STORAGE_KEY
    );

    if (savedId) {
      return savedId;
    }

    const newId = createPresenceId();

    window.localStorage.setItem(
      PRESENCE_ID_STORAGE_KEY,
      newId
    );

    return newId;
  } catch {
    return createPresenceId();
  }
}

function isCustomerLoggedIn() {
  try {
    return Boolean(
      window.localStorage.getItem("kab_user")
    );
  } catch {
    return false;
  }
}

export default function OnlinePresenceTracker() {
  const pathname = usePathname();

  const pathnameRef = useRef(pathname || "/");

  const channelRef =
    useRef<RealtimeChannel | null>(null);

  const subscribedRef = useRef(false);

  const trackCurrentPresence =
    useCallback(async () => {
      const channel = channelRef.current;

      if (!channel || !subscribedRef.current) {
        return;
      }

      try {
        const result = await channel.track({
          page: pathnameRef.current || "/",

          is_logged_in: isCustomerLoggedIn(),

          online_at: new Date().toISOString(),
        });

        if (result !== "ok") {
          console.warn(
            "[Customer Presence] Tracking result:",
            result
          );
        }
      } catch (error) {
        console.warn(
          "[Customer Presence] Tracking error:",
          error
        );
      }
    }, []);

  // Update presence when pathname changes
  useEffect(() => {
    pathnameRef.current = pathname || "/";

    if (subscribedRef.current) {
      void trackCurrentPresence();
    }
  }, [pathname, trackCurrentPresence]);

  // Open Presence channel
  useEffect(() => {
    let disposed = false;

    const presenceId = getOrCreatePresenceId();

    const channel = supabase
      .channel(ONLINE_PRESENCE_CHANNEL, {
        config: {
          presence: {
            key: presenceId,
          },
        },
      })
      .on(
        "presence",
        {
          event: "sync",
        },
        () => {
          if (disposed) return;

          console.log(
            "[Customer Presence] Sync:",
            channel.presenceState()
          );
        }
      )
      .on(
        "presence",
        {
          event: "join",
        },
        (payload) => {
          if (disposed) return;

          console.log(
            "[Customer Presence] Join:",
            payload
          );
        }
      )
      .on(
        "presence",
        {
          event: "leave",
        },
        (payload) => {
          if (disposed) return;

          console.log(
            "[Customer Presence] Leave:",
            payload
          );
        }
      );

    channelRef.current = channel;

    channel.subscribe(async (status, error) => {
      // Ignore statuses emitted after normal cleanup
      if (disposed) return;

      console.log(
        "[Customer Presence] Channel:",
        status,
        error || ""
      );

      if (status === "SUBSCRIBED") {
        subscribedRef.current = true;

        await trackCurrentPresence();
        return;
      }

      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT"
      ) {
        subscribedRef.current = false;

        console.warn(
          "[Customer Presence] Connection problem:",
          status,
          error
        );

        return;
      }

      // CLOSED is not necessarily an error.
      // It normally occurs during cleanup/removal.
      if (status === "CLOSED") {
        subscribedRef.current = false;

        console.log(
          "[Customer Presence] Channel closed"
        );
      }
    });

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

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      disposed = true;
      subscribedRef.current = false;

      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (channelRef.current === channel) {
        channelRef.current = null;
      }

      void (async () => {
        try {
          await channel.untrack();
        } catch {
          // The channel may already be closed during cleanup.
        }

        try {
          await supabase.removeChannel(channel);
        } catch (error) {
          console.warn(
            "[Customer Presence] Cleanup warning:",
            error
          );
        }
      })();
    };
  }, [trackCurrentPresence]);

  return null;
}