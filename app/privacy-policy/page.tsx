"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Eye,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();

  const isArabic = lang === "ar";
  const ContinueArrow = isArabic ? ArrowLeft : ArrowRight;

  const sections = [
    {
      icon: Database,
      title: isArabic ? "المعلومات التي نجمعها" : "Information we collect",
      text: isArabic
        ? "نجمع المعلومات الضرورية لإنشاء الحساب ومعالجة الطلب وتوصيله، مثل الاسم ورقم الهاتف والعنوان وتفاصيل المنتجات المطلوبة."
        : "We collect the information needed to create your account, process your order, and complete delivery, including your name, phone number, address, and order details.",
    },
    {
      icon: Eye,
      title: isArabic ? "كيفية استخدام المعلومات" : "How we use your information",
      text: isArabic
        ? "تُستخدم معلوماتك لإدارة الحسابات والطلبات والدفع والتوصيل وخدمة العملاء وتحسين تجربة استخدام الموقع."
        : "Your information is used to manage accounts, orders, payments, delivery, customer support, and to improve your experience on the website.",
    },
    {
      icon: Truck,
      title: isArabic ? "خدمات التوصيل" : "Delivery services",
      text: isArabic
        ? "قد تتم مشاركة المعلومات الضرورية لإتمام التوصيل، مثل الاسم ورقم الهاتف والعنوان، مع الجهة المسؤولة عن تسليم الطلب فقط."
        : "Information required to complete delivery, such as your name, phone number, and address, may be shared only with the party responsible for delivering your order.",
    },
    {
      icon: FileCheck2,
      title: isArabic ? "إثبات الدفع والطلبات" : "Payment proof and orders",
      text: isArabic
        ? "تُستخدم صور إثبات الدفع ومعلومات الطلب للتحقق من عملية الدفع وإدارة الطلب ومتابعة حالته."
        : "Payment proof images and order information are used to verify payment, manage your order, and track its status.",
    },
    {
      icon: LockKeyhole,
      title: isArabic ? "حماية البيانات" : "Data protection",
      text: isArabic
        ? "نتخذ إجراءات معقولة لحماية معلومات العملاء من الوصول أو الاستخدام أو الإفصاح غير المصرح به."
        : "We take reasonable measures to protect customer information from unauthorized access, use, or disclosure.",
    },
    {
      icon: UserRound,
      title: isArabic ? "حقوق المستخدم" : "Your choices",
      text: isArabic
        ? "يمكنك التواصل معنا لطلب تصحيح معلومات حسابك أو الاستفسار عن البيانات المرتبطة بطلباتك."
        : "You may contact us to request corrections to your account information or ask about data connected to your orders.",
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
            <ShieldCheck size={22} />
          </div>

          <p
            className={`mt-6 text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic ? "tracking-normal" : "tracking-[0.16em]"
            }`}
          >
            KAB Pharma
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#142019] sm:text-5xl">
            {isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
            {isArabic
              ? "توضح هذه السياسة كيفية جمع معلوماتك واستخدامها وحمايتها عند استخدام متجر KAB Pharma."
              : "This policy explains how your information is collected, used, and protected when you use the KAB Pharma store."}
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

        <section className="mt-6 rounded-[1.75rem] border border-[#cddbd2] bg-[#edf5f0] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <ShieldCheck
              size={21}
              className="mt-0.5 shrink-0 text-[#0a583b]"
            />

            <div>
              <h2 className="font-extrabold text-[#142019]">
                {isArabic ? "الموافقة على السياسة" : "Your agreement"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-[#526057]">
                {isArabic
                  ? "باستخدام الموقع أو إنشاء حساب أو تقديم طلب، فإنك توافق على سياسة الخصوصية الموضحة في هذه الصفحة."
                  : "By using the website, creating an account, or placing an order, you agree to the Privacy Policy described on this page."}
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