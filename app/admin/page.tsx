"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type NewOrderPayload = {
  id?: number;
  status?: string;
  payment_proof_path?: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [ordersCount, setOrdersCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [paymentProofCount, setPaymentProofCount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState("");

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
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .neq("status", "cancelled_by_customer"),

      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),

      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .not("payment_proof_path", "is", null)
        .is("payment_proof_deleted_at", null),

      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "out_for_delivery"),

      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "delivered"),

      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),

      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled_by_customer"),

      supabase
        .from("orders")
        .select("total_price")
        .eq("status", "delivered"),
    ]);

    const firstError =
      ordersResult.error ||
      pendingResult.error ||
      paymentProofResult.error ||
      deliveryResult.error ||
      deliveredResult.error ||
      rejectedResult.error ||
      cancelledResult.error ||
      revenueResult.error;

    if (firstError) {
      console.error("Failed to load dashboard:", firstError);
      return;
    }

    setOrdersCount(ordersResult.count || 0);
    setPendingCount(pendingResult.count || 0);
    setPaymentProofCount(paymentProofResult.count || 0);
    setDeliveryCount(deliveryResult.count || 0);
    setDeliveredCount(deliveredResult.count || 0);
    setRejectedCount(rejectedResult.count || 0);
    setCancelledCount(cancelledResult.count || 0);

    const totalRevenue =
      revenueResult.data?.reduce(
        (sum, order) =>
          sum + Number(order.total_price || 0),
        0
      ) || 0;

    setRevenue(totalRevenue);
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
    if (checking) return;

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

  const stats = [
    {
      label: "Orders",
      value: ordersCount,
      tone: "bg-white text-gray-900",
    },
    {
      label: "Pending",
      value: pendingCount,
      tone: "bg-yellow-50 text-yellow-800",
    },
    {
      label: "Out for Delivery",
      value: deliveryCount,
      tone: "bg-blue-50 text-blue-800",
    },
    {
      label: "Delivered",
      value: deliveredCount,
      tone: "bg-green-50 text-green-800",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      tone: "bg-red-50 text-red-800",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      tone: "bg-gray-100 text-gray-800",
    },
  ];

  const links = [
    {
      href: "/admin/payment-proofs",
      label: "Payment Proof Inbox",
    },
    {
      href: "/admin/orders",
      label: "Shop Orders",
    },
    {
      href: "/admin/products",
      label: "Products",
    },
    {
      href: "/admin/categories",
      label: "Categories",
    },
    {
      href: "/admin/banners",
      label: "Banners",
    },
    {
      href: "/admin/reviews",
      label: "Reviews",
    },
    {
      href: "/admin/delivery-orders/manage",
      label: "Manage Delivery Orders",
    },
    {
      href: "/admin/delivery",
      label: "Delivery Fees",
    },
    {
      href: "/admin/delivery-companies",
      label: "Delivery Companies",
    },
    {
      href: "/admin/payment-settings",
      label: "Payment Settings",
    },
    {
      href: "/admin/drivers",
      label: "Drivers",
    },
  ];

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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-6 py-10">
      {/* Live notification */}
      {notification && (
        <a
          href="/admin/payment-proofs"
          className="fixed right-5 top-5 z-[100] w-[calc(100%-2.5rem)] max-w-sm rounded-2xl border border-yellow-200 bg-white p-5 shadow-2xl transition hover:-translate-y-0.5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-xl">
              🧾
            </div>

            <div>
              <p className="font-extrabold text-gray-900">
                New payment proof
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {notification}
              </p>

              <p className="mt-2 text-sm font-bold text-green-700">
                Open Payment Proof Inbox →
              </p>
            </div>
          </div>
        </a>
      )}

      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <section className="mb-8 rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <p className="text-sm font-extrabold uppercase tracking-wider text-green-700">
            KAB Pharma
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">
                Admin Dashboard
              </h1>

              <p className="mt-2 text-gray-600">
                Manage orders, payment proofs, products,
                delivery and settings.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={refreshDashboard}
                disabled={refreshing}
                className="rounded-2xl border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 transition hover:border-green-600 hover:text-green-700 disabled:opacity-50"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <div className="rounded-3xl bg-green-600 px-6 py-4 text-white shadow-sm">
                <p className="text-sm font-bold opacity-90">
                  Revenue
                </p>

                <p className="mt-1 text-2xl font-extrabold">
                  {revenue.toLocaleString()} SYP
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Payment receipt inbox */}
        <a
          href="/admin/payment-proofs"
          className={`mb-8 flex flex-col justify-between gap-5 rounded-[2rem] border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:flex-row sm:items-center ${
            paymentProofCount > 0
              ? "border-yellow-200 bg-yellow-50"
              : "border-green-200 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                paymentProofCount > 0
                  ? "bg-yellow-100"
                  : "bg-green-100"
              }`}
            >
              🧾
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Payment Proof Inbox
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                {paymentProofCount > 0
                  ? `${paymentProofCount} receipt${
                      paymentProofCount === 1 ? "" : "s"
                    } waiting for review.`
                  : "No payment proofs waiting for review."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={`flex h-12 min-w-12 items-center justify-center rounded-full px-3 text-xl font-extrabold ${
                paymentProofCount > 0
                  ? "bg-yellow-500 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              {paymentProofCount}
            </span>

            <span className="font-extrabold text-green-700">
              Review Receipts →
            </span>
          </div>
        </a>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {stats.map((item) => (
            <div
              key={item.label}
              className={`rounded-3xl p-5 shadow-sm ring-1 ring-gray-100 ${item.tone}`}
            >
              <p className="text-sm font-bold opacity-80">
                {item.label}
              </p>

              <h2 className="mt-3 text-4xl font-extrabold">
                {item.value}
              </h2>
            </div>
          ))}
        </section>

        {/* Management */}
        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-5 text-xl font-extrabold text-gray-900">
            Management
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative rounded-2xl border px-5 py-4 font-extrabold transition ${
                  link.href === "/admin/payment-proofs"
                    ? "border-yellow-200 bg-yellow-50 text-yellow-900 hover:bg-yellow-100"
                    : "border-gray-200 bg-gray-50 text-gray-800 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                }`}
              >
                {link.label}

                {link.href ===
                  "/admin/payment-proofs" &&
                  paymentProofCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-extrabold text-white">
                      {paymentProofCount}
                    </span>
                  )}
              </a>
            ))}

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/admin/login");
              }}
              className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-left font-extrabold text-red-700 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}