"use client";

import CancelOrderClient from "../CancelOrderClient";
import { useLanguage } from "../../../context/LanguageContext";

export default function OrderDetailsLanguageClient({
  order,
  statusMap,
  timelineSteps,
}: {
  order: any;
  statusMap?: any;
  timelineSteps?: any;
}) {
  const { lang } = useLanguage();

  if (!order) {
    return (
      <main
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12"
      >
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-red-600">
            {lang === "ar" ? "لم يتم العثور على الطلب" : "Order not found"}
          </h1>

          <p className="mt-3 text-gray-600">
            {lang === "ar"
              ? "يرجى التأكد من رابط الطلب والمحاولة مرة أخرى."
              : "Please check the order link and try again."}
          </p>

          <a
            href="/products"
            className="mt-6 inline-block rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
          >
            {lang === "ar" ? "العودة للمنتجات" : "Back to Products"}
          </a>
        </div>
      </main>
    );
  }

  const currentStatusMap = statusMap[lang];
  const currentTimelineSteps = timelineSteps[lang];

  const status = currentStatusMap[order.status] || {
    label: order.status,
    description:
      lang === "ar"
        ? "حالة الطلب الحالية غير معروفة."
        : "The current order status is unknown.",
    badgeClass: "bg-gray-100 text-gray-700",
  };

  const currentStepIndex = currentTimelineSteps.findIndex(
    (step: any) => step.key === order.status
  );

  const isRejected = order.status === "rejected";

  return (
    <main
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12"
    >
      <div className="mx-auto max-w-2xl">
        <section className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            {lang === "ar" ? "تتبع الطلب" : "Track Order"}
          </h1>

          <p className="mt-3 text-gray-600">
            {lang === "ar"
              ? "يمكنك متابعة حالة طلبك ومراجعة تفاصيله من هنا."
              : "You can track your order status and review its details here."}
          </p>
        </section>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">
                {lang === "ar" ? "رقم الطلب" : "Order Number"}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
                #{order.id}
              </h2>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-bold ${status.badgeClass}`}
            >
              {status.label}
            </span>
          </div>

          <div className="mb-8 rounded-3xl bg-gray-50 p-5">
            <p className="text-sm font-bold text-green-700">
              {lang === "ar" ? "حالة الطلب" : "Order Status"}
            </p>

            <h3 className="mt-2 text-xl font-extrabold text-gray-900">
              {status.label}
            </h3>

            <p className="mt-2 text-gray-600">{status.description}</p>
          </div>

          {["pending", "accepted", "out_for_delivery"].includes(
            order.status
          ) && (
            <div className="mb-8 rounded-3xl border border-green-100 bg-green-50 p-5">
              <h3 className="font-extrabold text-green-800">
                {lang === "ar"
                  ? "مدة التوصيل المتوقعة"
                  : "Estimated delivery time"}
              </h3>

              <p className="mt-2 text-sm leading-7 text-green-700">
                {lang === "ar"
                  ? "عادةً يتم تجهيز وتوصيل الطلب خلال 1–3 أيام عمل بعد تأكيد الدفع."
                  : "Orders are usually prepared and delivered within 1–3 business days after payment confirmation."}
              </p>
            </div>
          )}

          {!isRejected ? (
            <div className="mb-8">
              <h3 className="mb-5 text-lg font-extrabold text-gray-900">
                {lang === "ar" ? "مراحل الطلب" : "Order Timeline"}
              </h3>

              <div className="space-y-5">
                {currentTimelineSteps.map((step: any, index: number) => {
                  const isCompleted =
                    currentStepIndex !== -1 && index <= currentStepIndex;

                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${
                            isCompleted
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isCompleted ? "✓" : index + 1}
                        </div>

                        {index !== currentTimelineSteps.length - 1 && (
                          <div
                            className={`mt-2 h-8 w-1 rounded-full ${
                              index < currentStepIndex
                                ? "bg-green-600"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>

                      <div className="pb-2">
                        <p
                          className={`font-bold ${
                            isCompleted ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>

                        {isCurrent && (
                          <p className="mt-1 text-sm font-semibold text-green-700">
                            {lang === "ar" ? "المرحلة الحالية" : "Current step"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-3xl bg-red-50 p-5">
              <h3 className="font-extrabold text-red-700">
                {lang === "ar" ? "تم رفض الطلب" : "Order rejected"}
              </h3>
              <p className="mt-2 text-sm text-red-700">
                {lang === "ar"
                  ? "لم يكتمل هذا الطلب. يمكنك التواصل معنا لمعرفة السبب أو إعادة الطلب من جديد."
                  : "This order was not completed. You can contact us to know the reason or place a new order."}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
              <span className="font-semibold text-gray-600">
                {lang === "ar" ? "المبلغ الإجمالي" : "Total Amount"}
              </span>

              <span className="font-extrabold text-green-700">
                {Number(order.total_price).toLocaleString()} SYP
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-500">
                {lang === "ar" ? "الاسم" : "Name"}
              </p>
              <p className="mt-1 font-bold text-gray-900">
                {order.customer_name}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-500">
                {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
              </p>
              <p className="mt-1 font-bold text-gray-900">{order.phone}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-500">
                {lang === "ar" ? "العنوان" : "Address"}
              </p>
              <p className="mt-1 font-bold leading-7 text-gray-900">
                {order.address}
              </p>
            </div>
          </div>

          {order.status === "pending" && (
            <CancelOrderClient orderId={order.id} />
          )}

          {order.status === "cancelled_by_customer" && (
            <div className="mt-5 rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <h3 className="font-extrabold text-gray-900">
                {lang === "ar" ? "استرداد المبلغ" : "Refund"}
              </h3>

              <p className="mt-2 text-sm leading-7 text-gray-700">
                {lang === "ar"
                  ? "سيتم إرجاع المبلغ المدفوع خلال 24 ساعة بعد إلغاء الطلب."
                  : "The paid amount will be refunded within 24 hours after cancellation."}
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href="/products"
              className="rounded-2xl bg-green-600 px-5 py-3 text-center font-bold text-white transition hover:bg-green-700"
            >
              {lang === "ar" ? "العودة للمنتجات" : "Back to Products"}
            </a>

            <a
              href="/"
              className="rounded-2xl border border-gray-300 px-5 py-3 text-center font-bold text-gray-700 transition hover:bg-gray-50"
            >
              {lang === "ar" ? "الصفحة الرئيسية" : "Home Page"}
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}