"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  ReceiptText,
  ShoppingBag,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";

import CancelOrderClient from "../CancelOrderClient";
import { useLanguage } from "../../../context/LanguageContext";

type SupportedLanguage = "en" | "ar";

type OrderDetails = {
  id: number;
  status: string;
  payment_method?: string | null;
  total_price: number | string | null;
  customer_name: string | null;
  phone: string | null;
  address: string | null;
};

type StatusInformation = {
  label: string;
  description: string;
  badgeClass: string;
};

type StatusMap = Partial<
  Record<SupportedLanguage, Record<string, StatusInformation>>
>;

type TimelineStep = {
  key: string;
  label: string;
};

type TimelineSteps = Partial<
  Record<SupportedLanguage, TimelineStep[]>
>;

type OrderDetailsLanguageClientProps = {
  order: OrderDetails | null;
  statusMap?: StatusMap;
  timelineSteps?: TimelineSteps;
};

const statusStyle: Record<
  string,
  {
    badge: string;
    icon: string;
  }
> = {
  pending: {
    badge: "border-[#ead9a5] bg-[#fff9e9] text-[#866516]",
    icon: "bg-[#fff3c9] text-[#866516]",
  },
  accepted: {
    badge: "border-[#b8d7c4] bg-[#edf5f0] text-[#0a583b]",
    icon: "bg-[#dcece2] text-[#0a583b]",
  },
  out_for_delivery: {
    badge: "border-[#bed6df] bg-[#eef7fa] text-[#255f73]",
    icon: "bg-[#dcecf2] text-[#255f73]",
  },
  delivered: {
    badge: "border-[#acd0ba] bg-[#e8f4ed] text-[#073f2c]",
    icon: "bg-[#d5eadc] text-[#073f2c]",
  },
  rejected: {
    badge: "border-[#e8c7c2] bg-[#fff3f1] text-[#9a4036]",
    icon: "bg-[#f6dfdb] text-[#9a4036]",
  },
  cancelled_by_customer: {
    badge: "border-[#d8dcda] bg-[#f3f5f3] text-[#657068]",
    icon: "bg-[#e8ebe9] text-[#657068]",
  },
};

function OrderStatusIcon({
  status,
  className = "h-6 w-6",
}: {
  status: string;
  className?: string;
}) {
  if (status === "delivered") {
    return <CheckCircle2 className={className} />;
  }

  if (status === "out_for_delivery") {
    return <Truck className={className} />;
  }

  if (
    status === "rejected" ||
    status === "cancelled_by_customer"
  ) {
    return <XCircle className={className} />;
  }

  if (status === "accepted") {
    return <PackageCheck className={className} />;
  }

  return <Clock3 className={className} />;
}

