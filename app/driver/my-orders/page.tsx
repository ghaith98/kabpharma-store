"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DriverOrder = {
  id: number;
  customer_name?: string | null;
  phone?: string | null;
  delivery_area?: string | null;
  address?: string | null;
};

export default function DriverMyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [driverName, setDriverName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingOrderId, setLoadingOrderId] =
    useState<number | null>(null);

  const loadMyOrders = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/staff/driver/orders",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/driver/login");
        return;
      }

      const result = (await response.json()) as {
        error?: string;
        driver?: { name: string };
        myOrders?: DriverOrder[];
      };

      if (!response.ok) {
        setError(result.error || "تعذر تحميل الطلب");
        return;
      }

      setError("");
      setDriverName(result.driver?.name || "");
      setOrders(result.myOrders || []);
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function markDelivered(id: number) {
    setLoadingOrderId(id);
    setError("");

    try {
      const response = await fetch(
        "/api/staff/driver/orders",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "deliver",
            orderId: id,
          }),
        }
      );

      const result = (await response.json()) as {
        error?: string;
      };

      if (response.status === 401) {
        router.replace("/driver/login");
        return;
      }

      if (!response.ok) {
        setError(result.error || "تعذر تأكيد التسليم");
        await loadMyOrders();
        return;
      }

      router.push("/driver");
    } catch {
      setError("تعذر تأكيد التسليم. حاول مجدداً.");
    } finally {
      setLoadingOrderId(null);
    }
  }

  useEffect(() => {
    const initializationTimer = window.setTimeout(
      () => void loadMyOrders(),
      0
    );

    const interval = window.setInterval(
      () => void loadMyOrders(),
      30_000
    );

    return () => {
      window.clearTimeout(initializationTimer);
      window.clearInterval(interval);
    };
  }, [loadMyOrders]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 p-4"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-5 rounded-2xl bg-green-700 p-5 text-white shadow">
          <h1 className="text-xl font-extrabold">
            طلباتي الحالية
          </h1>
          <p className="mt-1 text-sm text-green-100">
            السائق: {driverName || "..."}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"
          >
            {error}
          </p>
        )}

        <div className="space-y-4" aria-live="polite">
          {!loading && orders.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center shadow">
              <p className="text-gray-500">
                لا يوجد طلب قيد التوصيل حالياً
              </p>
              <button
                type="button"
                onClick={() => router.push("/driver")}
                className="mt-4 rounded-xl bg-green-700 px-5 py-3 font-bold text-white"
              >
                عرض الطلبات المتاحة
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-white p-4 shadow"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    قيد التوصيل
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    Order #{order.id}
                  </span>
                </div>

                <p className="mb-2 text-sm text-gray-500">
                  👤 العميل: {" "}
                  <span className="font-bold text-gray-900">
                    {order.customer_name || "-"}
                  </span>
                </p>
                <p className="mb-2 text-sm text-gray-500">
                  📞 الهاتف: {" "}
                  {order.phone ? (
                    <a
                      href={`tel:${order.phone}`}
                      className="font-bold text-green-700 underline"
                    >
                      {order.phone}
                    </a>
                  ) : (
                    "-"
                  )}
                </p>
                <p className="mb-2 text-sm text-gray-500">
                  📍 المنطقة: {" "}
                  <span className="font-bold text-gray-900">
                    {order.delivery_area || "-"}
                  </span>
                </p>
                <p className="mb-4 text-sm text-gray-500">
                  🏠 العنوان: {" "}
                  <span className="font-bold text-gray-900">
                    {order.address || "-"}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() => void markDelivered(order.id)}
                  disabled={loadingOrderId !== null}
                  className="w-full rounded-xl bg-green-700 py-3 font-bold text-white transition disabled:cursor-wait disabled:bg-green-400"
                >
                  {loadingOrderId === order.id
                    ? "جارٍ تأكيد التسليم..."
                    : "تم التسليم"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

