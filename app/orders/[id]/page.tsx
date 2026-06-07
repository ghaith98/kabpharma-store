import { supabase } from "@/lib/supabase";
import CancelOrderClient from "../CancelOrderClient";

const statusMap: Record<
  string,
  {
    label: string;
    description: string;
    badgeClass: string;
  }
> = {
  pending: {
    label: "قيد مراجعة الدفع",
    description: "وصلنا طلبك، وسيتم التحقق من الدفع قريباً.",
    badgeClass: "bg-yellow-50 text-yellow-700",
  },
  accepted: {
    label: "تم قبول الطلب",
    description: "تم قبول طلبك وسيتم تجهيزه للتوصيل.",
    badgeClass: "bg-green-50 text-green-700",
  },
  out_for_delivery: {
    label: "قيد التوصيل",
    description: "طلبك خرج للتوصيل وسيصل إليك قريباً.",
    badgeClass: "bg-blue-50 text-blue-700",
  },
  delivered: {
    label: "تم تسليم الطلب",
    description: "تم تسليم طلبك بنجاح. شكراً لاختيارك KAB Pharma.",
    badgeClass: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "تم رفض الطلب",
    description: "لم نتمكن من قبول الطلب. يمكنك التواصل معنا للمزيد من التفاصيل.",
    badgeClass: "bg-red-50 text-red-700",
  },
  cancelled_by_customer: {
  label: "تم إلغاء الطلب",
  description: "تم إلغاء الطلب من قبل الزبون قبل قبوله.",
  badgeClass: "bg-gray-100 text-gray-700",
},
};

const timelineSteps = [
  { key: "pending", label: "مراجعة الدفع" },
  { key: "accepted", label: "قبول الطلب" },
  { key: "out_for_delivery", label: "قيد التوصيل" },
  { key: "delivered", label: "تم التسليم" },
];

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-red-600">
            لم يتم العثور على الطلب
          </h1>

          <p className="mt-3 text-gray-600">
            يرجى التأكد من رابط الطلب والمحاولة مرة أخرى.
          </p>

          <a
            href="/products"
            className="mt-6 inline-block rounded-2xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
          >
            العودة للمنتجات
          </a>
        </div>
      </main>
    );
  }

  const status = statusMap[order.status] || {
    label: order.status,
    description: "حالة الطلب الحالية غير معروفة.",
    badgeClass: "bg-gray-100 text-gray-700",
  };

  const currentStepIndex = timelineSteps.findIndex(
    (step) => step.key === order.status
  );

  const isRejected = order.status === "rejected";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12"
    >
      <div className="mx-auto max-w-2xl">
        <section className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            تتبع الطلب
          </h1>

          <p className="mt-3 text-gray-600">
            يمكنك متابعة حالة طلبك ومراجعة تفاصيله من هنا.
          </p>
        </section>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500">رقم الطلب</p>
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
            <p className="text-sm font-bold text-green-700">حالة الطلب</p>

            <h3 className="mt-2 text-xl font-extrabold text-gray-900">
              {status.label}
            </h3>

            <p className="mt-2 text-gray-600">{status.description}</p>
          </div>

          {!isRejected ? (
            <div className="mb-8">
              <h3 className="mb-5 text-lg font-extrabold text-gray-900">
                مراحل الطلب
              </h3>

              <div className="space-y-5">
                {timelineSteps.map((step, index) => {
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

                        {index !== timelineSteps.length - 1 && (
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
                            المرحلة الحالية
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
              <h3 className="font-extrabold text-red-700">تم رفض الطلب</h3>
              <p className="mt-2 text-sm text-red-700">
                لم يكتمل هذا الطلب. يمكنك التواصل معنا لمعرفة السبب أو إعادة
                الطلب من جديد.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 p-4">
              <span className="font-semibold text-gray-600">
                المبلغ الإجمالي
              </span>

              <span className="font-extrabold text-green-700">
                {Number(order.total_price).toLocaleString()} SYP
              </span>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-500">الاسم</p>
              <p className="mt-1 font-bold text-gray-900">
                {order.customer_name}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-500">رقم الهاتف</p>
              <p className="mt-1 font-bold text-gray-900">{order.phone}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-500">العنوان</p>
              <p className="mt-1 font-bold leading-7 text-gray-900">
                {order.address}
              </p>
            </div>
          </div>
{order.status === "pending" && (
  <CancelOrderClient orderId={order.id} />
)}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href="/products"
              className="rounded-2xl bg-green-600 px-5 py-3 text-center font-bold text-white transition hover:bg-green-700"
            >
              العودة للمنتجات
            </a>

            <a
              href="/"
              className="rounded-2xl border border-gray-300 px-5 py-3 text-center font-bold text-gray-700 transition hover:bg-gray-50"
            >
              الصفحة الرئيسية
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}