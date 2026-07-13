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

export default function AdminMobilePage() {
  const router = useRouter();

  const [pending, setPending] = useState(0);
  const [paymentProofs, setPaymentProofs] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [drivers, setDrivers] = useState(0);

  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [touchStart, setTouchStart] =
    useState<number | null>(null);
  const [notification, setNotification] = useState("");

  const loadStats = useCallback(async () => {
    const [
      pendingResult,
      paymentProofResult,
      deliveryResult,
      deliveredResult,
      driversResult,
    ] = await Promise.all([
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
        .from("delivery_drivers")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
    ]);

    const firstError =
      pendingResult.error ||
      paymentProofResult.error ||
      deliveryResult.error ||
      deliveredResult.error ||
      driversResult.error;

    if (firstError) {
      console.error(
        "Failed to load mobile dashboard:",
        firstError
      );
      return;
    }

    setPending(pendingResult.count || 0);
    setPaymentProofs(paymentProofResult.count || 0);
    setDelivery(deliveryResult.count || 0);
    setDelivered(deliveredResult.count || 0);
    setDrivers(driversResult.count || 0);
  }, []);

  async function refreshStats() {
    setRefreshing(true);
    await loadStats();
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

      await loadStats();

      if (mounted) {
        setChecking(false);
      }
    }

    initializeDashboard();

    return () => {
      mounted = false;
    };
  }, [loadStats, router]);

  useEffect(() => {
    if (checking) return;

    const channel = supabase
      .channel("admin-mobile-orders")
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

          await loadStats();

          if (
            newOrder.status === "pending" &&
            newOrder.payment_proof_path
          ) {
            setNotification(
              newOrder.id
                ? `New receipt received for Order #${newOrder.id}`
                : "A new payment receipt was received."
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
          await loadStats();
        }
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Mobile Realtime error:",
            error
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checking, loadStats]);

  const stats = [
    {
      label: "Pending",
      value: pending,
      icon: "⏳",
    },
    {
      label: "On Road",
      value: delivery,
      icon: "🚚",
    },
    {
      label: "Delivered",
      value: delivered,
      icon: "✅",
    },
    {
      label: "Drivers",
      value: drivers,
      icon: "👤",
    },
  ];

  const links = [
    {
      href: "/admin/payment-proofs",
      title: "Payment Proofs",
      icon: "🧾",
    },
    {
      href: "/admin/delivery-orders?mobile=1",
      title: "New Delivery",
      icon: "＋",
    },
    {
      href: "/admin/orders?mobile=1",
      title: "Orders",
      icon: "📦",
    },
    {
      href: "/admin/drivers?mobile=1",
      title: "Drivers",
      icon: "🚚",
    },
    {
      href: "/admin/delivery?mobile=1",
      title: "Fees & Areas",
      icon: "⚙️",
    },
    {
      href: "/admin/products?mobile=1",
      title: "Products",
      icon: "🧴",
    },
    {
      href: "/admin/categories?mobile=1",
      title: "Categories",
      icon: "🏷️",
    },
    {
      href: "/admin/banners?mobile=1",
      title: "Banners",
      icon: "🖼️",
    },
    {
      href: "/admin/reviews?mobile=1",
      title: "Reviews",
      icon: "⭐",
    },
    {
      href: "/admin/payment-settings?mobile=1",
      title: "Payment Settings",
      icon: "💳",
    },
  ];

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10">
        <p className="text-center font-bold text-gray-700">
          Checking admin access...
        </p>
      </main>
    );
  }

  return (
    <main
      onTouchStart={(event) => {
        setTouchStart(event.touches[0].clientY);
      }}
      onTouchEnd={async (event) => {
        if (touchStart === null) return;

        const touchEnd =
          event.changedTouches[0].clientY;

        const pulledDown =
          touchEnd - touchStart > 90;

        if (
          pulledDown &&
          window.scrollY === 0 &&
          !refreshing
        ) {
          await refreshStats();
        }

        setTouchStart(null);
      }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-4 py-6"
    >
      {notification && (
        <a
          href="/admin/payment-proofs"
          className="fixed left-4 right-4 top-4 z-[100] rounded-2xl border border-yellow-200 bg-white p-4 shadow-2xl"
        >
          <div className="flex items-center gap-3">
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

              <p className="mt-1 text-sm font-bold text-green-700">
                Tap to review →
              </p>
            </div>
          </div>
        </a>
      )}

      <div className="mx-auto max-w-md">
        {refreshing && (
          <p className="mb-3 text-center text-sm font-extrabold text-green-700">
            Refreshing...
          </p>
        )}

        {/* Header */}
        <section className="mb-5 rounded-[2rem] bg-green-700 p-6 text-white shadow">
          <p className="text-xs font-extrabold uppercase tracking-widest text-green-100">
            KAB Pharma
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-green-50">
            Payment proofs, delivery, orders and
            settings.
          </p>
        </section>

        {/* Payment proof inbox */}
        <a
          href="/admin/payment-proofs"
          className={`relative mb-5 flex items-center justify-between rounded-[2rem] border p-5 shadow-sm transition active:scale-[0.98] ${
            paymentProofs > 0
              ? "border-yellow-200 bg-yellow-50"
              : "border-green-200 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
                paymentProofs > 0
                  ? "bg-yellow-100"
                  : "bg-green-100"
              }`}
            >
              🧾
            </div>

            <div>
              <h2 className="font-extrabold text-gray-900">
                Payment Proof Inbox
              </h2>

              <p className="mt-1 text-xs text-gray-600">
                {paymentProofs > 0
                  ? `${paymentProofs} waiting for review`
                  : "No receipts waiting"}
              </p>
            </div>
          </div>

          <span
            className={`flex h-11 min-w-11 items-center justify-center rounded-full px-2 font-extrabold text-white ${
              paymentProofs > 0
                ? "bg-red-600"
                : "bg-green-600"
            }`}
          >
            {paymentProofs}
          </span>
        </a>

        {/* Stats */}
        <section className="mb-5 grid grid-cols-2 gap-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <div className="text-2xl">
                {item.icon}
              </div>

              <p className="mt-2 text-xs font-bold text-gray-500">
                {item.label}
              </p>

              <h2 className="mt-1 text-3xl font-extrabold text-gray-900">
                {item.value}
              </h2>
            </div>
          ))}
        </section>

        {/* Management */}
        <section className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
            Management
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative rounded-3xl border p-4 text-center transition active:scale-95 ${
                  link.href ===
                  "/admin/payment-proofs"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="text-3xl">
                  {link.icon}
                </div>

                <p className="mt-3 text-sm font-extrabold text-gray-800">
                  {link.title}
                </p>

                {link.href ===
                  "/admin/payment-proofs" &&
                  paymentProofs > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-red-600 px-2 text-xs font-extrabold text-white">
                      {paymentProofs}
                    </span>
                  )}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/admin/login");
            }}
            className="mt-3 w-full rounded-2xl bg-red-50 px-5 py-4 font-extrabold text-red-700 transition active:scale-95"
          >
            Logout
          </button>
        </section>
      </div>
    </main>
  );
}