"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DriverPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [driverName, setDriverName] = useState("");

  async function loadOrders() {
    const { data, error } = await supabase
      .from("delivery_orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setOrders(data || []);
  }

  async function checkActiveOrder(name: string) {
    const { data, error } = await supabase
      .from("delivery_orders")
      .select("id")
      .eq("driver_name", name)
      .eq("status", "out_for_delivery")
      .limit(1);

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      window.location.href = "/driver/my-orders";
    }
  }

    async function acceptOrder(id: string) {
  const savedName = localStorage.getItem("driver_name");

  if (!savedName) {
    window.location.href = "/driver/login";
    return;
  }

  // check if driver already has active order
  const { data: activeOrders, error: activeError } = await supabase
    .from("delivery_orders")
    .select("id")
    .eq("driver_name", savedName)
    .eq("status", "out_for_delivery")
    .limit(1);

  if (activeError) {
    alert(activeError.message);
    return;
  }

  if (activeOrders && activeOrders.length > 0) {
    alert("You already have an active delivery.");
    window.location.href = "/driver/my-orders";
    return;
  }

  const { error } = await supabase
    .from("delivery_orders")
    .update({
      status: "out_for_delivery",
      driver_name: savedName,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "/driver/my-orders";
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
    checkActiveOrder(savedName);
    loadOrders();

    const channel = supabase
      .channel("delivery-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_orders",
        },
        () => {
          checkActiveOrder(savedName);
          loadOrders();
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
            <h1 className="text-3xl font-bold text-gray-900">
              Available Orders
            </h1>

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
          href="/driver/my-orders"
          className="mb-6 inline-block rounded-xl bg-gray-900 px-5 py-3 font-bold text-white"
        >
          My Orders
        </a>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-gray-600">No available orders.</p>
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

                <button
                  onClick={() => acceptOrder(order.id)}
                  className="mt-4 w-full rounded-xl bg-green-600 px-5 py-3 font-bold text-white"
                >
                  Start Delivery
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}