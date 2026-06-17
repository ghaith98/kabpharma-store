"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl bg-white p-10 shadow-sm ring-1 ring-gray-100">
          <h1 className="mb-8 text-4xl font-extrabold text-gray-900">
            {lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>

          <div
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="space-y-6 leading-8 text-gray-700"
          >
            <p>
              {lang === "ar"
                ? "تحترم KAB Pharma خصوصيتك وتلتزم بحماية معلوماتك الشخصية."
                : "KAB Pharma respects your privacy and is committed to protecting your personal information."}
            </p>

            <p>
              {lang === "ar"
                ? "نقوم بجمع المعلومات الضرورية لمعالجة الطلبات وتوصيلها، بما في ذلك الاسم ورقم الهاتف والعنوان وتفاصيل الطلب."
                : "We collect information necessary to process and deliver your orders, including your name, phone number, delivery address, and order details."}
            </p>

            <p>
              {lang === "ar"
                ? "تُستخدم معلوماتك فقط لمعالجة الطلبات والتوصيل وخدمة العملاء وتحسين خدماتنا."
                : "Your information is used solely for order processing, delivery, customer support, and improving our services."}
            </p>

            <p>
              {lang === "ar"
                ? "لا نقوم ببيع أو تأجير أو مشاركة معلوماتك الشخصية مع أي طرف ثالث إلا عند الحاجة لإتمام الطلب أو خدمة التوصيل."
                : "We do not sell, rent, or share your personal information with third parties except when required to complete your order or provide delivery services."}
            </p>

            <p>
              {lang === "ar"
                ? "يتم حفظ صور إثبات الدفع ومعلومات الطلب بشكل آمن وتُستخدم فقط للتحقق من الدفع وإدارة الطلبات."
                : "Payment proof images and order information are stored securely and used only for payment verification and order management purposes."}
            </p>

            <p>
              {lang === "ar"
                ? "نتخذ إجراءات معقولة لحماية معلومات العملاء من الوصول غير المصرح به أو سوء الاستخدام أو الإفصاح عنها."
                : "We take reasonable measures to protect customer information from unauthorized access, misuse, or disclosure."}
            </p>

            <p>
              {lang === "ar"
                ? "باستخدام هذا الموقع وإجراء طلب شراء فإنك توافق على سياسة الخصوصية هذه."
                : "By using this website and placing an order, you agree to this Privacy Policy."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}