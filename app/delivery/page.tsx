"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DeliveryOrder = {
  id: number;
  customer_name?: string | null;
  phone?: string | null;
  address?: string | null;
  total_price?: number | string | null;
  status: string;
};

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["accepted", "out_for_delivery"])
      .order("id", { ascending: false });

    setOrders(data || []);
  }

  async function updateStatus(id: number, status: string) {
    await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    loadOrders();
  }

  useEffect(() => {
    window.queueMicrotask(() => {
      void loadOrders();
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="mb-8 text-center text-3xl font-bold">
        Delivery Dashboard
      </h1>

      <div className="mx-auto max-w-5xl space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl bg-white p-6 shadow"
          >
            <h2 className="font-bold text-xl">
              Order #{order.id}
            </h2>

            <p>{order.customer_name}</p>
            <p>{order.phone}</p>
            <p>{order.address}</p>

            <p className="mt-2 font-bold">
              {Number(order.total_price).toLocaleString()} SYP
            </p>

            <p className="mt-2">
              Status: {order.status}
            </p>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() =>
                  updateStatus(order.id, "out_for_delivery")
                }
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                استلام الطلب
              </button>

              <button
                onClick={() =>
                  updateStatus(order.id, "delivered")
                }
                className="rounded bg-green-600 px-4 py-2 text-white"
              >
                تم التسليم
              </button>

              <button
                onClick={() =>
                  updateStatus(order.id, "accepted")
                }
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                تعذر التسليم
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

