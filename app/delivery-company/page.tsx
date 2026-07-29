"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Truck,
} from "lucide-react";

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

const STATUS_CONFIG = {
  accepted: {
    label: "بانتظار الاستلام",
    short: "انتظار",
    color: "bg-amber-500",
    ring: "ring-amber-200",
    text: "text-amber-700",
    bg: "bg-amber-50",
    tabActive: "bg-amber-500 text-white shadow-md",
    tabInactive: "bg-white text-gray-600",
  },
  out_for_delivery: {
    label: "قيد التوصيل",
    short: "توصيل",
    color: "bg-blue-600",
    ring: "ring-blue-200",
    text: "text-blue-700",
    bg: "bg-blue-50",
    tabActive: "bg-blue-600 text-white shadow-md",
    tabInactive: "bg-white text-gray-600",
  },
  delivered: {
    label: "تم التسليم",
    short: "مسلّم",
    color: "bg-green-600",
    ring: "ring-green-200",
    text: "text-green-700",
    bg: "bg-green-50",
    tabActive: "bg-green-600 text-white shadow-md",
    tabInactive: "bg-white text-gray-600",
  },
} as const;

export default function DeliveryCompanyPage() {
  const router = useRouter();
  const [company, setCompany] = useState<DeliveryCompany | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<OrderStatus>("accepted");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/staff/delivery-company/orders", {
        credentials: "include",
        cache: "no-store",
      });

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

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders(true);
    setRefreshing(false);
  }

  async function updateOrderStatus(
    orderId: number,
    status: Exclude<OrderStatus, "accepted">
  ) {
    setUpdatingId(orderId);
    setError("");

    try {
      const response = await fetch("/api/staff/delivery-company/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const result = (await response.json()) as { error?: string };

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
        await loadOrders(true);
        return;
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order
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
    const t = window.setTimeout(() => void loadOrders(), 0);
    const interval = window.setInterval(() => void loadOrders(true), 30_000);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(interval);
    };
  }, [loadOrders]);

  const filteredOrders = orders.filter((o) =>
    o.status === filter &&
    (areaFilter === null || o.delivery_area === areaFilter)
  );
  const allAreasForTab = Array.from(
    new Set(orders.filter((o) => o.status === filter).map((o) => o.delivery_area || "غير محدد"))
  ).sort();

  const counts = {
    accepted: orders.filter((o) => o.status === "accepted").length,
    out_for_delivery: orders.filter((o) => o.status === "out_for_delivery").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f4f5f1]">

      {/* ── Top header bar ── */}
      <header className="sticky top-0 z-30 border-b border-[#e5e9e5] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a583b] text-sm font-extrabold text-white">
              {company?.company_name?.charAt(0) ?? "؟"}
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#9aaba0]">لوحة التوصيل</p>
              <p className="text-sm font-extrabold text-[#111916]">
                {company?.company_name ?? "..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dde4df] bg-white text-[#647168] transition hover:border-[#0a583b] hover:text-[#0a583b] disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dde4df] bg-white text-[#647168] transition hover:border-red-300 hover:text-red-600"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5">

        {/* ── Stats row ── */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {(["accepted", "out_for_delivery", "delivered"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => { setFilter(s); setAreaFilter(null); }}
                aria-pressed={filter === s}
                className={`relative rounded-2xl px-3 py-4 text-center transition ${
                  filter === s ? cfg.tabActive : cfg.tabInactive + " shadow-sm border border-[#e5e9e5]"
                }`}
              >
                <span className="block text-2xl font-extrabold leading-none">
                  {counts[s]}
                </span>
                <span className={`mt-1.5 block text-[11px] font-bold leading-tight ${
                  filter === s ? "text-white/80" : "text-gray-500"
                }`}>
                  {cfg.label}
                </span>
                {filter === s && (
                  <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-white/40" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Auto-refresh note ── */}
        <p className="mb-4 flex items-center gap-1.5 text-xs text-[#9aaba0]">
          <Clock size={11} />
          يتم التحديث تلقائياً كل 30 ثانية
        </p>

        {/* ── Area filter pills ── */}
        {allAreasForTab.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAreaFilter(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                areaFilter === null
                  ? "bg-[#0a583b] text-white"
                  : "border border-[#e5e9e5] bg-white text-[#647168] hover:border-[#0a583b] hover:text-[#0a583b]"
              }`}
            >
              كل المناطق
            </button>
            {allAreasForTab.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setAreaFilter(area === areaFilter ? null : area)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                  areaFilter === area
                    ? "bg-[#0a583b] text-white"
                    : "border border-[#e5e9e5] bg-white text-[#647168] hover:border-[#0a583b] hover:text-[#0a583b]"
                }`}
              >
                {area}
                <span className={`mr-1 ${areaFilter === area ? "text-white/70" : "text-[#9aaba0]"}`}>
                  ({orders.filter((o) => o.status === filter && o.delivery_area === area).length})
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div role="alert" className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* ── Order list ── */}
        <div aria-live="polite">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
              <Loader2 size={28} className="animate-spin text-[#0a583b]" />
              <p className="mt-3 font-bold text-[#647168]">جاري تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
              <Package size={40} className="mx-auto mb-3 text-[#c8d5cd]" />
              <h2 className="text-xl font-extrabold text-[#111916]">لا توجد طلبات</h2>
              <p className="mt-1.5 text-sm text-[#9aaba0]">
                ستظهر هنا عند وصول طلبات جديدة.
              </p>
            </div>
          ) : (
            <OrdersByArea
              orders={filteredOrders}
              updatingId={updatingId}
              onUpdateStatus={updateOrderStatus}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function OrdersByArea({
  orders,
  updatingId,
  onUpdateStatus,
}: {
  orders: Order[];
  updatingId: number | null;
  onUpdateStatus: (orderId: number, status: Exclude<OrderStatus, "accepted">) => void;
}) {
  // Group by delivery_area, preserving insertion order
  const grouped = orders.reduce<Record<string, Order[]>>((acc, order) => {
    const area = order.delivery_area || "غير محدد";
    if (!acc[area]) acc[area] = [];
    acc[area].push(order);
    return acc;
  }, {});

  const areas = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {areas.map((area) => {
        const areaOrders = grouped[area];
        return (
          <div key={area}>
            {/* Area header */}
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0a583b] text-white">
                <MapPin size={13} />
              </div>
              <h2 className="text-base font-extrabold text-[#111916]">
                {area}
              </h2>
              <span className="rounded-full bg-[#edf5f0] px-2.5 py-0.5 text-xs font-extrabold text-[#0a583b]">
                {areaOrders.length} {areaOrders.length === 1 ? "طلب" : "طلبات"}
              </span>
              <div className="h-px flex-1 bg-[#e5e9e5]" />
            </div>

            {/* Orders in this area */}
            <div className="space-y-4">
              {areaOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  updatingId={updatingId}
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  order,
  updatingId,
  onUpdateStatus,
}: {
  order: Order;
  updatingId: number | null;
  onUpdateStatus: (orderId: number, status: Exclude<OrderStatus, "accepted">) => void;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const productsTotal = Number(order.total_price || 0) - Number(order.delivery_fee || 0);
  const isUpdating = updatingId === order.id;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e5e9e5] bg-white shadow-sm">

      {/* Card header */}
      <div className={`flex items-center justify-between gap-3 px-5 py-3.5 ${cfg.bg}`}>
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.color}`} />
          <span className={`text-xs font-extrabold ${cfg.text}`}>{cfg.label}</span>
        </div>
        <span className="text-sm font-extrabold text-[#111916]">
          طلب #{order.id}
        </span>
      </div>

      <div className="p-5">

        {/* Customer info */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2.5 rounded-xl bg-[#f8faf8] px-3.5 py-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <Package size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaba0]">الزبون</p>
              <p className="mt-0.5 truncate text-sm font-extrabold text-[#111916]">{order.customer_name}</p>
            </div>
          </div>

          <a
            href={`tel:${order.phone}`}
            className="flex items-start gap-2.5 rounded-xl bg-[#f0fdf4] px-3.5 py-3 transition hover:bg-[#dcfce7]"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#bbf7d0] text-[#15803d]">
              <Phone size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaba0]">الهاتف</p>
              <p className="mt-0.5 truncate text-sm font-extrabold text-[#15803d]" dir="ltr">{order.phone}</p>
            </div>
          </a>
        </div>

        {/* Address */}
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#e5e9e5] px-3.5 py-3.5">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
            <MapPin size={13} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#9aaba0]">
              {order.governorate} — {order.delivery_area}
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-[#111916]">
              {order.address || "—"}
            </p>
          </div>
        </div>

        {/* Products */}
        <div className="mb-4 rounded-xl border border-[#e5e9e5]">
          <div className="border-b border-[#e5e9e5] px-4 py-2.5">
            <p className="text-xs font-extrabold text-[#647168]">المنتجات</p>
          </div>
          <div className="divide-y divide-[#f1f3f1]">
            {(order.order_items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#111916]">{item.product_name}</p>
                  <p className="mt-0.5 text-xs text-[#9aaba0]">الكمية: {item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-[#0a583b]">
                  {(Number(item.unit_price) * item.quantity).toLocaleString()} ل.س
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="mb-5 rounded-xl bg-[#f8faf8] px-4 py-3.5">
          <div className="flex justify-between text-xs font-bold text-[#647168]">
            <span>قيمة المنتجات</span>
            <span>{productsTotal.toLocaleString()} ل.س</span>
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-[#647168]">
            <span>أجرة التوصيل</span>
            <span>{Number(order.delivery_fee || 0).toLocaleString()} ل.س</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-[#e5e9e5] pt-3">
            <span className="font-extrabold text-[#111916]">المبلغ الكامل</span>
            <span className="text-base font-extrabold text-[#0a583b]">
              {Number(order.total_price).toLocaleString()} ل.س
            </span>
          </div>
        </div>

        {/* Action button */}
        {order.status === "accepted" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(order.id, "out_for_delivery")}
            disabled={updatingId !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-4 font-extrabold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Truck size={18} />
            )}
            {isUpdating ? "جاري التحديث..." : "استلام الطلب وبدء التوصيل"}
          </button>
        )}

        {order.status === "out_for_delivery" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(order.id, "delivered")}
            disabled={updatingId !== null}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#0a583b] py-4 font-extrabold text-white transition hover:bg-[#073f2c] disabled:opacity-60"
          >
            {isUpdating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            {isUpdating ? "جاري التحديث..." : "تأكيد التسليم"}
          </button>
        )}

        {order.status === "delivered" && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-[#f0fdf4] py-4 font-extrabold text-[#15803d]">
            <CheckCircle2 size={18} />
            تم تسليم هذا الطلب
          </div>
        )}
      </div>
    </article>
  );
}