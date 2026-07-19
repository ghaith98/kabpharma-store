"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type OrderStatus =
  | "accepted"
  | "out_for_delivery"
  | "delivered";

type Order = {
  id: number;
  customer_name: string;
  phone: string;
  governorate: string;
  delivery_area: string;
  address: string;
  delivery_fee: number;
  total_price: number;
  status: OrderStatus;
  order_items?: OrderItem[];
};

type DeliveryCompany = {
  id: number;
  company_name: string;
};

export default function DeliveryCompanyPage() {
  const router = useRouter();
  const [company, setCompany] =
    useState<DeliveryCompany | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);
  const [filter, setFilter] =
    useState<OrderStatus>("accepted");

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/staff/delivery-company/orders",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/delivery-company/login");
        return;
      }

      const result = (await response.json()) as {
        error?: string;
        company?: DeliveryCompany;
        orders?: Order[];
      };

      if (!response.ok) {
        setError(result.error || "تعذر تحميل الطلبات");
        return;
      }

      setError("");
      setCompany(result.company || null);
      setOrders(result.orders || []);
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function updateOrderStatus(
    orderId: number,
    status: Exclude<OrderStatus, "accepted">
  ) {
    setUpdatingId(orderId);
    setError("");

    try {
      const response = await fetch(
        "/api/staff/delivery-company/orders",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId, status }),
        }
      );

      const result = (await response.json()) as {
        error?: string;
      };

      if (response.status === 401) {
        router.replace("/delivery-company/login");
        return;
      }

      if (!response.ok) {
        setError(
          response.status === 409
            ? "تغيّرت حالة الطلب. تم تحديث القائمة."
            : result.error || "تعذر تحديث الطلب"
        );
        await loadOrders();
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status }
            : order
        )
      );
    } catch {
      setError("تعذر تحديث الطلب. حاول مجدداً.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function logout() {
    await fetch("/api/staff/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);
    router.replace("/delivery-company/login");
    router.refresh();
  }

  useEffect(() => {
    const initializationTimer = window.setTimeout(
      () => void loadOrders(),
      0
    );
    const interval = window.setInterval(
      () => void loadOrders(),
      30_000
    );
    return () => {
      window.clearTimeout(initializationTimer);
      window.clearInterval(interval);
    };
  }, [loadOrders]);

  const filteredOrders = orders.filter(
    (order) => order.status === filter
  );
  const counts = {
    accepted: orders.filter(
      (order) => order.status === "accepted"
    ).length,
    out_for_delivery: orders.filter(
      (order) => order.status === "out_for_delivery"
    ).length,
    delivered: orders.filter(
      (order) => order.status === "delivered"
    ).length,
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
                مسجل الدخول باسم: {" "}
                <span className="font-bold text-green-700">
                  {company?.company_name || "..."}
                </span>
              </p>
              <p className="mt-1 text-sm text-gray-500">
                يتم تحديث الطلبات تلقائياً كل 30 ثانية.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void loadOrders()}
                disabled={loading}
                className="rounded-2xl border border-green-700 px-5 py-3 font-bold text-green-800 disabled:opacity-50"
              >
                تحديث
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-2xl border border-gray-300 px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </section>

        <section
          aria-label="تصفية الطلبات حسب الحالة"
          className="mb-6 grid grid-cols-3 gap-3"
        >
          {(
            [
              ["accepted", "بانتظار الاستلام"],
              ["out_for_delivery", "قيد التوصيل"],
              ["delivered", "تم التسليم"],
            ] as const
          ).map(([status, label]) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              aria-pressed={filter === status}
              className={`rounded-2xl px-3 py-4 text-sm font-extrabold transition ${
                filter === status
                  ? status === "accepted"
                    ? "bg-green-700 text-white"
                    : status === "out_for_delivery"
                      ? "bg-blue-700 text-white"
                      : "bg-gray-900 text-white"
                  : "bg-white text-gray-700 shadow-sm"
              }`}
            >
              {label}
              <span className="mt-1 block text-xs">
                ({counts[status]})
              </span>
            </button>
          ))}
        </section>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-2xl bg-red-50 p-4 font-bold text-red-700"
          >
            {error}
          </p>
        )}

        <div aria-live="polite">
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
  updatingId: number | null;
  onUpdateStatus: (
    orderId: number,
    status: Exclude<OrderStatus, "accepted">
  ) => void;
}) {
  const productsTotal =
    Number(order.total_price || 0) -
    Number(order.delivery_fee || 0);

  return (
    <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-500">رقم الطلب</p>
          <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
            #{order.id}
          </h2>
        </div>
        <span className="w-fit rounded-full bg-gray-100 px-4 py-2 text-sm font-extrabold text-gray-700">
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
          {order.address || "-"}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-100 p-4">
        <h3 className="mb-3 font-extrabold text-gray-900">المنتجات</h3>
        <div className="space-y-3">
          {(order.order_items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-3 text-sm"
            >
              <div>
                <p className="font-bold text-gray-900">
                  {item.product_name}
                </p>
                <p className="mt-1 text-gray-600">
                  الكمية: {item.quantity}
                </p>
              </div>
              <p className="font-bold text-green-700">
                {(
                  Number(item.unit_price) * item.quantity
                ).toLocaleString()} {" "}
                SYP
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
          <span>
            {Number(order.delivery_fee || 0).toLocaleString()} SYP
          </span>
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
            type="button"
            onClick={() =>
              onUpdateStatus(order.id, "out_for_delivery")
            }
            disabled={updatingId !== null}
            className="w-full rounded-2xl bg-blue-700 py-4 font-extrabold text-white transition hover:bg-blue-800 disabled:bg-gray-400"
          >
            {updatingId === order.id ? "جاري التحديث..." : "قبول الطلب"}
          </button>
        )}
        {order.status === "out_for_delivery" && (
          <button
            type="button"
            onClick={() =>
              onUpdateStatus(order.id, "delivered")
            }
            disabled={updatingId !== null}
            className="w-full rounded-2xl bg-green-700 py-4 font-extrabold text-white transition hover:bg-green-800 disabled:bg-gray-400"
          >
            {updatingId === order.id
              ? "جاري التحديث..."
              : "تم تسليم الطلب"}
          </button>
        )}
        {order.status === "delivered" && (
          <div className="rounded-2xl bg-gray-100 py-4 text-center font-extrabold text-gray-700">
            تم تسليم هذا الطلب
          </div>
        )}
      </div>
    </article>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 p-4">
      <p className="text-sm font-bold text-gray-500">{label}</p>
      <p className="mt-1 font-bold text-gray-900">{value || "-"}</p>
    </div>
  );
}
