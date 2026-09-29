"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/*
  Storefront "online users" presence.

  Every open tab holds a Supabase Realtime websocket and every presence
  change is fanned out to every member of the channel, so cost grows with
  (visitors x visitors). To keep that bounded:

  - The socket opens only after the page is idle and the tab is visible.
  - It is closed when the tab stays hidden for HIDDEN_DISCONNECT_MS, and
    reopened when the visitor returns. Quick tab switches do nothing.
  - Presence is re-sent only when the route changes (no focus/visibility
    re-broadcasts).
  - NEXT_PUBLIC_ENABLE_PRESENCE="false" turns the feature off entirely.
*/

const ONLINE_PRESENCE_CHANNEL = "kab-store-online-users-v3";
const PRESENCE_ID_STORAGE_KEY = "kab_presence_id";
const START_DELAY_MS = 4_000;
const HIDDEN_DISCONNECT_MS = 60_000;

const PRESENCE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PRESENCE !== "false";

function createPresenceId() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreatePresenceId() {
  try {
    const savedId = localStorage.getItem(PRESENCE_ID_STORAGE_KEY);
    if (savedId) return savedId;

    const id = createPresenceId();
    localStorage.setItem(PRESENCE_ID_STORAGE_KEY, id);
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

  const track = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !subscribedRef.current) return;

    void channel
      .track({
        page: pathnameRef.current,
        is_logged_in: isCustomerLoggedIn(),
        online_at: new Date().toISOString(),
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    pathnameRef.current = pathname || "/";
    track();
  }, [pathname, track]);

  useEffect(() => {
    if (!PRESENCE_ENABLED) return;

    let disposed = false;
    let startTimer: number | null = null;
    let hiddenTimer: number | null = null;

    function connect() {
      if (disposed || channelRef.current) return;

      const channel = supabase.channel(ONLINE_PRESENCE_CHANNEL, {
        config: {
          presence: { key: getOrCreatePresenceId() },
        },
      });

      channelRef.current = channel;

      channel.subscribe((status) => {
        if (disposed || channelRef.current !== channel) return;

        if (status === "SUBSCRIBED") {
          subscribedRef.current = true;
          track();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          subscribedRef.current = false;
        }
      });
    }

    function disconnect() {
      const channel = channelRef.current;
      channelRef.current = null;
      subscribedRef.current = false;

      if (channel) {
        void channel.untrack().catch(() => undefined);
        void supabase.removeChannel(channel).catch(() => undefined);
      }
    }

    function scheduleConnect(delay: number) {
      if (startTimer !== null) window.clearTimeout(startTimer);
      startTimer = window.setTimeout(() => {
        startTimer = null;
        if (document.visibilityState === "visible") connect();
      }, delay);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        if (hiddenTimer === null) {
          hiddenTimer = window.setTimeout(() => {
            hiddenTimer = null;
            disconnect();
          }, HIDDEN_DISCONNECT_MS);
        }
        return;
      }

      if (hiddenTimer !== null) {
        window.clearTimeout(hiddenTimer);
        hiddenTimer = null;
      }

      if (!channelRef.current) scheduleConnect(500);
    }

    scheduleConnect(START_DELAY_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      if (startTimer !== null) window.clearTimeout(startTimer);
      if (hiddenTimer !== null) window.clearTimeout(hiddenTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      disconnect();
    };
  }, [track]);

  return null;
}
