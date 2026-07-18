"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DriverOrder = {
  id: number;
  customer_name?: string | null;
  phone?: string | null;
  delivery_area?: string | null;
  address?: string | null;
  total_price?: number | string | null;
};

export default function DriverPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [driverName, setDriverName] = useState("");
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
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
      .eq("status", "accepted")
      .is("driver_name", null)
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setOrders(data || []);
  }, []);

  const checkActiveOrder = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id")
      .eq("driver_name", name)
      .eq("status", "out_for_delivery")
      .limit(1);

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      router.push("/driver/my-orders");
    }
  }, [router]);

  async function acceptOrder(id: number) {
    const savedName = localStorage.getItem("driver_name");

    if (!savedName) {
      router.replace("/driver/login");
      return;
    }

    setLoadingOrderId(id);

    const { data: activeOrders, error: activeError } = await supabase
      .from("orders")
      .select("id")
      .eq("driver_name", savedName)
      .eq("status", "out_for_delivery")
      .limit(1);

    if (activeError) {
      setLoadingOrderId(null);
      alert(activeError.message);
      return;
    }

    if (activeOrders && activeOrders.length > 0) {
      setLoadingOrderId(null);
      alert("لديك طلب قيد التوصيل بالفعل");
      router.push("/driver/my-orders");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "out_for_delivery",
        driver_name: savedName,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "accepted")
      .is("driver_name", null);

    setLoadingOrderId(null);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/driver/my-orders"); 
  }

  function logout() {
    localStorage.removeItem("driver_id");
    localStorage.removeItem("driver_name");
    localStorage.removeItem("driver_username");
    router.replace("/driver/login");
  }

  useEffect(() => {
    let cleanupRealtime: (() => void) | undefined;

    const initializationTimer = window.setTimeout(() => {
      const savedName = localStorage.getItem("driver_name");

    if (!savedName) {
      router.replace("/driver/login");
      return;
    }

    const authenticatedDriverName = savedName;

    setDriverName(authenticatedDriverName);
    void checkActiveOrder(authenticatedDriverName);
    void loadOrders();

    function refreshOrders() {
      void checkActiveOrder(authenticatedDriverName);
      void loadOrders();
    }

    window.addEventListener(
      "driverRefreshRequested",
      refreshOrders
    );

    const channel = supabase
      .channel("orders-driver-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void checkActiveOrder(authenticatedDriverName);
          void loadOrders();
        }
      )
      .subscribe();

      cleanupRealtime = () => {
        window.removeEventListener(
          "driverRefreshRequested",
          refreshOrders
        );
        void supabase.removeChannel(channel);
      };
    }, 0);

    return () => {
      window.clearTimeout(initializationTimer);
      cleanupRealtime?.();
    };
  }, [checkActiveOrder, loadOrders, router]);

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-green-50 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-5 rounded-2xl bg-green-700 p-5 text-white shadow">
          <h1 className="text-xl font-extrabold">طلبات جاهزة للتوصيل</h1>
          <p className="mt-1 text-sm text-green-100">السائق: {driverName}</p>
        </div>

        <div className="mb-5 flex gap-2">
          

          <button onClick={logout} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white">
            خروج
          </button>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500">لا يوجد طلبات متاحة حالياً</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-4 shadow">
                <div className="mb-2 text-sm text-gray-500">
                  👤 العميل: <span className="font-bold text-gray-900">{order.customer_name || "-"}</span>
                </div>

                <div className="mb-2 text-sm text-gray-500">
                  📞 الهاتف:{" "}
                  {order.phone ? (
                    <a href={`tel:${order.phone}`} className="font-bold text-green-700 underline">
                      {order.phone}
                    </a>
                  ) : "-"}
                </div>

                <div className="mb-2 text-sm text-gray-500">
                  📍 المنطقة: <span className="font-bold text-gray-900">{order.delivery_area || "-"}</span>
                </div>

                <div className="mb-2 text-sm text-gray-500">
                  🏠 العنوان: <span className="font-bold text-gray-900">{order.address || "-"}</span>
                </div>

                <div className="mb-4 text-sm text-gray-500">
                  💰 الإجمالي:{" "}
                  <span className="font-bold text-green-700">
                    {Number(order.total_price || 0).toLocaleString()} ل.س
                  </span>
                </div>

                <button
                  onClick={() => acceptOrder(order.id)}
                  disabled={loadingOrderId === order.id}
                  className={`w-full rounded-xl py-3 font-bold text-white transition ${
                    loadingOrderId === order.id ? "bg-green-400" : "bg-green-600 active:scale-95"
                  }`}
                >
                  {loadingOrderId === order.id ? "جارٍ استلام الطلب..." : "استلام الطلب"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
