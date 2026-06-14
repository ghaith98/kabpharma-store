"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function DriverMyOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [driverName, setDriverName] = useState("");
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  async function loadMyOrders(name: string) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .eq("driver_name", name)
      .eq("status", "out_for_delivery")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setOrders(data || []);
  }

  async function markDelivered(id: number) {
    setLoadingOrderId(id);

    const { error } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "out_for_delivery");

    setLoadingOrderId(null);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/driver");
  }

  useEffect(() => {
    const savedName = localStorage.getItem("driver_name");

    if (!savedName) {
      router.push("/driver/login");
      return;
    }

    setDriverName(savedName);
    loadMyOrders(savedName);

    const channel = supabase
      .channel("my-orders-driver-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => loadMyOrders(savedName)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-5 rounded-2xl bg-green-700 p-5 text-white shadow">
          <h1 className="text-xl font-extrabold">طلباتي الحالية</h1>
          <p className="mt-1 text-sm text-green-100">السائق: {driverName}</p>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow">
              <p className="text-gray-500">لا يوجد طلب قيد التوصيل حالياً</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-4 shadow">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    قيد التوصيل
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    Order #{order.id}
                  </span>
                </div>

                <p className="mb-2 text-sm text-gray-500">
                  👤 العميل:{" "}
                  <span className="font-bold text-gray-900">
                    {order.customer_name || "-"}
                  </span>
                </p>

                <p className="mb-2 text-sm text-gray-500">
                  📞 الهاتف:{" "}
                  {order.phone ? (
                    <a href={`tel:${order.phone}`} className="font-bold text-green-700 underline">
                      {order.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>

                <p className="mb-2 text-sm text-gray-500">
                  📍 المنطقة:{" "}
                  <span className="font-bold text-gray-900">
                    {order.delivery_area || "-"}
                  </span>
                </p>

                <p className="mb-4 text-sm text-gray-500">
                  🏠 العنوان:{" "}
                  <span className="font-bold text-gray-900">
                    {order.address || "-"}
                  </span>
                </p>

                <button
                  onClick={() => markDelivered(order.id)}
                  disabled={loadingOrderId === order.id}
                  className={`w-full rounded-xl py-3 font-bold text-white transition ${
                    loadingOrderId === order.id
                      ? "bg-green-400"
                      : "bg-green-600 active:scale-95"
                  }`}
                >
                  {loadingOrderId === order.id ? "جارٍ تأكيد التسليم..." : "تم التسليم"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}