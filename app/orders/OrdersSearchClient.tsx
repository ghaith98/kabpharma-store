"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "../../context/LanguageContext";

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total_price: number;
  status: string;
};

const statusMap = {
  en: {
    pending: "Payment under review",
    accepted: "Order accepted",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    rejected: "Rejected",
    cancelled_by_customer: "Cancelled",
  },
  ar: {
    pending: "قيد مراجعة الدفع",
    accepted: "تم قبول الطلب",
    out_for_delivery: "قيد التوصيل",
    delivered: "تم تسليم الطلب",
    rejected: "تم رفض الطلب",
    cancelled_by_customer: "تم إلغاء الطلب",
  },
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
  const { lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadOrders() {
      const savedUser = localStorage.getItem("kab_user");

      if (!savedUser) {
        setLoading(false);
        return;
      }

      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("phone", parsedUser.phone)
        .order("id", { ascending: false });

      setOrders(data || []);
      setLoading(false);
    }

    loadOrders();
  }, []);

  const currentStatusMap = statusMap[lang as "en" | "ar"];

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12"
    >
      <div className="mx-auto max-w-3xl">
        <section className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {lang === "ar" ? "طلباتي" : "My Orders"}
          </h1>

          <p className="mt-3 text-gray-600">
            {lang === "ar"
              ? "جميع طلباتك المرتبطة بحسابك."
              : "All orders linked to your account."}
          </p>
        </section>

        {!user && !loading && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-extrabold text-gray-900">
              {lang === "ar" ? "يرجى تسجيل الدخول أولاً" : "Please sign in first"}
            </h2>

            <Link
              href="/login"
              className="mt-4 inline-block rounded-2xl bg-green-600 px-6 py-3 font-bold text-white"
            >
              {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>
        )}

        {loading && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            {lang === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    {lang === "ar" ? "رقم الطلب" : "Order Number"}
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
                  {currentStatusMap[order.status as keyof typeof currentStatusMap] ||
                    order.status}
                </span>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p className="text-gray-600">
                  {lang === "ar" ? "الاسم" : "Name"}:{" "}
                  <span className="font-bold text-gray-900">
                    {order.customer_name}
                  </span>
                </p>

                <p className="text-gray-600">
                  {lang === "ar" ? "المبلغ" : "Amount"}:{" "}
                  <span className="font-bold text-green-700">
                    {Number(order.total_price).toLocaleString()} SYP
                  </span>
                </p>
              </div>

              <p className="mt-4 text-sm font-semibold text-green-700">
                {lang === "ar"
                  ? "اضغط لعرض تفاصيل الطلب"
                  : "Click to view order details"}
              </p>
            </Link>
          ))}

          {user && !loading && orders.length === 0 && (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-extrabold text-gray-900">
                {lang === "ar" ? "لا توجد طلبات" : "No orders found"}
              </h2>
              <p className="mt-2 text-gray-600">
                {lang === "ar"
                  ? "لا توجد طلبات مرتبطة بحسابك حالياً."
                  : "There are no orders linked to your account yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
