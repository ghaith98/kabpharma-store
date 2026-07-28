"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LogIn,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
  UserPlus,
  XCircle,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total_price: number;
  status: string;
};

type StoredUser = {
  phone: string;
  full_name?: string;
};

const statusMap = {
  en: {
    pending: "Under review",
    accepted: "Order accepted",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    rejected: "Not approved",
    cancelled_by_customer: "Cancelled",
  },
  ar: {
    pending: "قيد المراجعة",
    accepted: "تم قبول الطلب",
    out_for_delivery: "قيد التوصيل",
    delivered: "تم التسليم",
    rejected: "لم تتم الموافقة",
    cancelled_by_customer: "تم الإلغاء",
  },
};

const statusClass: Record<string, string> = {
  pending: "border-[#ead9a5] bg-[#fff9e9] text-[#866516]",
  accepted: "border-[#b8d7c4] bg-[#edf5f0] text-[#0a583b]",
  out_for_delivery: "border-[#bed6df] bg-[#eef7fa] text-[#255f73]",
  delivered: "border-[#acd0ba] bg-[#e8f4ed] text-[#073f2c]",
  rejected: "border-[#e8c7c2] bg-[#fff3f1] text-[#9a4036]",
  cancelled_by_customer:
    "border-[#d8dcda] bg-[#f3f5f3] text-[#657068]",
};

function StatusIcon({
  status,
}: {
  status: string;
}) {
  const iconClass = "h-3.5 w-3.5";

  if (status === "delivered") {
    return <CheckCircle2 className={iconClass} />;
  }

  if (status === "out_for_delivery") {
    return <Truck className={iconClass} />;
  }

  if (
    status === "rejected" ||
    status === "cancelled_by_customer"
  ) {
    return <XCircle className={iconClass} />;
  }

  if (status === "accepted") {
    return <PackageCheck className={iconClass} />;
  }

  return <Clock3 className={iconClass} />;
}

