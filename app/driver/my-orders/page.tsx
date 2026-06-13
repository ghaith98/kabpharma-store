"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DriverMyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [driverName, setDriverName] = useState("");

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
    const updateData: any = { status };

    if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("delivery_orders")
      .update(updateData)
      .eq("id", id);

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>

            <p className="mt-1 text-sm font-bold text-gray-600">
              Driver: {driverName}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
          >
            Logout
          </button>
        </div>

        <a
          href="/driver"
          className="mb-6 inline-block rounded-xl bg-gray-900 px-5 py-3 font-bold text-white"
        >
          ← Available Orders
        </a>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-gray-600">No active orders.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-5 shadow">
                <p>
                  <strong>Customer:</strong> {order.customer_name || "-"}
                </p>

               <p>
  <strong>Phone:</strong>{" "}
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
</p>

                <p>
                  <strong>From:</strong> {order.from_address}
                </p>

                <p>
                  <strong>To:</strong> {order.to_address}
                </p>

                <p>
                  <strong>Price:</strong>{" "}
                  {Number(order.price).toLocaleString()} SYP
                </p>

                <p>
                  <strong>Status:</strong> {order.status}
                </p>

                {order.status === "accepted" && (
                  <button
                    onClick={() => updateStatus(order.id, "out_for_delivery")}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white"
                  >
                    Out For Delivery
                  </button>
                )}

                {order.status === "out_for_delivery" && (
                  <button
                    onClick={() => updateStatus(order.id, "delivered")}
                    className="mt-4 w-full rounded-xl bg-green-600 px-5 py-3 font-bold text-white"
                  >
                    Delivered
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