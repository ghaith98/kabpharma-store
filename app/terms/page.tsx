"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const { lang } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-gray-100">
          <h1 className="mb-8 text-4xl font-extrabold text-gray-900">
            {lang === "ar"
              ? "الشروط والأحكام"
              : "Terms & Conditions"}
          </h1>

          <div
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="space-y-6 leading-8 text-gray-700"
          >
            <p>
              {lang === "ar"
                ? "عند تقديم طلب عبر KAB Pharma فإنك توافق على هذه الشروط والأحكام."
                : "By placing an order through KAB Pharma, you agree to these Terms & Conditions."}
            </p>

            <p>
              {lang === "ar"
                ? "قد يتم تحديث أو تعديل معلومات المنتجات والأسعار والتوفر والمواصفات دون إشعار مسبق."
                : "Product information, prices, availability, and specifications may be updated or modified without prior notice."}
            </p>

            <p>
              {lang === "ar"
                ? "جميع الطلبات تخضع للتأكيد وتوفر المنتجات."
                : "All orders are subject to confirmation and product availability."}
            </p>

            <p>
              {lang === "ar"
                ? "يتحمل العميل مسؤولية إدخال معلومات التوصيل ووسائل التواصل بشكل صحيح."
                : "Customers are responsible for providing accurate delivery and contact information when placing orders."}
            </p>

            <p>
              {lang === "ar"
                ? "تحتفظ KAB Pharma بحق رفض أو تعديل أو إلغاء الطلبات عند الحاجة بسبب توفر المنتجات أو أخطاء التسعير أو أي أسباب تشغيلية أخرى."
                : "KAB Pharma reserves the right to refuse, cancel, or modify orders when necessary due to product availability, pricing errors, or other operational reasons."}
            </p>

            <p>
              {lang === "ar"
                ? "قد تختلف أوقات التوصيل حسب المنطقة وظروف العمل وجداول شركات التوصيل."
                : "Delivery times may vary depending on location, courier schedules, and operational conditions."}
            </p>

            <p>
              {lang === "ar"
                ? "يتحمل العميل مسؤولية مراجعة تفاصيل الطلب قبل إتمام عملية الدفع."
                : "Customers are responsible for reviewing their order details before submitting payment."}
            </p>

            <p>
              {lang === "ar"
                ? "باستخدام هذا الموقع فإنك توافق على الالتزام بهذه الشروط والأحكام."
                : "By using this website, you agree to comply with these Terms & Conditions."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}