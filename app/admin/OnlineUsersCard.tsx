    "use client";

import {
  useEffect,
  useState,
} from "react";
import {
  FiEye,
  FiUser,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import {
  ONLINE_PRESENCE_CHANNEL,
} from "../OnlinePresenceTracker";

type PresencePayload = {
  page?: string;
  is_logged_in?: boolean;
  online_at?: string;
  presence_ref?: string;
};

type PresenceState = Record<
  string,
  PresencePayload[]
>;

type PageActivity = {
  page: string;
  count: number;
};

type ConnectionStatus =
  | "connecting"
  | "live"
  | "error";

function getTimestamp(
  value?: string
) {
  if (!value) {
    return 0;
  }

  const timestamp =
    Date.parse(value);

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : 0;
}

function getLatestPresence(
  presences: PresencePayload[]
) {
  if (
    presences.length === 0
  ) {
    return {};
  }

  return [...presences].sort(
    (
      firstPresence,
      secondPresence
    ) =>
      getTimestamp(
        secondPresence.online_at
      ) -
      getTimestamp(
        firstPresence.online_at
      )
  )[0];
}

function formatPageLabel(
  page: string
) {
  switch (page) {
    case "/":
      return "Home";

    case "/products":
      return "Products";

    case "/cart":
      return "Cart";

    case "/wishlist":
      return "Wishlist";

    case "/profile":
      return "Profile";

    case "/checkout":
      return "Checkout";

    case "/payment":
      return "Payment";

    case "/contact":
      return "Contact";

    case "/about":
      return "About";

    default:
      return page;
  }
}

export default function OnlineUsersCard() {
  const [
    onlineCount,
    setOnlineCount,
  ] = useState(0);

  const [
    customerCount,
    setCustomerCount,
  ] = useState(0);

  const [
    guestCount,
    setGuestCount,
  ] = useState(0);

  const [
    pageActivity,
    setPageActivity,
  ] = useState<PageActivity[]>(
    []
  );

  const [
    connectionStatus,
    setConnectionStatus,
  ] =
    useState<ConnectionStatus>(
      "connecting"
    );

  useEffect(() => {
    const channel =
      supabase.channel(
        ONLINE_PRESENCE_CHANNEL
      );

    function updatePresenceState() {
      const presenceState =
        channel.presenceState() as PresenceState;

      /*
        كل Presence key يمثل متصفحاً واحداً.
        فتح Tabs متعددة بنفس المتصفح
        يبقى محسوباً مرة واحدة.
      */
      const uniqueVisitors =
        Object.values(
          presenceState
        ).map(
          getLatestPresence
        );

      const loggedInVisitors =
        uniqueVisitors.filter(
          (presence) =>
            presence.is_logged_in ===
            true
        );

      const guests =
        uniqueVisitors.filter(
          (presence) =>
            presence.is_logged_in !==
            true
        );

      const pagesCount =
        uniqueVisitors.reduce(
          (
            accumulator: Record<
              string,
              number
            >,
            presence
          ) => {
            const page =
              typeof presence.page ===
                "string" &&
              presence.page.startsWith(
                "/"
              )
                ? presence.page
                : "/";

            accumulator[page] =
              (accumulator[page] ||
                0) + 1;

            return accumulator;
          },
          {}
        );

      const sortedPages =
        Object.entries(
          pagesCount
        )
          .map(
            ([page, count]) => ({
              page,
              count,
            })
          )
          .sort(
            (
              firstPage,
              secondPage
            ) =>
              secondPage.count -
              firstPage.count
          )
          .slice(0, 6);

      setOnlineCount(
        uniqueVisitors.length
      );

      setCustomerCount(
        loggedInVisitors.length
      );

      setGuestCount(
        guests.length
      );

      setPageActivity(
        sortedPages
      );
    }

    channel
      .on(
        "presence",
        {
          event: "sync",
        },
        updatePresenceState
      )
      .subscribe(
        (status, error) => {
          if (
            status ===
            "SUBSCRIBED"
          ) {
            setConnectionStatus(
              "live"
            );

            updatePresenceState();

            return;
          }

          if (
            status ===
              "CHANNEL_ERROR" ||
            status ===
              "TIMED_OUT"
          ) {
            setConnectionStatus(
              "error"
            );

            console.error(
              "Admin online presence error:",
              error
            );
          }
        }
      );

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, []);

  return (
    <section className="mt-6 overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-gray-100">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <FiUsers className="text-2xl" />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Online Now
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Live visitors currently
                    browsing the store.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                connectionStatus ===
                "live"
                  ? "bg-green-100 text-green-700"
                  : connectionStatus ===
                    "error"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  connectionStatus ===
                  "live"
                    ? "animate-pulse bg-green-500"
                    : connectionStatus ===
                      "error"
                    ? "bg-red-500"
                    : "animate-pulse bg-yellow-500"
                }`}
              />

              {connectionStatus ===
              "live"
                ? "Live"
                : connectionStatus ===
                  "error"
                ? "Connection error"
                : "Connecting"}
            </div>
          </div>

          <div className="mt-7 flex items-end gap-3">
            <p className="text-6xl font-extrabold tracking-tight text-gray-900">
              {onlineCount}
            </p>

            <p className="pb-2 text-sm font-bold text-gray-500">
              unique visitors
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl bg-green-50 p-4 ring-1 ring-green-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-green-800">
                    Registered customers
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-green-900">
                    {customerCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-green-700">
                  <FiUserCheck className="text-xl" />
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-blue-800">
                    Guests
                  </p>

                  <p className="mt-2 text-3xl font-extrabold text-blue-900">
                    {guestCount}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700">
                  <FiUser className="text-xl" />
                </div>
              </div>
            </article>
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-400">
            Multiple tabs from the same browser
            are counted once. Incognito or another
            browser is counted separately.
          </p>
        </div>

        <div className="rounded-[1.5rem] bg-gray-50 p-5 ring-1 ring-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
              <FiEye className="text-lg" />
            </div>

            <div>
              <h3 className="font-extrabold text-gray-900">
                Active Pages
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Pages visitors are viewing now.
              </p>
            </div>
          </div>

          {pageActivity.length === 0 ? (
            <div className="flex min-h-[180px] items-center justify-center text-center">
              <div>
                <FiUsers className="mx-auto text-3xl text-gray-300" />

                <p className="mt-3 text-sm font-bold text-gray-500">
                  No active visitors
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {pageActivity.map(
                (item) => (
                  <div
                    key={item.page}
                    className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 ring-1 ring-gray-100"
                  >
                    <p
                      dir="ltr"
                      className="min-w-0 truncate text-left text-sm font-bold text-gray-700"
                      title={item.page}
                    >
                      {formatPageLabel(
                        item.page
                      )}
                    </p>

                    <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full bg-green-100 px-2 text-xs font-extrabold text-green-700">
                      {item.count}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}