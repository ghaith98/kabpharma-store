"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ManageDeliveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from("delivery_orders")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders(data || []);
  }

 useEffect(() => {
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
        loadOrders();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  function statusStyle(status: string) {
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    if (status === "accepted") return "bg-blue-100 text-blue-800";
    if (status === "out_for_delivery") return "bg-orange-100 text-orange-800";
    if (status === "delivered") return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Delivery Orders
            </h1>
            <p className="mt-2 text-gray-600">
              Track all delivery orders and drivers.
            </p>
          </div>

          <div className="mb-6 flex gap-2">
  {/* Desktop */}
  <Link
    href="/admin"
    className="hidden lg:inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
  >
    ← Desktop Dashboard
  </Link>

  {/* Mobile */}
  <Link
    href="/admin-mobile"
    className="inline-flex lg:hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
  >
    ← Dashboard
  </Link>
</div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600">No delivery orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-4 font-bold text-gray-900">
                      {order.customer_name || "-"}
                    </td>

                    <td className="p-4 text-gray-700">
                      {order.customer_phone || "-"}
                    </td>

                    <td className="p-4 text-gray-700">
                      {order.from_address}
                    </td>

                    <td className="p-4 text-gray-700">
                      {order.to_address}
                    </td>

                    <td className="p-4 font-bold text-gray-900">
                      {Number(order.price).toLocaleString()} SYP
                    </td>

                    <td className="p-4 text-gray-700">
                      {order.driver_name || "-"}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="p-4 text-gray-500">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
