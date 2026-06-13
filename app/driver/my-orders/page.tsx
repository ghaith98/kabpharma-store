"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DriverMyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [driverName, setDriverName] = useState("");
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  async function loadMyOrders(name: string) {
    const { data, error } = await supabase
      .from("delivery_orders")
      .select("*")
      .eq("driver_name", name)
      .in("status", ["accepted", "out_for_delivery"])
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setOrders(data || []);
  }

  async function updateStatus(id: string, status: string) {
    setLoadingOrderId(id);

    const updateData: any = { status };

    if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("delivery_orders")
      .update(updateData)
      .eq("id", id);

    setLoadingOrderId(null);

    if (error) {
      alert(error.message);
      return;
    }

    loadMyOrders(driverName);
  }

  function logout() {
    localStorage.removeItem("driver_id");
    localStorage.removeItem("driver_name");
    localStorage.removeItem("driver_username");
    window.location.href = "/driver/login";
  }

  function getStatusText(status: string) {
    if (status === "accepted") return "تم استلام الطلب";
    if (status === "out_for_delivery") return "قيد التوصيل";
    return status;
  }

  useEffect(() => {
    const savedName = localStorage.getItem("driver_name");

    if (!savedName) {
      window.location.href = "/driver/login";
      return;
    }

    setDriverName(savedName);
    loadMyOrders(savedName);

    const channel = supabase
      .channel("my-delivery-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_orders",
        },
        () => {
          loadMyOrders(savedName);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 p-4"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-5 rounded-2xl bg-green-700 p-5 text-white shadow">
          <h1 className="text-xl font-extrabold">طلباتي الحالية</h1>
          <p className="mt-1 text-sm text-green-100">السائق: {driverName}</p>
        </div>

        <div className="mb-5 flex gap-2">
          <a
            href="/driver"
            className="flex-1 rounded-xl bg-gray-900 py-3 text-center text-sm font-bold text-white"
          >
            الطلبات المتاحة
          </a>

          
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow">
              <p className="text-gray-500">لا يوجد طلبات قيد التوصيل حالياً</p>

              <a
                href="/driver"
                className="mt-4 inline-block rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white"
              >
                عرض الطلبات المتاحة
              </a>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-4 shadow">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    {getStatusText(order.status)}
                  </span>

                  <span className="text-xs font-bold text-gray-400">
                    طلب توصيل
                  </span>
                </div>

                <div className="mb-2 text-sm text-gray-500">
                  👤 العميل:{" "}
                  <span className="font-bold text-gray-900">
                    {order.customer_name || "-"}
                  </span>
                </div>

                <div className="mb-2 text-sm text-gray-500">
                  📞 الهاتف:{" "}
                  {order.customer_phone ? (
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="font-bold text-green-700 underline"
                    >
                      {order.customer_phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>

                <div className="mb-2 text-sm text-gray-500">
                  📍 من:{" "}
                  <span className="font-bold text-gray-900">
                    {order.from_address}
                  </span>
                </div>

                <div className="mb-2 text-sm text-gray-500">
                  🏠 إلى:{" "}
                  <span className="font-bold text-gray-900">
                    {order.to_address}
                  </span>
                </div>

                <div className="mb-4 text-sm text-gray-500">
                  💰 السعر:{" "}
                  <span className="font-bold text-green-700">
                    {Number(order.price).toLocaleString()} ل.س
                  </span>
                </div>

                {order.status === "accepted" && (
                  <button
                    onClick={() => updateStatus(order.id, "out_for_delivery")}
                    disabled={loadingOrderId === order.id}
                    className={`w-full rounded-xl py-3 font-bold text-white transition ${
                      loadingOrderId === order.id
                        ? "bg-blue-400"
                        : "bg-blue-600 active:scale-95"
                    }`}
                  >
                    {loadingOrderId === order.id
                      ? "جارٍ تحديث الحالة..."
                      : "بدء التوصيل"}
                  </button>
                )}

                {order.status === "out_for_delivery" && (
                  <button
                    onClick={() => updateStatus(order.id, "delivered")}
                    disabled={loadingOrderId === order.id}
                    className={`w-full rounded-xl py-3 font-bold text-white transition ${
                      loadingOrderId === order.id
                        ? "bg-green-400"
                        : "bg-green-600 active:scale-95"
                    }`}
                  >
                    {loadingOrderId === order.id
                      ? "جارٍ تأكيد التسليم..."
                      : "تم التسليم"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}