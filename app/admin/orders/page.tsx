"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [checking, setChecking] = useState(true);

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setOrders(data || []);
  }

  async function updateOrderStatus(orderId: number, status: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    loadOrders();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/admin/login");
        return;
      }

      await loadOrders();
      setChecking(false);
    }

    checkAdmin();
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <p className="text-center">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Orders</h1>

        <button
          onClick={logout}
          className="rounded-xl bg-black px-4 py-2 text-white"
        >
          Logout
        </button>
      </div>

      <div className="mx-auto max-w-5xl space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-2 text-xl font-bold">Order #{order.id}</h2>

            <p>
              <strong>Name:</strong> {order.customer_name}
            </p>
            <p>
              <strong>Phone:</strong> {order.phone}
            </p>
            <p>
              <strong>Address:</strong> {order.address}
            </p>
            <p>
              <strong>Total:</strong>{" "}
              {Number(order.total_price).toLocaleString()} SYP
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>

            {order.payment_proof_url && (
              <a
                href={order.payment_proof_url}
                target="_blank"
                className="mt-3 block text-blue-600 underline"
              >
                View Payment Proof
              </a>
            )}

               <div className="mt-4 flex flex-wrap gap-3">
  <button
    onClick={() => updateOrderStatus(order.id, "accepted")}
    className="rounded-xl bg-green-600 px-4 py-2 text-white"
  >
    قبول الطلب
  </button>

  <button
    onClick={() => updateOrderStatus(order.id, "out_for_delivery")}
    className="rounded-xl bg-blue-600 px-4 py-2 text-white"
  >
    قيد التوصيل
  </button>

  <button
    onClick={() => updateOrderStatus(order.id, "delivered")}
    className="rounded-xl bg-purple-600 px-4 py-2 text-white"
  >
    تم التسليم
  </button>

  <button
    onClick={() => updateOrderStatus(order.id, "rejected")}
    className="rounded-xl bg-red-600 px-4 py-2 text-white"
  >
    رفض الطلب
  </button>
</div>
            </div>
            ))}
        </div>
    </main>
  );
}