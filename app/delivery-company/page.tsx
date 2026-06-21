"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  governorate: string;
  delivery_area: string;
  address: string;
  delivery_fee: number;
  total_price: number;
  status: string;
  order_items?: OrderItem[];
};

export default function DeliveryCompanyPage() {
  const router = useRouter();

  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"accepted" | "out_for_delivery" | "delivered">(
    "accepted"
  );

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
      .in("status", ["accepted", "out_for_delivery", "delivered"])
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  async function updateOnlineStatus(companyId: number) {
    await supabase
      .from("delivery_companies")
      .update({
        is_online: true,
        last_seen: new Date().toISOString(),
      })
      .eq("id", companyId);
  }

  async function checkCompanyStillActive(companyId: number) {
    const { data } = await supabase
      .from("delivery_companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (!data || !data.is_active) {
      localStorage.removeItem("delivery_company");
      router.push("/delivery-company/login");
      return false;
    }

    setCompany(data);
    return true;
  }

  async function refreshAll(companyId: number) {
    const active = await checkCompanyStillActive(companyId);
    if (!active) return;

    await updateOnlineStatus(companyId);
    await loadOrders();
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    setUpdatingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  }

  async function logout() {
    if (company?.id) {
      await supabase
        .from("delivery_companies")
        .update({
          is_online: false,
          last_seen: new Date().toISOString(),
        })
        .eq("id", company.id);
    }

    localStorage.removeItem("delivery_company");
    router.push("/delivery-company/login");
  }

  useEffect(() => {
    const savedCompany = localStorage.getItem("delivery_company");

    if (!savedCompany) {
      router.push("/delivery-company/login");
      return;
    }

    const parsedCompany = JSON.parse(savedCompany);
    setCompany(parsedCompany);

    refreshAll(parsedCompany.id);

    const interval = setInterval(() => {
      refreshAll(parsedCompany.id);
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const filteredOrders = orders.filter((order) => order.status === filter);

  const counts = {
    accepted: orders.filter((order) => order.status === "accepted").length,
    out_for_delivery: orders.filter((order) => order.status === "out_for_delivery")
      .length,
    delivered: orders.filter((order) => order.status === "delivered").length,
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <section className="mb-6 rounded-[2rem] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                لوحة شركة التوصيل
              </h1>

              <p className="mt-2 text-gray-600">
                مسجل الدخول باسم:{" "}
                <span className="font-bold text-green-700">
                  {company?.company_name || "..."}
                </span>
              </p>

              <p className="mt-1 text-sm text-gray-500">
                يتم تحديث الطلبات تلقائياً كل 30 ثانية.
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-2xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
            >
              تسجيل الخروج
            </button>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-3 gap-3">
          <button
            onClick={() => setFilter("accepted")}
            className={`rounded-2xl px-3 py-4 text-sm font-extrabold transition ${
              filter === "accepted"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            بانتظار الاستلام
            <span className="mt-1 block text-xs">({counts.accepted})</span>
          </button>

          <button
            onClick={() => setFilter("out_for_delivery")}
            className={`rounded-2xl px-3 py-4 text-sm font-extrabold transition ${
              filter === "out_for_delivery"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            قيد التوصيل
            <span className="mt-1 block text-xs">
              ({counts.out_for_delivery})
            </span>
          </button>

          <button
            onClick={() => setFilter("delivered")}
            className={`rounded-2xl px-3 py-4 text-sm font-extrabold transition ${
              filter === "delivered"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 shadow-sm"
            }`}
          >
            تم التسليم
            <span className="mt-1 block text-xs">({counts.delivered})</span>
          </button>
        </section>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-bold text-gray-700 shadow-sm">
            جاري تحميل الطلبات...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-extrabold text-gray-900">
              لا توجد طلبات حالياً
            </h2>

            <p className="mt-2 text-gray-600">
              ستظهر الطلبات هنا حسب الفلتر المحدد.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                updatingId={updatingId}
                onUpdateStatus={updateOrderStatus}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function OrderCard({
  order,
  updatingId,
  onUpdateStatus,
}: {
  order: Order;
  updatingId: string | null;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}) {
  const productsTotal =
    Number(order.total_price || 0) - Number(order.delivery_fee || 0);

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-500">رقم الطلب</p>
          <h3 className="mt-1 text-2xl font-extrabold text-gray-900">
            #{order.id}
          </h3>
        </div>

        <span
          className={`w-fit rounded-full px-4 py-2 text-sm font-extrabold ${
            order.status === "accepted"
              ? "bg-green-50 text-green-700"
              : order.status === "out_for_delivery"
              ? "bg-blue-50 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status === "accepted"
            ? "بانتظار الاستلام"
            : order.status === "out_for_delivery"
            ? "قيد التوصيل"
            : "تم التسليم"}
        </span>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <Info label="اسم الزبون" value={order.customer_name} />
        <Info label="رقم الهاتف" value={order.phone} />
        <Info label="المحافظة" value={order.governorate} />
        <Info label="المنطقة" value={order.delivery_area} />
      </div>

      <div className="mt-4 rounded-2xl bg-gray-50 p-4">
        <p className="text-sm font-bold text-gray-500">تفاصيل العنوان</p>
        <p className="mt-1 font-bold leading-7 text-gray-900">
          {order.address}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 p-4">
        <h4 className="mb-3 font-extrabold text-gray-900">المنتجات</h4>

        <div className="space-y-3">
          {(order.order_items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-3 text-sm"
            >
              <div>
                <p className="font-bold text-gray-900">{item.product_name}</p>
                <p className="mt-1 text-gray-600">الكمية: {item.quantity}</p>
              </div>

              <p className="font-bold text-green-700">
                {(Number(item.unit_price) * item.quantity).toLocaleString()} SYP
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-green-50 p-4">
        <div className="flex justify-between text-sm font-bold text-gray-700">
          <span>قيمة المنتجات</span>
          <span>{productsTotal.toLocaleString()} SYP</span>
        </div>

        <div className="mt-2 flex justify-between text-sm font-bold text-gray-700">
          <span>أجرة التوصيل</span>
          <span>{Number(order.delivery_fee || 0).toLocaleString()} SYP</span>
        </div>

        <div className="mt-3 flex justify-between border-t border-green-100 pt-3 text-lg font-extrabold text-gray-900">
          <span>المبلغ الكامل</span>
          <span className="text-green-700">
            {Number(order.total_price).toLocaleString()} SYP
          </span>
        </div>
      </div>

      <div className="mt-5">
        {order.status === "accepted" && (
          <button
            onClick={() => onUpdateStatus(order.id, "out_for_delivery")}
            disabled={updatingId === order.id}
            className="w-full rounded-2xl bg-blue-600 py-4 font-extrabold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
          >
            {updatingId === order.id ? "جاري التحديث..." : "قبول الطلب"}
          </button>
        )}

        {order.status === "out_for_delivery" && (
          <button
            onClick={() => onUpdateStatus(order.id, "delivered")}
            disabled={updatingId === order.id}
            className="w-full rounded-2xl bg-green-600 py-4 font-extrabold text-white transition hover:bg-green-700 disabled:bg-gray-400"
          >
            {updatingId === order.id ? "جاري التحديث..." : "تم تسليم الطلب"}
          </button>
        )}

        {order.status === "delivered" && (
          <div className="rounded-2xl bg-gray-100 py-4 text-center font-extrabold text-gray-700">
            تم تسليم هذا الطلب
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-1 font-bold text-gray-900">{value || "-"}</p>
    </div>
  );
}