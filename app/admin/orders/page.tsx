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

const governorates = [
  "All",
  "Damascus",
  "Homs",
  "Hama",
  "Aleppo",
  "Latakia",
  "Tartus",
  "Suwayda",
  "Al Hasakah",
];

const timeFilters = [
  { value: "All", label: "All Time" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "1m", label: "Last 1 Month" },
  { value: "3m", label: "Last 3 Months" },
  { value: "6m", label: "Last 6 Months" },
  { value: "older", label: "Older" },
];

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("All");
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

  function matchesTimeFilter(order: any) {
    if (selectedTimeFilter === "All") return true;

    if (!order.created_at) return false;

    const orderDate = new Date(order.created_at);
    const now = new Date();

    const diffInMs = now.getTime() - orderDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (selectedTimeFilter === "24h") return diffInDays <= 1;
    if (selectedTimeFilter === "7d") return diffInDays <= 7;
    if (selectedTimeFilter === "1m") return diffInDays <= 30;
    if (selectedTimeFilter === "3m") return diffInDays <= 90;
    if (selectedTimeFilter === "6m") return diffInDays <= 180;
    if (selectedTimeFilter === "older") return diffInDays > 180;

    return true;
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

  const filteredOrders = orders.filter((order) => {
    const matchesGovernorate =
      selectedGovernorate === "All" ||
      order.governorate === selectedGovernorate;

    const matchesStatus =
      selectedStatus === "All" || order.status === selectedStatus;

    const searchText = `
      ${order.id}
      ${order.customer_name || ""}
      ${order.phone || ""}
      ${order.governorate || ""}
      ${order.delivery_area || ""}
    `.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    return (
      matchesGovernorate &&
      matchesStatus &&
      matchesSearch &&
      matchesTimeFilter(order)
    );
  });

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
          <div className="mb-6 flex gap-2">
            <a
              href="/admin"
              className="hidden lg:inline-flex rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              ← Desktop Dashboard
            </a>

            <a
              href="/admin-mobile"
              className="inline-flex lg:hidden rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            >
              ← Dashboard
            </a>
          </div>
        </div>
      </div>

     <div className="mx-auto mb-6 max-w-5xl">
  <select
    value={selectedTimeFilter}
    onChange={(e) => setSelectedTimeFilter(e.target.value)}
    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm outline-none transition focus:border-green-600"
  >
    <option value="All">All Time</option>
    <option value="24h">Last 24 Hours</option>
    <option value="7d">Last 7 Days</option>
    <option value="1m">Last 1 Month</option>
    <option value="3m">Last 3 Months</option>
    <option value="6m">Last 6 Months</option>
    <option value="older">Older</option>
  </select>
</div>

      <div className="mx-auto mb-8 max-w-5xl overflow-x-auto rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex min-w-max gap-3">
          {governorates.map((gov) => {
            const count =
              gov === "All"
                ? orders.length
                : orders.filter((order) => order.governorate === gov).length;

            return (
              <button
                key={gov}
                onClick={() => setSelectedGovernorate(gov)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                  selectedGovernorate === gov
                    ? "bg-green-600 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {gov} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mb-8 max-w-5xl">
        <input
          type="text"
          placeholder="Search by Order ID, Name, Phone, Governorate or Area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-black shadow-sm outline-none transition focus:border-green-600"
        />
      </div>

      <div className="mx-auto mb-8 max-w-5xl overflow-x-auto rounded-2xl bg-white p-3 shadow-sm">
        <div className="flex min-w-max gap-3">
          {[
            { value: "All", label: "All Statuses" },
            { value: "pending", label: "Pending" },
            { value: "accepted", label: "Accepted" },
            { value: "out_for_delivery", label: "Out for Delivery" },
            { value: "delivered", label: "Delivered" },
            { value: "rejected", label: "Rejected" },
            { value: "cancelled_by_customer", label: "Cancelled" },
          ].map((status) => (
            <button
              key={status.value}
              onClick={() => setSelectedStatus(status.value)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                selectedStatus === status.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4">
        {filteredOrders.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            <h2 className="text-xl font-bold text-gray-900">
              No orders found
            </h2>
          </div>
        )}

        {filteredOrders.map((order) => {
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
            <div
              key={order.id}
              className={`rounded-2xl p-6 shadow border transition-all ${
                order.status === "accepted"
                  ? "bg-green-50 border-green-200"
                  : order.status === "out_for_delivery"
                  ? "bg-blue-50 border-blue-200"
                  : order.status === "delivered"
                  ? "bg-purple-50 border-purple-200"
                  : order.status === "rejected"
                  ? "bg-red-50 border-red-200"
                  : order.status === "cancelled_by_customer"
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-gray-100"
              }`}
            >
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
                  <strong>Governorate:</strong>{" "}
                  {order.governorate || "Not selected"}
                </p>
                <p>
                  <strong>Area:</strong>{" "}
                  {order.delivery_area || "Not selected"}
                </p>
                <p>
                  <strong>Address:</strong> {order.address}
                </p>
                <p>
                  <strong>Delivery Fee:</strong>{" "}
                  {Number(order.delivery_fee || 0).toLocaleString()} SYP
                </p>
                <p>
                  <strong>Total:</strong>{" "}
                  {Number(order.total_price).toLocaleString()} SYP
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                      order.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : order.status === "out_for_delivery"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "delivered"
                        ? "bg-purple-100 text-purple-800"
                        : order.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : order.status === "cancelled_by_customer"
                        ? "bg-gray-200 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
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
                </a>
              )}

              {order.order_items && order.order_items.length > 0 && (
                <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                  <h3 className="mb-3 font-bold text-gray-900">
                    Order Items
                  </h3>

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
                          {(
                            Number(item.unit_price) * Number(item.quantity)
                          ).toLocaleString()}{" "}
                          SYP
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
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