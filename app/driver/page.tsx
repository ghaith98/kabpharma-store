"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DriverOrder = {
  id: number;
  customer_name?: string | null;
  phone?: string | null;
  delivery_area?: string | null;
  address?: string | null;
  total_price?: number | string | null;
};

type DriverOrdersResponse = {
  success: boolean;
  error?: string;
  driver?: {
    id: number;
    name: string;
  };
  availableOrders?: DriverOrder[];
  myOrders?: DriverOrder[];
};

export default function DriverPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [driverName, setDriverName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingOrderId, setLoadingOrderId] =
    useState<number | null>(null);

  const loadOrders = useCallback(async () => {
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

      const result =
        (await response.json()) as DriverOrdersResponse;

      if (!response.ok) {
        setError(
          result.error || "تعذر تحميل الطلبات"
        );
        return;
      }

      setError("");
      setDriverName(result.driver?.name || "");
      setOrders(result.availableOrders || []);

      if ((result.myOrders || []).length > 0) {
        router.replace("/driver/my-orders");
      }
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function acceptOrder(id: number) {
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
            action: "accept",
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
        setError(
          response.status === 409
            ? "الطلب لم يعد متاحاً أو لديك طلب قيد التوصيل."
            : result.error || "تعذر استلام الطلب"
        );
        await loadOrders();
        return;
      }

      router.push("/driver/my-orders");
    } catch {
      setError("تعذر استلام الطلب. حاول مجدداً.");
    } finally {
      setLoadingOrderId(null);
    }
  }

  async function logout() {
    await fetch("/api/staff/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => null);
    router.replace("/driver/login");
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

    function refreshOrders() {
      void loadOrders();
    }

    window.addEventListener(
      "driverRefreshRequested",
      refreshOrders
    );

    return () => {
      window.clearTimeout(initializationTimer);
      window.clearInterval(interval);
      window.removeEventListener(
        "driverRefreshRequested",
        refreshOrders
      );
    };
  }, [loadOrders]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 p-4"
    >
      <div className="mx-auto max-w-md">
        <div className="mb-5 rounded-2xl bg-green-700 p-5 text-white shadow">
          <h1 className="text-xl font-extrabold">
            طلبات جاهزة للتوصيل
          </h1>
          <p className="mt-1 text-sm text-green-100">
            السائق: {driverName || "..."}
          </p>
        </div>

        <div className="mb-5 flex gap-2">
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="flex-1 rounded-xl border border-green-700 px-4 py-3 text-sm font-bold text-green-800 disabled:opacity-50"
          >
            {loading ? "جاري التحديث..." : "تحديث الطلبات"}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white"
          >
            خروج
          </button>
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
            <p className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow">
              لا توجد طلبات متاحة حالياً
            </p>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-white p-4 shadow"
              >
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
                <p className="mb-2 text-sm text-gray-500">
                  🏠 العنوان: {" "}
                  <span className="font-bold text-gray-900">
                    {order.address || "-"}
                  </span>
                </p>
                <p className="mb-4 text-sm text-gray-500">
                  💰 الإجمالي: {" "}
                  <span className="font-bold text-green-700">
                    {Number(
                      order.total_price || 0
                    ).toLocaleString()} {" "}
                    ل.س
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() => void acceptOrder(order.id)}
                  disabled={loadingOrderId !== null}
                  className="w-full rounded-xl bg-green-700 py-3 font-bold text-white transition active:scale-95 disabled:cursor-wait disabled:bg-green-400"
                >
                  {loadingOrderId === order.id
                    ? "جارٍ استلام الطلب..."
                    : "استلام الطلب"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
