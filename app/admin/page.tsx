"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
  FiUserCheck,
  FiXCircle,
} from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import OnlineUsersCard from "./OnlineUsersCard";

type NewOrderPayload = {
  id?: number;
  status?: string;
  payment_proof_path?: string | null;
};

type RecentOrder = {
  id: number;
  customer_name: string | null;
  phone: string | null;
  payment_method: string | null;
  cod_fee: number | string | null;
  total_price: number | string | null;
  status: string | null;
  created_at: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [ordersCount, setOrdersCount] =
    useState(0);

  const [pendingCount, setPendingCount] =
    useState(0);

  const [
    paymentProofCount,
    setPaymentProofCount,
  ] = useState(0);

  const [deliveryCount, setDeliveryCount] =
    useState(0);

  const [deliveredCount, setDeliveredCount] =
    useState(0);

  const [rejectedCount, setRejectedCount] =
    useState(0);

  const [cancelledCount, setCancelledCount] =
    useState(0);

  const [revenue, setRevenue] = useState(0);

  const [recentOrders, setRecentOrders] =
    useState<RecentOrder[]>([]);

  const [checking, setChecking] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [notification, setNotification] =
    useState("");

  const loadDashboard = useCallback(async () => {
    const [
      ordersResult,
      pendingResult,
      paymentProofResult,
      deliveryResult,
      deliveredResult,
      rejectedResult,
      cancelledResult,
      revenueResult,
      recentOrdersResult,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .neq(
          "status",
          "cancelled_by_customer"
        ),

      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "pending"),

      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "pending")
        .not(
          "payment_proof_path",
          "is",
          null
        )
        .is(
          "payment_proof_deleted_at",
          null
        ),

      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "out_for_delivery"
        ),

      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "delivered"),

      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "rejected"),

      supabase
        .from("orders")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "cancelled_by_customer"
        ),

      supabase
        .from("orders")
        .select("total_price")
        .eq("status", "delivered"),

      supabase
        .from("orders")
        .select(
          "id, customer_name, phone, payment_method, cod_fee, total_price, status, created_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(6),
    ]);

    const firstError =
      ordersResult.error ||
      pendingResult.error ||
      paymentProofResult.error ||
      deliveryResult.error ||
      deliveredResult.error ||
      rejectedResult.error ||
      cancelledResult.error ||
      revenueResult.error ||
      recentOrdersResult.error;

    if (firstError) {
      console.error(
        "Failed to load dashboard:",
        firstError
      );

      return;
    }

    setOrdersCount(ordersResult.count || 0);
    setPendingCount(
      pendingResult.count || 0
    );
    setPaymentProofCount(
      paymentProofResult.count || 0
    );
    setDeliveryCount(
      deliveryResult.count || 0
    );
    setDeliveredCount(
      deliveredResult.count || 0
    );
    setRejectedCount(
      rejectedResult.count || 0
    );
    setCancelledCount(
      cancelledResult.count || 0
    );

    const totalRevenue =
      revenueResult.data?.reduce(
        (sum, order) =>
          sum +
          Number(order.total_price || 0),
        0
      ) || 0;

    setRevenue(totalRevenue);

    setRecentOrders(
      (recentOrdersResult.data ||
        []) as RecentOrder[]
    );
  }, []);

  async function refreshDashboard() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  useEffect(() => {
    let mounted = true;

    async function initializeDashboard() {
      const { data, error } =
        await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/admin/login");
        return;
      }

      await loadDashboard();

      if (mounted) {
        setChecking(false);
      }
    }

    initializeDashboard();

    return () => {
      mounted = false;
    };
  }, [loadDashboard, router]);

  useEffect(() => {
    if (checking) {
      return;
    }

    const channel = supabase
      .channel("admin-dashboard-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const newOrder =
            payload.new as NewOrderPayload;

          await loadDashboard();

          if (
            newOrder.status === "pending" &&
            newOrder.payment_proof_path
          ) {
            setNotification(
              newOrder.id
                ? `New payment proof received — Order #${newOrder.id}`
                : "A new payment proof was received."
            );

            window.setTimeout(() => {
              setNotification("");
            }, 6000);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        async () => {
          await loadDashboard();
        }
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Dashboard Realtime error:",
            error
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checking, loadDashboard]);

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusClasses(status: string | null) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";

      case "accepted":
        return "bg-purple-100 text-purple-800";

      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";

      case "delivered":
        return "bg-green-100 text-green-800";

      case "rejected":
        return "bg-red-100 text-red-800";

      case "cancelled_by_customer":
        return "bg-gray-200 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getStatusLabel(status: string | null) {
    switch (status) {
      case "pending":
        return "Pending";

      case "accepted":
        return "Accepted";

      case "out_for_delivery":
        return "Out for delivery";

      case "delivered":
        return "Delivered";

      case "rejected":
        return "Rejected";

      case "cancelled_by_customer":
        return "Cancelled";

      default:
        return status || "Unknown";
    }
  }

  const stats = [
    {
      label: "Total Orders",
      value: ordersCount,
      icon: FiShoppingBag,
      iconClasses:
        "bg-gray-100 text-gray-700",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: FiClock,
      iconClasses:
        "bg-yellow-100 text-yellow-700",
    },
    {
      label: "On the Road",
      value: deliveryCount,
      icon: FiTruck,
      iconClasses:
        "bg-blue-100 text-blue-700",
    },
    {
      label: "Delivered",
      value: deliveredCount,
      icon: FiCheckCircle,
      iconClasses:
        "bg-green-100 text-green-700",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      icon: FiXCircle,
      iconClasses:
        "bg-red-100 text-red-700",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      icon: FiBox,
      iconClasses:
        "bg-gray-200 text-gray-700",
    },
  ];

  const quickActions = [
    {
      href: "/admin/payment-proofs",
      title: "Review receipts",
      description:
        "Review new payment proofs.",
      icon: FiFileText,
      classes:
        "bg-yellow-50 text-yellow-800 ring-yellow-100",
    },
    {
      href: "/admin/orders",
      title: "Manage orders",
      description:
        "Update and follow shop orders.",
      icon: FiShoppingBag,
      classes:
        "bg-blue-50 text-blue-800 ring-blue-100",
    },
    {
      href: "/admin/products",
      title: "Manage products",
      description:
        "Add products and update stock.",
      icon: FiPackage,
      classes:
        "bg-green-50 text-green-800 ring-green-100",
    },
    {
      href: "/admin/users",
      title: "Manage users",
      description:
        "Review and restrict accounts.",
      icon: FiUserCheck,
      classes:
        "bg-purple-50 text-purple-800 ring-purple-100",
    },
  ];

  if (checking) {
    return (
      <main className="min-h-[calc(100vh-74px)] px-6 py-10">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />

            <p className="mt-4 font-bold text-gray-600">
              Loading dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-74px)] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Live notification */}
      {notification && (
        <Link
          href="/admin/payment-proofs"
          className="fixed right-5 top-20 z-[100] w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-yellow-200 bg-white p-5 shadow-2xl transition hover:-translate-y-0.5 lg:top-24"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              <FiFileText className="text-xl" />
            </div>

            <div>
              <p className="font-extrabold text-gray-900">
                New payment proof
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {notification}
              </p>

              <p className="mt-2 text-sm font-bold text-green-700">
                Open inbox →
              </p>
            </div>
          </div>
        </Link>
      )}

      <div className="mx-auto max-w-[1500px]">
        {/* Welcome section */}
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#123d2d] via-[#17603f] to-[#198754] text-white shadow-xl shadow-green-950/10">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-green-200">
                KAB Pharma
              </p>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Welcome back
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-green-50/90 sm:text-base">
                Here is a quick overview of your
                orders, payments and store
                performance.
              </p>

              <button
                type="button"
                onClick={refreshDashboard}
                disabled={refreshing}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-60"
              >
                <FiRefreshCw
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh data"}
              </button>
            </div>

            <div className="min-w-[260px] rounded-[1.5rem] border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-green-100">
                    Delivered revenue
                  </p>

                  <p className="mt-2 text-3xl font-extrabold">
                    {revenue.toLocaleString()}
                  </p>

                  <p className="mt-1 text-sm font-bold text-green-200">
                    SYP
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <FiCreditCard className="text-2xl" />
                </div>
              </div>
            </div>
          </div>
        </section>
        <OnlineUsersCard />

        {/* Payment proof notification */}
        <Link
          href="/admin/payment-proofs"
          className={`mt-6 flex flex-col justify-between gap-4 rounded-[1.5rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center ${
            paymentProofCount > 0
              ? "border-yellow-200 bg-yellow-50"
              : "border-green-200 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl p-4 ${
                paymentProofCount > 0
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              <FiFileText className="text-2xl" />
            </div>

            <div>
              <h2 className="font-extrabold text-gray-900">
                Payment Proof Inbox
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                {paymentProofCount > 0
                  ? `${paymentProofCount} receipt${
                      paymentProofCount === 1
                        ? ""
                        : "s"
                    } waiting for review.`
                  : "No receipts waiting for review."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 font-extrabold text-white ${
                paymentProofCount > 0
                  ? "bg-red-600"
                  : "bg-green-600"
              }`}
            >
              {paymentProofCount}
            </span>

            <span className="font-extrabold text-green-700">
              Review →
            </span>
          </div>
        </Link>

        {/* Statistics */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClasses}`}
                >
                  <Icon className="text-xl" />
                </div>

                <p className="mt-4 text-sm font-bold text-gray-500">
                  {item.label}
                </p>

                <p className="mt-1 text-3xl font-extrabold text-gray-900">
                  {item.value}
                </p>
              </article>
            );
          })}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          {/* Recent orders */}
          <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Recent Orders
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  The latest customer orders.
                </p>
              </div>

              <Link
                href="/admin/orders"
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-extrabold text-gray-700 transition hover:bg-green-50 hover:text-green-700"
              >
                View all
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <FiShoppingBag className="mx-auto text-4xl text-gray-300" />

                <p className="mt-3 font-bold text-gray-600">
                  No orders found
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-6 py-4 font-extrabold">
                          Order
                        </th>

                        <th className="px-6 py-4 font-extrabold">
                          Customer
                        </th>

                        <th className="px-6 py-4 font-extrabold">
                          Total
                        </th>

                        <th className="px-6 py-4 font-extrabold">
                          Status
                        </th>

                        <th className="px-6 py-4 font-extrabold">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            <Link
                              href="/admin/orders"
                              className="font-extrabold text-green-700 hover:text-green-800"
                            >
                              #{order.id}
                            </Link>
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">
                              {order.customer_name ||
                                "Unknown"}
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 text-left text-xs text-gray-500"
                            >
                              {order.phone
                                ? `+${order.phone}`
                                : "—"}
                            </p>
                          </td>

                          <td className="px-6 py-4 font-extrabold text-gray-900">
                            {Number(
                              order.total_price || 0
                            ).toLocaleString()}{" "}
                            SYP

                            <p
                              className={`mt-1 text-xs font-extrabold ${
                                order.payment_method === "cod"
                                  ? "text-emerald-700"
                                  : "text-blue-700"
                              }`}
                            >
                              {order.payment_method === "cod"
                                ? `COD${
                                    Number(
                                      order.cod_fee || 0
                                    ) > 0
                                      ? ` + ${Number(
                                          order.cod_fee || 0
                                        ).toLocaleString()} SYP fee`
                                      : ""
                                  }`
                                : "Sham Cash"}
                            </p>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(
                                order.status
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold text-gray-500">
                            {formatDate(
                              order.created_at
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile list */}
                <div className="divide-y divide-gray-100 md:hidden">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href="/admin/orders"
                      className="block p-5 transition hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-extrabold text-green-700">
                            Order #{order.id}
                          </p>

                          <p className="mt-1 font-bold text-gray-900">
                            {order.customer_name ||
                              "Unknown"}
                          </p>

                          <p className="mt-2 text-xs text-gray-500">
                            {formatDate(
                              order.created_at
                            )}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-extrabold text-gray-900">
                            {Number(
                              order.total_price || 0
                            ).toLocaleString()}{" "}
                            SYP
                          </p>

                          <p
                            className={`mt-1 text-xs font-extrabold ${
                              order.payment_method === "cod"
                                ? "text-emerald-700"
                                : "text-blue-700"
                            }`}
                          >
                            {order.payment_method === "cod"
                              ? `Cash on Delivery${
                                  Number(
                                    order.cod_fee || 0
                                  ) > 0
                                    ? ` + ${Number(
                                        order.cod_fee || 0
                                      ).toLocaleString()} SYP fee`
                                    : ""
                                }`
                              : "Sham Cash"}
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(
                              order.status
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Quick actions */}
          <section className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-xl font-extrabold text-gray-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Frequently used management pages.
            </p>

            <div className="mt-5 space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-4 rounded-2xl p-4 ring-1 transition hover:-translate-y-0.5 hover:shadow-sm ${action.classes}`}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70">
                      <Icon className="text-xl" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-extrabold">
                        {action.title}
                      </p>

                      <p className="mt-1 text-xs opacity-75">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