export default function OrdersSearchClient() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const response = await fetch("/api/customer/orders", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
            setOrders([]);
          }
          return;
        }

        const result = await response.json();

        if (!cancelled) {
          setUser(result.user || null);
          setOrders(result.orders || []);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentStatusMap = statusMap[isArabic ? "ar" : "en"];
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  if (loading) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        aria-busy="true"
        aria-label={isArabic ? "جاري تحميل الطلبات" : "Loading orders"}
        className="min-h-screen bg-[#f7f7f3] px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      >
        <div className="mx-auto max-w-[1120px] animate-pulse">
          <div className="h-3 w-24 rounded-full bg-[#dfe5e0]" />
          <div className="mt-5 h-10 w-60 max-w-full rounded-xl bg-[#dfe5e0]" />
          <div className="mt-4 h-4 w-96 max-w-full rounded-full bg-[#e7ebe8]" />
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-56 rounded-[1.5rem] border border-[#e2e7e3] bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f7f3] px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-12 lg:px-8"
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="border-b border-[#dfe4e0] pb-7 sm:pb-9">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
            KAB Pharma
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[#142019] sm:text-5xl">
            {isArabic ? "طلباتي" : "My orders"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
            {isArabic
              ? "راجعي طلباتك، تابعي حالة التوصيل، واطّلعي على كل التفاصيل في مكان واحد."
              : "Review your purchases, follow delivery progress, and find every order detail in one place."}
          </p>
        </header>

        {!user ? (
          <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white sm:mt-10">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                  <Package className="h-6 w-6" strokeWidth={1.8} />
                </div>

                <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.16em] text-[#7b867e]">
                  {isArabic ? "مساحتك الخاصة" : "Your private order space"}
                </p>

                <h2 className="mt-3 max-w-xl text-2xl font-extrabold tracking-[-0.025em] text-[#142019] sm:text-3xl">
                  {isArabic
                    ? "سجّلي الدخول لمتابعة طلباتك بأمان"
                    : "Sign in to follow your orders securely"}
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-[#647168] sm:text-base">
                  {isArabic
                    ? "ستظهر هنا حالة الطلب، تفاصيل التوصيل، والمبلغ الإجمالي للحساب المرتبط برقم هاتفك."
                    : "Your order status, delivery details, and totals will appear here for the account linked to your phone number."}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c] focus-visible:outline-[#0a583b]"
                  >
                    <LogIn className="h-4 w-4" />
                    {isArabic ? "تسجيل الدخول" : "Sign in"}
                  </Link>

                  <Link
                    href="/signup"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#cbd3cd] bg-white px-6 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
                  >
                    <UserPlus className="h-4 w-4" />
                    {isArabic ? "إنشاء حساب" : "Create account"}
                  </Link>
                </div>
              </div>

              <div className="relative hidden min-h-[390px] overflow-hidden bg-[#073f2c] p-9 text-white lg:flex lg:flex-col lg:justify-end">
                <div className="absolute -end-20 -top-16 h-64 w-64 rounded-full border border-white/10" />
                <div className="absolute end-12 top-12 h-28 w-28 rounded-full bg-white/[0.05]" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <PackageCheck className="h-7 w-7" strokeWidth={1.7} />
                </div>
                <h3 className="relative mt-6 text-xl font-extrabold">
                  {isArabic ? "كل تحديث، في مكان واحد" : "Every update, in one place"}
                </h3>
                <p className="relative mt-3 text-sm leading-7 text-white/65">
                  {isArabic
                    ? "من مراجعة الطلب وحتى وصوله إلى بابك."
                    : "From order review through delivery to your door."}
                </p>
              </div>
            </div>
          </section>
        ) : orders.length === 0 ? (
          <section className="mt-8 rounded-[1.75rem] border border-[#dfe4e0] bg-white px-6 py-12 text-center sm:mt-10 sm:px-10 sm:py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <ShoppingBag className="h-7 w-7" strokeWidth={1.7} />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-[#142019]">
              {isArabic ? "لا توجد طلبات بعد" : "No orders yet"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#647168]">
              {isArabic
                ? "عندما تطلبين أحد منتجاتنا، ستتمكنين من متابعة كل تفاصيله من هنا."
                : "Once you place an order, you’ll be able to follow every detail from here."}
            </p>
            <Link
              href="/products"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
            >
              {isArabic ? "تصفّح المنتجات" : "Explore products"}
              <DirectionArrow className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <section className="mt-8 sm:mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-[#142019]">
                  {isArabic
                    ? `مرحباً${user.full_name ? `، ${user.full_name}` : ""}`
                    : `Welcome${user.full_name ? `, ${user.full_name}` : ""}`}
                </p>
                <p className="mt-1 text-xs text-[#7b867e]">
                  {isArabic
                    ? `${orders.length} طلبات مرتبطة بحسابك`
                    : `${orders.length} ${orders.length === 1 ? "order" : "orders"} linked to your account`}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group flex min-h-[224px] flex-col rounded-[1.5rem] border border-[#dfe4e0] bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#b8cbbf] hover:shadow-[0_16px_40px_rgba(20,32,25,0.07)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7b867e]">
                        {isArabic ? "رقم الطلب" : "Order number"}
                      </p>
                      <h2
                        dir="ltr"
                        className={`mt-2 text-xl font-extrabold tracking-tight text-[#142019] ${
                          isArabic ? "text-right" : "text-left"
                        }`}
                      >
                        #{order.id}
                      </h2>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${
                        statusClass[order.status] ||
                        "border-[#d8dcda] bg-[#f3f5f3] text-[#657068]"
                      }`}
                    >
                      <StatusIcon status={order.status} />
                      {currentStatusMap[
                        order.status as keyof typeof currentStatusMap
                      ] || order.status}
                    </span>
                  </div>

                  <div className="mt-7 border-t border-[#edf0ed] pt-5">
                    <p className="text-xs font-bold text-[#7b867e]">
                      {isArabic ? "المبلغ الإجمالي" : "Order total"}
                    </p>
                    <p
                      dir="ltr"
                      className={`mt-1 text-lg font-extrabold text-[#0a583b] ${
                        isArabic ? "text-right" : "text-left"
                      }`}
                    >
                      {Number(order.total_price).toLocaleString()} SYP
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-extrabold text-[#142019]">
                    <span>{isArabic ? "عرض تفاصيل الطلب" : "View order details"}</span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b] transition group-hover:bg-[#0a583b] group-hover:text-white">
                      <DirectionArrow className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
