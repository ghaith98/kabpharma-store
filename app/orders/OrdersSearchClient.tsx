"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total_price: number;
  status: string;
};

const statusMap: Record<string, string> = {
  pending: "قيد مراجعة الدفع",
  accepted: "تم قبول الطلب",
  out_for_delivery: "قيد التوصيل",
  delivered: "تم تسليم الطلب",
  rejected: "تم رفض الطلب",
  cancelled_by_customer: "تم إلغاء الطلب",
};

const statusClass: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700",
  accepted: "bg-green-50 text-green-700",
  out_for_delivery: "bg-blue-50 text-blue-700",
  delivered: "bg-green-100 text-green-800",
  rejected: "bg-red-50 text-red-700",
  cancelled_by_customer: "bg-gray-200 text-gray-800",
};

export default function OrdersSearchClient() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function searchOrders() {
    if (!phone.trim()) return;

    setLoading(true);
    setSearched(true);

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("phone", phone.trim())
      .order("id", { ascending: false });

    setOrders(data || []);
    setLoading(false);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12"
    >
      <div className="mx-auto max-w-3xl">
        <section className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            طلباتي
          </h1>

          <p className="mt-3 text-gray-600">
            أدخل رقم الهاتف المستخدم في الطلب لعرض طلباتك وحالتها.
          </p>
        </section>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
            />

            <button
              onClick={searchOrders}
              disabled={loading}
              className="rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "جاري البحث..." : "عرض الطلبات"}
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <a
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    رقم الطلب
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                    #{order.id}
                  </h2>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    statusClass[order.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusMap[order.status] || order.status}
                </span>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p className="text-gray-600">
                  الاسم:{" "}
                  <span className="font-bold text-gray-900">
                    {order.customer_name}
                  </span>
                </p>

                <p className="text-gray-600">
                  المبلغ:{" "}
                  <span className="font-bold text-green-700">
                    {Number(order.total_price).toLocaleString()} SYP
                  </span>
                </p>
              </div>

              <p className="mt-4 text-sm font-semibold text-green-700">
                اضغط لعرض تفاصيل الطلب
              </p>
            </a>
          ))}

          {searched && !loading && orders.length === 0 && (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-extrabold text-gray-900">
                لا توجد طلبات
              </h2>
              <p className="mt-2 text-gray-600">
                لم يتم العثور على طلبات مرتبطة بهذا الرقم.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}