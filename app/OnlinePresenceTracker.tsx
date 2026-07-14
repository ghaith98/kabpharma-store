"use client";

import {
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export const ONLINE_PRESENCE_CHANNEL =
  "kab-store-online-users";

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
    const storedId =
      window.localStorage.getItem(
        PRESENCE_ID_STORAGE_KEY
      );

    if (storedId) {
      return storedId;
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
      window.localStorage.getItem(
        "kab_user"
      )
    );
  } catch {
    return false;
  }
}

export default function OnlinePresenceTracker() {
  const pathname = usePathname();

  const pathnameRef =
    useRef(pathname);

  const channelRef =
    useRef<RealtimeChannel | null>(
      null
    );

  const subscribedRef =
    useRef(false);

  async function trackCurrentPresence() {
    const channel =
      channelRef.current;

    if (
      !channel ||
      !subscribedRef.current
    ) {
      return;
    }
  }

  useEffect(() => {
    pathnameRef.current =
      pathname || "/";

    if (subscribedRef.current) {
      void trackCurrentPresence();
    }
  }, [pathname]);

  useEffect(() => {
    const presenceId =
      getOrCreatePresenceId();

   const channel =
  supabase.channel(
    ONLINE_PRESENCE_CHANNEL,
    {
      config: {
        presence: {
          key: presenceId,
          enabled: true,
        },
      },
    }
  );

    channelRef.current =
      channel;

    channel.subscribe(
      (status, error) => {
        if (
          status === "SUBSCRIBED"
        ) {
          subscribedRef.current =
            true;

          void trackCurrentPresence();

          return;
        }

        if (
          status ===
            "CHANNEL_ERROR" ||
          status === "TIMED_OUT"
        ) {
          console.error(
            "Online presence connection error:",
            error
          );
        }
      }
    );

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void trackCurrentPresence();
      }
    }

    window.addEventListener(
      "focus",
      trackCurrentPresence
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      subscribedRef.current =
        false;

      window.removeEventListener(
        "focus",
        trackCurrentPresence
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      channelRef.current = null;

      void supabase.removeChannel(
        channel
      );
    };
  }, []);

  return null;
}