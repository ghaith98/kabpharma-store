"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHeadset,
  FaMoneyBillWave,
  FaShippingFast,
  FaUndoAlt,
  FaWhatsapp,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

export default function RefundPolicyPage() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const t = {
    en: {
      badge: "Returns & Refunds",
      title: "Refund Policy",
      introduction:
        "Please review the following conditions before submitting a return or refund request.",

      returnTitle: "Return Conditions",
      returnText:
        "A return may be requested within 3 days of delivery, provided that the product is unopened, unused, in its original packaging, and in the same condition in which it was received.",
      hygieneText:
        "For health and hygiene reasons, opened, used, or unsealed personal care products cannot be returned unless they are damaged, defective, or incorrectly supplied.",
      changeMindText:
        "Returns are not accepted solely because the customer changed their mind after receiving the order.",
      proofText:
        "A valid order number or proof of purchase may be required to process the request.",

      issueTitle: "Missing, Damaged, or Incorrect Items",
      issueText:
        "If an item is missing, damaged, defective, or different from the product ordered, please contact us within 48 hours of delivery.",
      replacementText:
        "After reviewing the request, KAB Pharma will arrange for the missing or replacement product to be sent at no additional delivery cost to the customer.",

      shippingTitle: "Shipping and Delivery Costs",
      deliveryText:
        "Delivery fees are calculated according to the customer’s location and are communicated during the ordering process.",
      customerShippingText:
        "If an eligible, non-defective product is approved for return, the customer is responsible for the return shipping costs.",
      companyShippingText:
        "If the product is damaged, defective, missing, or incorrectly supplied, KAB Pharma will cover the applicable return or replacement shipping costs.",
      originalFeesText:
        "Original delivery fees are non-refundable unless the return results from an error by KAB Pharma or a defective product.",

      refundTitle: "Refund Processing",
      refundText:
        "Refunds are processed after the returned product has been received, inspected, and confirmed to meet the return conditions.",
      refundMethodText:
        "The refund method and expected processing time will be communicated to the customer after the request has been approved.",

      importantTitle: "Important",
      importantText:
        "Submitting a request does not automatically guarantee approval. Every request is reviewed according to the conditions stated on this page.",

      helpTitle: "Do you need help with an order?",
      helpText:
        "Contact our customer service team and include your name, order number, and a description of the issue.",
      whatsappButton: "Contact Us on WhatsApp",
      contactButton: "Other Contact Methods",

      whatsappMessage:
        "Hello KAB Pharma team 👋\nI would like to submit a return or refund request.\n\nOrder number:\nIssue:",
    },

    ar: {
      badge: "الاسترجاع واسترداد المبلغ",
      title: "سياسة الاسترجاع",
      introduction:
        "يرجى الاطلاع على الشروط التالية قبل تقديم طلب استرجاع المنتج أو استرداد المبلغ.",

      returnTitle: "شروط الاسترجاع",
      returnText:
        "يمكن طلب استرجاع المنتج خلال 3 أيام من تاريخ الاستلام، بشرط أن يكون غير مفتوح، وغير مستخدم، وضمن عبوته الأصلية، وبالحالة نفسها التي تم استلامه بها.",
      hygieneText:
        "لأسباب تتعلق بالصحة والنظافة، لا يمكن استرجاع منتجات العناية الشخصية التي تم فتحها أو استخدامها أو إزالة ختمها، إلا إذا كانت تالفة، معيبة، أو تم إرسالها بالخطأ.",
      changeMindText:
        "لا يتم قبول طلبات الاسترجاع لمجرد تغيير العميل لرأيه بعد استلام الطلب.",
      proofText:
        "قد يُطلب رقم الطلب أو ما يثبت عملية الشراء لإتمام طلب الاسترجاع.",

      issueTitle: "المنتجات الناقصة أو التالفة أو الخاطئة",
      issueText:
        "إذا كان أحد المنتجات ناقصاً من الطلب، أو وصل تالفاً أو معيباً أو مختلفاً عن المنتج المطلوب، يرجى التواصل معنا خلال 48 ساعة من تاريخ الاستلام.",
      replacementText:
        "بعد مراجعة الطلب، ستقوم KAB Pharma بإرسال المنتج الناقص أو البديل دون تحميل العميل أجور توصيل إضافية.",

      shippingTitle: "تكاليف الشحن والتوصيل",
      deliveryText:
        "يتم احتساب رسوم التوصيل حسب موقع العميل، ويتم توضيحها أثناء إتمام الطلب.",
      customerShippingText:
        "إذا تمت الموافقة على استرجاع منتج غير تالف ومستوفٍ لشروط الاسترجاع، يتحمل العميل تكاليف إعادة المنتج.",
      companyShippingText:
        "إذا كان المنتج تالفاً أو معيباً أو ناقصاً أو تم إرساله بالخطأ، تتحمل KAB Pharma تكاليف الشحن المتعلقة بالاستبدال أو الاسترجاع.",
      originalFeesText:
        "رسوم التوصيل الأصلية غير قابلة للاسترداد، إلا إذا كان الاسترجاع ناتجاً عن خطأ من KAB Pharma أو وجود عيب في المنتج.",

      refundTitle: "معالجة استرداد المبلغ",
      refundText:
        "تتم معالجة استرداد المبلغ بعد استلام المنتج المرتجع وفحصه والتأكد من مطابقته لشروط الاسترجاع.",
      refundMethodText:
        "سيتم إبلاغ العميل بطريقة استرداد المبلغ والمدة المتوقعة بعد قبول الطلب.",

      importantTitle: "ملاحظة مهمة",
      importantText:
        "تقديم طلب الاسترجاع لا يعني قبوله تلقائياً، حيث تتم مراجعة كل طلب وفقاً للشروط الموضحة في هذه الصفحة.",

      helpTitle: "هل تحتاج إلى مساعدة بخصوص طلبك؟",
      helpText:
        "تواصل مع فريق خدمة العملاء وأرسل اسمك ورقم الطلب مع توضيح المشكلة.",
      whatsappButton: "تواصل معنا عبر واتساب",
      contactButton: "طرق التواصل الأخرى",

      whatsappMessage:
        "مرحباً فريق KAB Pharma 👋\nأرغب بتقديم طلب استرجاع أو استرداد مبلغ.\n\nرقم الطلب:\nتفاصيل المشكلة:",
    },
  }[lang as "en" | "ar"];

  const whatsappUrl = useMemo(() => {
    return `https://wa.me/963958088969?text=${encodeURIComponent(
      t.whatsappMessage
    )}`;
  }, [t.whatsappMessage]);

  const sectionClass =
    "rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-gray-100 md:p-9";

  const pointClass = "flex items-start gap-3";

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-16"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-600 to-green-800 px-7 py-12 text-center text-white shadow-lg md:px-12">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-white/5" />

          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl ring-1 ring-white/20">
              <FaUndoAlt />
            </div>

            <div className="mx-auto mt-5 w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-green-50">
              {t.badge}
            </div>

            <h1 className="mt-5 text-4xl font-extrabold md:text-5xl">
              {t.title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl leading-8 text-green-50">
              {t.introduction}
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-6">
          {/* Return conditions */}
          <section className={sectionClass}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-700">
                <FaBoxOpen />
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                {t.returnTitle}
              </h2>
            </div>

            <div className="mt-7 space-y-5">
              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">{t.returnText}</p>
              </div>

              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">{t.hygieneText}</p>
              </div>

              <div className={pointClass}>
                <FaExclamationTriangle className="mt-1 shrink-0 text-amber-500" />
                <p className="leading-8 text-gray-600">{t.changeMindText}</p>
              </div>

              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">{t.proofText}</p>
              </div>
            </div>
          </section>

          {/* Missing or damaged products */}
          <section className={sectionClass}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600">
                <FaExclamationTriangle />
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                {t.issueTitle}
              </h2>
            </div>

            <div className="mt-7 space-y-5">
              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">{t.issueText}</p>
              </div>

              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">
                  {t.replacementText}
                </p>
              </div>
            </div>
          </section>

          {/* Shipping */}
          <section className={sectionClass}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600">
                <FaShippingFast />
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                {t.shippingTitle}
              </h2>
            </div>

            <div className="mt-7 space-y-5">
              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">{t.deliveryText}</p>
              </div>

              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">
                  {t.customerShippingText}
                </p>
              </div>

              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">
                  {t.companyShippingText}
                </p>
              </div>

              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">
                  {t.originalFeesText}
                </p>
              </div>
            </div>
          </section>

          {/* Refund processing */}
          <section className={sectionClass}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-700">
                <FaMoneyBillWave />
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900">
                {t.refundTitle}
              </h2>
            </div>

            <div className="mt-7 space-y-5">
              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">{t.refundText}</p>
              </div>

              <div className={pointClass}>
                <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
                <p className="leading-8 text-gray-600">
                  {t.refundMethodText}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Important note */}
        <section className="mt-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-7 md:p-8">
          <div className="flex items-start gap-4">
            <FaExclamationTriangle className="mt-1 shrink-0 text-2xl text-amber-600" />

            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                {t.importantTitle}
              </h2>

              <p className="mt-2 leading-8 text-gray-700">{t.importantText}</p>
            </div>
          </div>
        </section>

        {/* Customer service */}
        <section className="mt-8 rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-700">
            <FaHeadset />
          </div>

          <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
            {t.helpTitle}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl leading-8 text-gray-600">
            {t.helpText}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-green-600 px-6 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-green-700"
            >
              <FaWhatsapp className="text-xl" />
              <span>{t.whatsappButton}</span>
            </a>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-gray-300 px-6 py-3.5 font-bold text-gray-700 transition hover:-translate-y-0.5 hover:border-green-600 hover:text-green-700"
            >
              <FaHeadset />
              <span>{t.contactButton}</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}