"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const statusMap: Record<string, string> = {
  pending: "قيد مراجعة الدفع",
  accepted: "تم قبول الطلب",
  out_for_delivery: "قيد التوصيل",
  delivered: "تم التسليم",
  rejected: "تم الرفض",
  cancelled_by_customer: "ألغاه الزبون",
};

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [checking, setChecking] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [updatedOrderId, setUpdatedOrderId] = useState<number | null>(null);
  const [updatedStatus, setUpdatedStatus] = useState<string | null>(null);

  async function loadOrders() {
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
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setOrders(data || []);
  }

  async function updateOrderStatus(orderId: number, status: string) {
    setUpdatingOrderId(orderId);
    setUpdatedStatus(status);

    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .neq("status", "cancelled_by_customer");

    if (error) {
      alert(error.message);
      setUpdatingOrderId(null);
      setUpdatedStatus(null);
      return;
    }

    setUpdatedOrderId(orderId);
    await loadOrders();
    setUpdatingOrderId(null);

    setTimeout(() => {
      setUpdatedOrderId(null);
      setUpdatedStatus(null);
    }, 1200);
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
        <p className="text-center font-semibold text-gray-700">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto mb-8 flex max-w-5xl items-center justify-between">
  <h1 className="text-3xl font-bold text-gray-900">Admin Orders</h1>

  <div className="flex gap-3">
    <a
      href="/admin"
      className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      Back to Dashboard
    </a>

    <button
      onClick={logout}
      className="rounded-xl bg-black px-4 py-2 font-semibold text-white"
    >
      Logout
    </button>
  </div>
</div>

      <div className="mx-auto max-w-5xl space-y-4">
        {orders.map((order) => {
          const isCancelled = order.status === "cancelled_by_customer";

          const isFinal =
            order.status === "delivered" ||
            order.status === "rejected" ||
            order.status === "cancelled_by_customer";

          const isUpdating = updatingOrderId === order.id;
          const isUpdated = updatedOrderId === order.id;
          const activeStatus =
            updatedOrderId === order.id ? updatedStatus : order.status;

          return (
            <div key={order.id} className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                Order #{order.id}
              </h2>

              <div className="space-y-1 text-gray-800">
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
                  <strong>Status:</strong>{" "}
                  <span className="font-bold text-gray-900">
                    {statusMap[order.status] || order.status}
                  </span>
                </p>
              </div>

              {order.payment_proof_url && (
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  className="mt-3 block font-semibold text-blue-700 underline"
                >
                  View Payment Proof
                  {order.order_items && order.order_items.length > 0 && (
  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
    <h3 className="mb-3 font-bold text-gray-900">Order Items</h3>

    <div className="space-y-3">
      {order.order_items.map((item: any) => (
        <div
          key={item.id}
          className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-b-0"
        >
          <div>
            <p className="font-bold text-gray-900">
              {item.product_name}
            </p>
            <p className="text-sm text-gray-600">
              Quantity: {item.quantity}
            </p>
          </div>

          <p className="font-bold text-green-700">
            {(Number(item.unit_price) * Number(item.quantity)).toLocaleString()} SYP
          </p>
        </div>
      ))}
    </div>
  </div>
)}
                </a>
              )}

              {isCancelled ? (
                <div className="mt-4 rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700">
                  ألغاه الزبون — لا يمكن تعديل حالة هذا الطلب
                </div>
              ) : isFinal ? (
                <div className="mt-4 rounded-xl bg-gray-100 px-4 py-3 font-bold text-gray-700">
                  حالة نهائية — لا حاجة لتعديل إضافي
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => updateOrderStatus(order.id, "accepted")}
                    disabled={isUpdating}
                    className={`rounded-xl px-4 py-2 font-bold text-white transition disabled:opacity-60 ${
                      activeStatus === "accepted"
                        ? "scale-95 bg-green-800 shadow-inner ring-2 ring-green-300"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isUpdating && activeStatus === "accepted"
                      ? "جاري التحديث..."
                      : isUpdated && activeStatus === "accepted"
                      ? "✓ تم التحديث"
                      : "قبول الطلب"}
                  </button>

                  <button
                    onClick={() =>
                      updateOrderStatus(order.id, "out_for_delivery")
                    }
                    disabled={isUpdating}
                    className={`rounded-xl px-4 py-2 font-bold text-white transition disabled:opacity-60 ${
                      activeStatus === "out_for_delivery"
                        ? "scale-95 bg-blue-800 shadow-inner ring-2 ring-blue-300"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isUpdating && activeStatus === "out_for_delivery"
                      ? "جاري التحديث..."
                      : isUpdated && activeStatus === "out_for_delivery"
                      ? "✓ تم التحديث"
                      : "قيد التوصيل"}
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order.id, "delivered")}
                    disabled={isUpdating}
                    className={`rounded-xl px-4 py-2 font-bold text-white transition disabled:opacity-60 ${
                      activeStatus === "delivered"
                        ? "scale-95 bg-purple-800 shadow-inner ring-2 ring-purple-300"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {isUpdating && activeStatus === "delivered"
                      ? "جاري التحديث..."
                      : isUpdated && activeStatus === "delivered"
                      ? "✓ تم التحديث"
                      : "تم التسليم"}
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order.id, "rejected")}
                    disabled={isUpdating}
                    className={`rounded-xl px-4 py-2 font-bold text-white transition disabled:opacity-60 ${
                      activeStatus === "rejected"
                        ? "scale-95 bg-red-800 shadow-inner ring-2 ring-red-300"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {isUpdating && activeStatus === "rejected"
                      ? "جاري التحديث..."
                      : isUpdated && activeStatus === "rejected"
                      ? "✓ تم التحديث"
                      : "رفض الطلب"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}