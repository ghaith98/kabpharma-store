"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  profile_id: number | string;
  full_name: string | null;
  phone: string;
  created_at: string | null;

  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  unbanned_at: string | null;

  orders_count: number | string | null;
  delivered_orders_count: number | string | null;
  total_spent: number | string | null;
};

type BanResult = {
  phone: string;
  is_banned: boolean;
  reason: string | null;
  banned_at: string | null;
  unbanned_at: string | null;
};

type BanModalState = {
  open: boolean;
  user: AdminUser | null;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  const [updatingPhone, setUpdatingPhone] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "all" | "active" | "banned"
  >("all");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [banModal, setBanModal] =
    useState<BanModalState>({
      open: false,
      user: null,
    });

  const [banReason, setBanReason] = useState("");

  function getBanResult(data: unknown): BanResult | null {
    if (!data) {
      return null;
    }

    if (Array.isArray(data)) {
      return (data[0] as BanResult | undefined) || null;
    }

    return data as BanResult;
  }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase.rpc(
      "admin_list_users"
    );

    if (error) {
      console.error("Failed to load users:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setErrorMessage(
        [
          error.message,
          error.details,
          error.hint,
          error.code,
        ]
          .filter(Boolean)
          .join(" — ") || "Could not load users."
      );

      setLoading(false);
      return;
    }

    setUsers((data || []) as AdminUser[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initializePage() {
      const { data, error } =
        await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/admin/login");
        return;
      }

      await loadUsers();

      if (mounted) {
        setChecking(false);
      }
    }

    initializePage();

    return () => {
      mounted = false;
    };
  }, [loadUsers, router]);

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  }

  function openBanModal(user: AdminUser) {
    setBanReason("");
    setMessage("");
    setErrorMessage("");

    setBanModal({
      open: true,
      user,
    });
  }

  function closeBanModal() {
    if (updatingPhone) {
      return;
    }

    setBanModal({
      open: false,
      user: null,
    });

    setBanReason("");
  }

  async function banUser() {
    const user = banModal.user;

    if (!user) {
      return;
    }

    setUpdatingPhone(user.phone);
    setMessage("");
    setErrorMessage("");

    const normalizedReason = banReason.trim();

    const { data, error } = await supabase.rpc(
      "admin_set_user_ban",
      {
        p_phone: user.phone,
        p_banned: true,
        p_reason: normalizedReason || null,
      }
    );

    if (error) {
      console.error("Failed to ban user:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setErrorMessage(
        [
          error.message,
          error.details,
          error.hint,
          error.code,
        ]
          .filter(Boolean)
          .join(" — ") || "Could not ban user."
      );

      setUpdatingPhone(null);
      return;
    }

    const result = getBanResult(data);
    const bannedAt =
      result?.banned_at || new Date().toISOString();

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.phone === user.phone
          ? {
              ...currentUser,
              is_banned: true,
              ban_reason:
                result?.reason ||
                normalizedReason ||
                null,
              banned_at: bannedAt,
              unbanned_at: null,
            }
          : currentUser
      )
    );

    setUpdatingPhone(null);

    setBanModal({
      open: false,
      user: null,
    });

    setBanReason("");

    setMessage(
      `${user.full_name || user.phone} has been banned from placing new orders.`
    );

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  async function unbanUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Unban ${
        user.full_name || user.phone
      }? This user will be able to place new orders again.`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingPhone(user.phone);
    setMessage("");
    setErrorMessage("");

    const { data, error } = await supabase.rpc(
      "admin_set_user_ban",
      {
        p_phone: user.phone,
        p_banned: false,
        p_reason: null,
      }
    );

    if (error) {
      console.error("Failed to unban user:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setErrorMessage(
        [
          error.message,
          error.details,
          error.hint,
          error.code,
        ]
          .filter(Boolean)
          .join(" — ") || "Could not unban user."
      );

      setUpdatingPhone(null);
      return;
    }

    const result = getBanResult(data);

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.phone === user.phone
          ? {
              ...currentUser,
              is_banned: false,
              ban_reason: null,
              banned_at:
                currentUser.banned_at,
              unbanned_at:
                result?.unbanned_at ||
                new Date().toISOString(),
            }
          : currentUser
      )
    );

    setUpdatingPhone(null);

    setMessage(
      `${user.full_name || user.phone} has been unbanned and can place orders again.`
    );

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  const filteredUsers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" &&
          !user.is_banned) ||
        (filter === "banned" &&
          user.is_banned);

      const searchableText = [
        user.profile_id,
        user.full_name,
        user.phone,
        user.ban_reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(
          normalizedSearch
        );

      return matchesFilter && matchesSearch;
    });
  }, [users, search, filter]);

  const bannedCount = users.filter(
    (user) => user.is_banned
  ).length;

  const activeCount =
    users.length - bannedCount;

  const totalOrders = users.reduce(
    (sum, user) =>
      sum + Number(user.orders_count || 0),
    0
  );

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-center font-bold text-gray-700">
          Checking admin access...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wider text-green-700">
                KAB Pharma
              </p>

              <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Users
              </h1>

              <p className="mt-2 text-gray-600">
                View customer accounts and control
                their ability to place new orders.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadUsers}
                disabled={loading}
                className="rounded-2xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 transition hover:border-green-600 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <Link
                href="/admin"
                className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Messages */}
        {message && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 font-bold text-green-800">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
            Error: {errorMessage}
          </div>
        )}

        {/* Statistics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <p className="text-sm font-bold text-gray-500">
              Total Users
            </p>

            <p className="mt-2 text-4xl font-extrabold text-gray-900">
              {users.length}
            </p>
          </div>

          <div className="rounded-3xl bg-green-50 p-5 shadow-sm ring-1 ring-green-100">
            <p className="text-sm font-bold text-green-700">
              Active Users
            </p>

            <p className="mt-2 text-4xl font-extrabold text-green-800">
              {activeCount}
            </p>
          </div>

          <div className="rounded-3xl bg-red-50 p-5 shadow-sm ring-1 ring-red-100">
            <p className="text-sm font-bold text-red-700">
              Purchase Restricted
            </p>

            <p className="mt-2 text-4xl font-extrabold text-red-800">
              {bannedCount}
            </p>
          </div>

          <div className="rounded-3xl bg-blue-50 p-5 shadow-sm ring-1 ring-blue-100">
            <p className="text-sm font-bold text-blue-700">
              Total Orders
            </p>

            <p className="mt-2 text-4xl font-extrabold text-blue-800">
              {totalOrders}
            </p>
          </div>
        </section>

        {/* Search and filters */}
        <section className="mt-6 rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, phone or ban reason..."
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-900 outline-none transition focus:border-green-600 focus:bg-white"
            />

            <div className="flex overflow-x-auto rounded-2xl bg-gray-50 p-1">
              {[
                {
                  value: "all" as const,
                  label: `All (${users.length})`,
                },
                {
                  value: "active" as const,
                  label: `Active (${activeCount})`,
                },
                {
                  value: "banned" as const,
                  label: `Restricted (${bannedCount})`,
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setFilter(item.value)
                  }
                  className={`shrink-0 rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                    filter === item.value
                      ? "bg-green-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {!loading &&
          filteredUsers.length === 0 && (
            <section className="mt-6 rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-gray-100">
              <div className="text-5xl">
                👥
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
                No users found
              </h2>

              <p className="mt-2 text-gray-600">
                No users match the selected
                search and filter.
              </p>
            </section>
          )}

        {/* Desktop table */}
        {filteredUsers.length > 0 && (
          <section className="mt-6 hidden overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-extrabold">
                      Customer
                    </th>

                    <th className="px-6 py-4 font-extrabold">
                      Registered
                    </th>

                    <th className="px-6 py-4 font-extrabold">
                      Orders
                    </th>

                    <th className="px-6 py-4 font-extrabold">
                      Delivered
                    </th>

                    <th className="px-6 py-4 font-extrabold">
                      Total Spent
                    </th>

                    <th className="px-6 py-4 font-extrabold">
                      Status
                    </th>

                    <th className="px-6 py-4 font-extrabold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => {
                    const updating =
                      updatingPhone ===
                      user.phone;

                    return (
                      <tr
                        key={user.phone}
                        className={
                          user.is_banned
                            ? "bg-red-50/50"
                            : "transition hover:bg-gray-50"
                        }
                      >
                        <td className="px-6 py-5">
                          <p className="font-extrabold text-gray-900">
                            {user.full_name ||
                              "Unnamed user"}
                          </p>

                          <p
                            dir="ltr"
                            className="mt-1 text-sm text-gray-600"
                          >
                            +{user.phone}
                          </p>

                          {user.is_banned &&
                            user.ban_reason && (
                              <p className="mt-2 max-w-[280px] break-words text-xs font-bold text-red-700">
                                Internal reason:{" "}
                                {user.ban_reason}
                              </p>
                            )}
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold text-gray-700">
                          {formatDate(
                            user.created_at
                          )}
                        </td>

                        <td className="px-6 py-5 font-extrabold text-gray-900">
                          {Number(
                            user.orders_count || 0
                          )}
                        </td>

                        <td className="px-6 py-5 font-extrabold text-green-700">
                          {Number(
                            user.delivered_orders_count ||
                              0
                          )}
                        </td>

                        <td className="px-6 py-5 font-extrabold text-gray-900">
                          {Number(
                            user.total_spent || 0
                          ).toLocaleString()}{" "}
                          SYP
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${
                              user.is_banned
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.is_banned
                              ? "Purchase Restricted"
                              : "Active"}
                          </span>

                          {user.is_banned && (
                            <p className="mt-2 text-xs text-gray-500">
                              Since{" "}
                              {formatDate(
                                user.banned_at
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          {user.is_banned ? (
                            <button
                              type="button"
                              disabled={updating}
                              onClick={() =>
                                unbanUser(user)
                              }
                              className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updating
                                ? "Updating..."
                                : "Unban"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={updating}
                              onClick={() =>
                                openBanModal(user)
                              }
                              className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updating
                                ? "Updating..."
                                : "Ban Purchases"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Mobile cards */}
        <section className="mt-6 space-y-4 lg:hidden">
          {filteredUsers.map((user) => {
            const updating =
              updatingPhone === user.phone;

            return (
              <article
                key={user.phone}
                className={`rounded-[2rem] border p-5 shadow-sm ${
                  user.is_banned
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-extrabold text-gray-900">
                      {user.full_name ||
                        "Unnamed user"}
                    </h2>

                    <p
                      dir="ltr"
                      className="mt-1 break-all text-left text-sm font-semibold text-gray-600"
                    >
                      +{user.phone}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${
                      user.is_banned
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.is_banned
                      ? "Restricted"
                      : "Active"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/70 p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Orders
                    </p>

                    <p className="mt-1 text-2xl font-extrabold text-gray-900">
                      {Number(
                        user.orders_count || 0
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/70 p-3">
                    <p className="text-xs font-bold text-gray-500">
                      Delivered
                    </p>

                    <p className="mt-1 text-2xl font-extrabold text-green-700">
                      {Number(
                        user.delivered_orders_count ||
                          0
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-bold text-gray-500">
                    Total Spent
                  </p>

                  <p className="mt-1 text-lg font-extrabold text-gray-900">
                    {Number(
                      user.total_spent || 0
                    ).toLocaleString()}{" "}
                    SYP
                  </p>

                  <p className="mt-3 text-xs font-bold text-gray-500">
                    Registered
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-700">
                    {formatDate(
                      user.created_at
                    )}
                  </p>
                </div>

                {user.is_banned && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-white/70 p-4">
                    <p className="text-xs font-extrabold uppercase text-red-700">
                      Internal restriction details
                    </p>

                    <p className="mt-2 break-words text-sm font-bold text-gray-800">
                      {user.ban_reason ||
                        "No reason provided"}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Restricted at:{" "}
                      {formatDate(
                        user.banned_at
                      )}
                    </p>
                  </div>
                )}

                {user.is_banned ? (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      unbanUser(user)
                    }
                    className="mt-4 w-full rounded-2xl bg-green-600 px-5 py-3 font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {updating
                      ? "Updating..."
                      : "Allow Purchases Again"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      openBanModal(user)
                    }
                    className="mt-4 w-full rounded-2xl bg-red-600 px-5 py-3 font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {updating
                      ? "Updating..."
                      : "Restrict Purchases"}
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </div>

      {/* Ban modal */}
      {banModal.open && banModal.user && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold uppercase text-red-600">
                  Restrict purchases
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-gray-900">
                  {banModal.user.full_name ||
                    banModal.user.phone}
                </h2>

                <p
                  dir="ltr"
                  className="mt-1 text-left text-sm text-gray-600"
                >
                  +{banModal.user.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBanModal}
                disabled={Boolean(
                  updatingPhone
                )}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-gray-600">
              This customer will still be able to
              sign in, view products and access old
              orders, but will not be able to place
              new orders.
            </p>

            <label className="mt-5 block">
              <span className="text-sm font-extrabold text-gray-800">
                Internal reason
              </span>

              <textarea
                value={banReason}
                onChange={(event) =>
                  setBanReason(
                    event.target.value
                  )
                }
                rows={4}
                maxLength={500}
                placeholder="Example: Repeated fake orders or abusive behavior..."
                className="mt-2 w-full resize-none rounded-2xl border border-gray-300 p-4 text-gray-900 outline-none transition focus:border-red-500"
              />
            </label>

            <p className="mt-2 text-right text-xs font-semibold text-gray-400">
              {banReason.length}/500
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeBanModal}
                disabled={Boolean(
                  updatingPhone
                )}
                className="rounded-2xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={banUser}
                disabled={Boolean(
                  updatingPhone
                )}
                className="rounded-2xl bg-red-600 px-5 py-3 font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingPhone
                  ? "Saving..."
                  : "Confirm Restriction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