export default function OrderDetailsLanguageClient({
  order,
  statusMap,
  timelineSteps,
}: OrderDetailsLanguageClientProps) {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const DirectionArrow = isArabic ? ArrowLeft : ArrowRight;

  if (!order) {
    return (
      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="min-h-screen bg-[#f7f7f3] px-4 py-10 sm:px-6 sm:py-16"
      >
        <div className="mx-auto max-w-2xl overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">
          <div className="p-7 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <ReceiptText className="h-7 w-7" strokeWidth={1.7} />
            </div>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-[#7b867e]">
              KAB Pharma
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.025em] text-[#142019] sm:text-3xl">
              {isArabic
                ? "تعذّر عرض تفاصيل الطلب"
                : "We couldn’t display this order"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#647168]">
              {isArabic
                ? "قد تحتاجين إلى تسجيل الدخول بالحساب المرتبط بالطلب، أو التأكد من رابط الطلب."
                : "You may need to sign in with the account linked to this order, or check that the order link is correct."}
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/orders"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
              >
                {isArabic ? "الانتقال إلى طلباتي" : "Go to my orders"}
                <DirectionArrow className="h-4 w-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cbd3cd] px-6 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
              >
                {isArabic ? "تصفّح المنتجات" : "Explore products"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentStatusMap = statusMap?.[lang] ?? {};
  const currentTimelineSteps = timelineSteps?.[lang] ?? [];
  const isCashOnDelivery = order.payment_method === "cod";
  const isRejected = order.status === "rejected";
  const isCancelled = order.status === "cancelled_by_customer";
  const isTerminal = isRejected || isCancelled;

  const fallbackStatus = {
    label: order.status,
    description: isArabic
      ? "حالة الطلب الحالية غير معروفة."
      : "The current order status is unknown.",
    badgeClass: "",
  };

  const status = currentStatusMap[order.status] || fallbackStatus;
  const style = statusStyle[order.status] || {
    badge: "border-[#d8dcda] bg-[#f3f5f3] text-[#657068]",
    icon: "bg-[#e8ebe9] text-[#657068]",
  };

  const statusDescription =
    order.status === "pending"
      ? isCashOnDelivery
        ? isArabic
          ? "تم استلام طلبك بنجاح. سنراجعه ونبدأ بتجهيزه، وسيتم الدفع لمندوب التوصيل عند الاستلام."
          : "Your order has been received. We’ll review it and begin preparing it; payment is due to the courier on delivery."
        : isArabic
          ? "تم استلام طلبك وإثبات الدفع بنجاح. يقوم فريقنا الآن بمراجعة التحويل، ولا حاجة لإعادة إرسال الإثبات."
          : "Your order and payment proof were received successfully. Our team is reviewing the transfer now; there’s no need to submit it again."
      : status.description;

  const timeline = currentTimelineSteps.map((step, index) =>
    index === 0
      ? {
          ...step,
          label: isCashOnDelivery
            ? isArabic
              ? "استلام الطلب"
              : "Order received"
            : step.label,
        }
      : step
  );

  const currentStepIndex = timeline.findIndex(
    (step) => step.key === order.status
  );

  const detailItems = [
    {
      label: isArabic ? "الاسم" : "Customer",
      value: order.customer_name || "—",
      icon: UserRound,
      dir: undefined,
    },
    {
      label: isArabic ? "رقم الهاتف" : "Phone number",
      value: order.phone || "—",
      icon: Phone,
      dir: "ltr" as const,
    },
    {
      label: isArabic ? "عنوان التوصيل" : "Delivery address",
      value: order.address || "—",
      icon: MapPin,
      dir: undefined,
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f7f3] px-4 pb-20 pt-7 sm:px-6 sm:pb-24 sm:pt-11 lg:px-8"
    >
      <div className="mx-auto max-w-[1180px]">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#526057] transition hover:text-[#0a583b]"
        >
          {isArabic ? (
            <ArrowRight className="h-4 w-4" />
          ) : (
            <ArrowLeft className="h-4 w-4" />
          )}
          {isArabic ? "العودة إلى طلباتي" : "Back to my orders"}
        </Link>

        <header className="mt-7 flex flex-col gap-6 border-b border-[#dfe4e0] pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0a583b]">
              {isArabic ? "تفاصيل الطلب" : "Order details"}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] text-[#142019] sm:text-5xl">
              {isArabic ? "شكراً لطلبك" : "Thank you for your order"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
              {isArabic
                ? "يمكنك متابعة حالة طلبك ومراجعة معلومات التوصيل من هذه الصفحة."
                : "Track your order and review your delivery information from this page."}
            </p>
          </div>

          <div
            dir="ltr"
            className={`text-left ${isArabic ? "sm:text-right" : ""}`}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7b867e]">
              {isArabic ? "رقم الطلب" : "Order number"}
            </p>
            <p className="mt-1 text-xl font-extrabold text-[#142019]">
              #{order.id}
            </p>
          </div>
        </header>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] lg:items-start">
          <div className="min-w-0 space-y-5">
            <section
              aria-live="polite"
              className="overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white"
            >
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style.icon}`}
                    >
                      <OrderStatusIcon status={order.status} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7b867e]">
                        {isArabic ? "الحالة الحالية" : "Current status"}
                      </p>
                      <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-[#142019]">
                        {status.label}
                      </h2>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-extrabold ${style.badge}`}
                  >
                    <OrderStatusIcon
                      status={order.status}
                      className="h-3.5 w-3.5"
                    />
                    {status.label}
                  </span>
                </div>

                <p className="mt-6 max-w-2xl text-sm leading-7 text-[#526057] sm:text-base">
                  {statusDescription}
                </p>

                {order.status === "pending" && (
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#dce9e1] bg-[#f4f8f5] p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0a583b]" />
                    <p className="text-sm leading-6 text-[#425148]">
                      {isCashOnDelivery
                        ? isArabic
                          ? "تم تأكيد إرسال الطلب. سنحدّث حالته هنا بعد مراجعته."
                          : "Your order was submitted successfully. We’ll update its status here after review."
                        : isArabic
                          ? "تم حفظ إثبات الدفع بأمان مع طلبك. يمكنك مغادرة الصفحة والعودة لاحقاً للمتابعة."
                          : "Your payment proof is securely attached to the order. You can leave this page and return later to follow progress."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {!isTerminal && (
              <section className="rounded-[1.75rem] border border-[#dfe4e0] bg-white p-6 sm:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7b867e]">
                      {isArabic ? "تتبّع مباشر" : "Live progress"}
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold text-[#142019]">
                      {isArabic ? "مراحل الطلب" : "Order journey"}
                    </h2>
                  </div>
                  <Package className="h-5 w-5 text-[#8b958e]" />
                </div>

                {timeline.length > 0 ? (
                  <ol className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {timeline.map((step, index) => {
                      const isCompleted =
                        currentStepIndex !== -1 && index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <li
                          key={step.key}
                          className={`relative rounded-2xl border p-4 ${
                            isCurrent
                              ? "border-[#8fb5a0] bg-[#edf5f0]"
                              : isCompleted
                                ? "border-[#d4e2d9] bg-[#f7faf8]"
                                : "border-[#e7ebe8] bg-white"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${
                              isCompleted
                                ? "bg-[#0a583b] text-white"
                                : "bg-[#edf0ed] text-[#8b958e]"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-4 w-4" strokeWidth={2.6} />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <p
                            className={`mt-4 text-sm font-extrabold leading-5 ${
                              isCompleted ? "text-[#142019]" : "text-[#8b958e]"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="mt-1.5 text-[11px] font-bold text-[#0a583b]">
                              {isArabic ? "المرحلة الحالية" : "Current step"}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-5 text-sm text-[#647168]">
                    {isArabic
                      ? "لا تتوفر تفاصيل مراحل الطلب حالياً."
                      : "Order progress is currently unavailable."}
                  </p>
                )}

                {["pending", "accepted", "out_for_delivery"].includes(
                  order.status
                ) && (
                  <div className="mt-6 flex items-start gap-3 border-t border-[#edf0ed] pt-5">
                    <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#0a583b]" />
                    <div>
                      <p className="text-sm font-extrabold text-[#142019]">
                        {isArabic
                          ? "موعد التوصيل المتوقع"
                          : "Expected delivery"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#647168]">
                        {isArabic
                          ? "عادةً خلال 1–3 أيام عمل بعد تأكيد الطلب أو الدفع."
                          : "Usually within 1–3 business days after order or payment confirmation."}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {isTerminal && (
              <section
                className={`rounded-[1.75rem] border p-6 sm:p-8 ${
                  isRejected
                    ? "border-[#e8c7c2] bg-[#fff7f5]"
                    : "border-[#d8dcda] bg-white"
                }`}
              >
                <h2
                  className={`text-lg font-extrabold ${
                    isRejected ? "text-[#9a4036]" : "text-[#142019]"
                  }`}
                >
                  {isRejected
                    ? isArabic
                      ? "لم يكتمل هذا الطلب"
                      : "This order wasn’t completed"
                    : isArabic
                      ? "تم إلغاء الطلب"
                      : "Order cancelled"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#647168]">
                  {isRejected
                    ? isArabic
                      ? "يمكنك التواصل مع خدمة العملاء لمعرفة المزيد أو إنشاء طلب جديد."
                      : "Contact customer care for more information, or place a new order."
                    : isArabic
                      ? "سيتم إرجاع المبلغ المدفوع خلال 24 ساعة بعد الإلغاء."
                      : "Any paid amount will be refunded within 24 hours of cancellation."}
                </p>
              </section>
            )}
          </div>

          <aside className="min-w-0 rounded-[1.75rem] border border-[#dfe4e0] bg-white p-5 sm:p-6 lg:sticky lg:top-6">
            <div className="flex items-center gap-3 border-b border-[#edf0ed] pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <ReceiptText className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7b867e]">
                  {isArabic ? "ملخص الطلب" : "Order summary"}
                </p>
                <p
                  dir="ltr"
                  className={`mt-0.5 text-sm font-extrabold text-[#142019] ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  #{order.id}
                </p>
              </div>
            </div>

            <div className="border-b border-[#edf0ed] py-5">
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-bold text-[#647168]">
                  {isArabic ? "المبلغ الإجمالي" : "Total amount"}
                </span>
                <span
                  dir="ltr"
                  className="text-xl font-extrabold text-[#0a583b]"
                >
                  {Number(order.total_price || 0).toLocaleString()} SYP
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#edf0ed]">
              {detailItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="flex gap-3 py-4">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0a583b]" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#7b867e]">
                        {item.label}
                      </p>
                      <p
                        dir={item.dir}
                        className={`mt-1 break-words text-sm font-bold leading-6 text-[#142019] ${
                          item.dir === "ltr" && isArabic ? "text-right" : ""
                        }`}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {order.status === "pending" && (
              <CancelOrderClient orderId={order.id} />
            )}

            <div className="mt-5 grid gap-2.5">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-5 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
              >
                <ShoppingBag className="h-4 w-4" />
                {isArabic ? "متابعة التسوق" : "Continue shopping"}
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#cbd3cd] px-5 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
              >
                <Home className="h-4 w-4" />
                {isArabic ? "الصفحة الرئيسية" : "Home page"}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
