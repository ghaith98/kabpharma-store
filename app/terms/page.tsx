"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  FileText,
  MapPin,
  PackageCheck,
  ReceiptText,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const { lang } = useLanguage();

  const isArabic = lang === "ar";

  const sections = [
    {
      icon: ClipboardCheck,
      title: isArabic ? "قبول الشروط" : "Acceptance of terms",
      text: isArabic
        ? "عند استخدام الموقع أو إنشاء حساب أو تقديم طلب عبر KAB Pharma فإنك توافق على الالتزام بهذه الشروط والأحكام."
        : "By using the website, creating an account, or placing an order through KAB Pharma, you agree to these Terms & Conditions.",
    },
    {
      icon: Boxes,
      title: isArabic ? "معلومات المنتجات" : "Product information",
      text: isArabic
        ? "نسعى لعرض معلومات المنتجات والأسعار والأحجام والصور بأكبر قدر ممكن من الدقة، وقد يتم تحديثها عند الحاجة."
        : "We aim to present product information, prices, sizes, and images as accurately as possible, and they may be updated when necessary.",
    },
    {
      icon: ReceiptText,
      title: isArabic ? "الأسعار والدفع" : "Prices and payment",
      text: isArabic
        ? "يجب على العميل مراجعة المنتجات والكميات والأسعار ورسوم التوصيل قبل إرسال الدفع وإتمام الطلب."
        : "Customers must review products, quantities, prices, and delivery fees before submitting payment and completing an order.",
    },
    {
      icon: PackageCheck,
      title: isArabic ? "تأكيد الطلب" : "Order confirmation",
      text: isArabic
        ? "تخضع جميع الطلبات لتأكيد الدفع وتوفر المنتجات، ولا يعتبر الطلب مقبولاً بشكل نهائي حتى يتم تحديث حالته إلى تم قبول الطلب."
        : "All orders are subject to payment confirmation and product availability. An order is not finally accepted until its status is updated to accepted.",
    },
    {
      icon: MapPin,
      title: isArabic ? "معلومات التوصيل" : "Delivery information",
      text: isArabic
        ? "يتحمل العميل مسؤولية إدخال الاسم ورقم الهاتف والعنوان والمنطقة بشكل صحيح لضمان إتمام التوصيل."
        : "Customers are responsible for providing an accurate name, phone number, address, and delivery area.",
    },
    {
      icon: BadgeCheck,
      title: isArabic ? "تعديل أو رفض الطلب" : "Order changes or refusal",
      text: isArabic
        ? "تحتفظ KAB Pharma بحق تعديل أو رفض أو إلغاء الطلب عند وجود مشكلة في توفر المنتج أو السعر أو الدفع أو معلومات التوصيل."
        : "KAB Pharma reserves the right to modify, refuse, or cancel an order due to product availability, pricing, payment, or delivery information issues.",
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f8f6] px-4 py-8 pb-28 sm:px-6 sm:py-12 md:pb-16"
    >
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[#dfe4e0] pb-8 sm:pb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
            <FileText size={22} />
          </div>

          <p
            className={`mt-6 text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic ? "tracking-normal" : "tracking-[0.16em]"
            }`}
          >
            KAB Pharma
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#142019] sm:text-5xl">
            {isArabic ? "الشروط والأحكام" : "Terms & Conditions"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
            {isArabic
              ? "يرجى مراجعة الشروط التالية قبل استخدام الموقع أو تقديم أي طلب."
              : "Please review the following terms before using the website or placing an order."}
          </p>
        </header>

        <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">
          {sections.map((section, index) => {
            const Icon = section.icon;

            return (
              <article
                key={section.title}
                className={`grid gap-4 p-6 sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-5 sm:p-8 ${
                  index !== sections.length - 1
                    ? "border-b border-[#e7ebe8]"
                    : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#0a583b]">
                  <Icon size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-[#142019] sm:text-xl">
                    {section.title}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[#647168] sm:text-base sm:leading-8">
                    {section.text}
                  </p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle
              size={21}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <h2 className="font-extrabold text-[#142019]">
                {isArabic ? "ملاحظة مهمة" : "Important note"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-[#526057]">
                {isArabic
                  ? "قد تختلف أوقات التوصيل حسب المنطقة وظروف العمل وتوفر خدمة التوصيل. سيتم عرض حالة الطلب داخل حساب العميل."
                  : "Delivery times may vary depending on location, operational conditions, and courier availability. Order status will be available in the customer account."}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        </div>
      </div>
    </main>
  );
}
