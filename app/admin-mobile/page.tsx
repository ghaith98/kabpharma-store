"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminMobilePage() {
  const [pending, setPending] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [drivers, setDrivers] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  async function loadStats() {
    const { count: pendingCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: deliveryCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "out_for_delivery");

    const { count: deliveredCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "delivered");

    const { count: driversCount } = await supabase
      .from("delivery_drivers")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    setPending(pendingCount || 0);
    setDelivery(deliveryCount || 0);
    setDelivered(deliveredCount || 0);
    setDrivers(driversCount || 0);
  }

  async function refreshStats() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  const stats = [
    { label: "Pending", value: pending, icon: "⏳" },
    { label: "On Road", value: delivery, icon: "🚚" },
    { label: "Delivered", value: delivered, icon: "✅" },
    { label: "Drivers", value: drivers, icon: "👤" },
  ];

  const links = [
    { href: "/admin/delivery-orders?mobile=1", title: "New Delivery", icon: "＋" },
    { href: "/admin/orders?mobile=1", title: "Orders", icon: "📦" },
    { href: "/admin/drivers?mobile=1", title: "Drivers", icon: "🚚" },
    { href: "/admin/delivery?mobile=1", title: "Fees & Areas", icon: "⚙️" },
    { href: "/admin/products?mobile=1", title: "Products", icon: "🧴" },
    { href: "/admin/categories?mobile=1", title: "Categories", icon: "🏷️" },
    { href: "/admin/banners?mobile=1", title: "Banners", icon: "🖼️" },
    { href: "/admin/reviews?mobile=1", title: "Reviews", icon: "⭐" },
    { href: "/admin/payment-settings?mobile=1", title: "Payment", icon: "💳" },
  ];

  return (
    <main
      onTouchStart={(e) => {
        setTouchStart(e.touches[0].clientY);
      }}
      onTouchEnd={async (e) => {
        if (touchStart === null) return;

        const touchEnd = e.changedTouches[0].clientY;
        const pulledDown = touchEnd - touchStart > 90;

        if (pulledDown && window.scrollY === 0 && !refreshing) {
          await refreshStats();
        }

        setTouchStart(null);
      }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 px-4 py-6"
    >
      <div className="mx-auto max-w-md">
        {refreshing && (
          <p className="mb-3 text-center text-sm font-extrabold text-green-700">
            Refreshing...
          </p>
        )}

        <section className="mb-5 rounded-[2rem] bg-green-700 p-6 text-white shadow">
          <p className="text-xs font-extrabold uppercase tracking-widest text-green-100">
            KAB Pharma
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-green-50">
            Delivery, drivers, orders and settings.
          </p>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <div className="text-2xl">{item.icon}</div>
              <p className="mt-2 text-xs font-bold text-gray-500">
                {item.label}
              </p>
              <h2 className="mt-1 text-3xl font-extrabold text-gray-900">
                {item.value}
              </h2>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-lg font-extrabold text-gray-900">
            Management
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-3xl border border-gray-100 bg-gray-50 p-4 text-center transition active:scale-95"
              >
                <div className="text-3xl">{link.icon}</div>
                <p className="mt-3 text-sm font-extrabold text-gray-800">
                  {link.title}
                </p>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}