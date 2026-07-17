"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Headphones,
  Package,
  RefreshCcw,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RefundPolicyPage() {
  const { lang } = useLanguage();

  const isArabic = lang === "ar";
  const ContinueArrow = isArabic ? ArrowLeft : ArrowRight;

  const content = {
    en: {
      eyebrow: "Returns & refunds",
      title: "Refund Policy",
      introduction:
        "Please review the return and refund conditions before submitting a request.",

      sections: [
        {
          icon: Package,
          title: "Return conditions",
          points: [
            "A return may be requested within 3 days of delivery.",
            "The product must be unopened, unused, and kept in its original packaging and condition.",
            "For hygiene reasons, opened or unsealed personal care products cannot be returned unless they are damaged, defective, or incorrectly supplied.",
            "A valid order number or proof of purchase may be required.",
          ],
        },
        {
          icon: AlertTriangle,
          title: "Missing, damaged, or incorrect items",
          points: [
            "Please contact us within 48 hours if an item is missing, damaged, defective, or different from the product ordered.",
            "After reviewing the request, KAB Pharma may arrange a replacement without additional delivery charges.",
          ],
        },
        {
          icon: Truck,
          title: "Delivery and return costs",
          points: [
            "Delivery fees are calculated according to the customer’s location and are displayed during checkout.",
            "For an approved return of a non-defective product, the customer is responsible for the return delivery cost.",
            "KAB Pharma covers return or replacement delivery costs when the product is damaged, defective, missing, or incorrectly supplied.",
            "Original delivery fees are non-refundable unless the return resulted from an error by KAB Pharma.",
          ],
        },
        {
          icon: WalletCards,
          title: "Refund processing",
          points: [
            "Refunds are processed after the returned product has been received and inspected.",
            "The refund method and expected processing time will be communicated after the request is approved.",
          ],
        },
      ],

      importantTitle: "Important information",
      importantText:
        "Submitting a return or refund request does not guarantee approval. Every request is reviewed according to the conditions described on this page.",

      helpTitle: "Need help with an order?",
      helpText:
        "Contact our customer service team and include your name, order number, and a description of the issue.",

      contactButton: "Contact customer service",
      ordersButton: "View my orders",
    },

    ar: {
      eyebrow: "الاسترجاع واسترداد المبلغ",
      title: "سياسة الاسترجاع",
      introduction:
        "يرجى مراجعة شروط الاسترجاع واسترداد المبلغ قبل تقديم أي طلب.",

      sections: [
        {
          icon: Package,
          title: "شروط الاسترجاع",
          points: [
            "يمكن طلب استرجاع المنتج خلال 3 أيام من تاريخ الاستلام.",
            "يجب أن يكون المنتج غير مفتوح وغير مستخدم وضمن عبوته الأصلية وبالحالة نفسها التي تم استلامه بها.",
            "لأسباب صحية، لا يمكن استرجاع منتجات العناية الشخصية المفتوحة أو المستخدمة إلا إذا كانت تالفة أو معيبة أو تم إرسالها بالخطأ.",
            "قد يُطلب رقم الطلب أو ما يثبت عملية الشراء.",
          ],
        },
        {
          icon: AlertTriangle,
          title: "المنتجات الناقصة أو التالفة أو الخاطئة",
          points: [
            "يرجى التواصل معنا خلال 48 ساعة إذا كان المنتج ناقصاً أو تالفاً أو معيباً أو مختلفاً عن المنتج المطلوب.",
            "بعد مراجعة الطلب، يمكن لـ KAB Pharma إرسال منتج بديل دون تحميل العميل أجور توصيل إضافية.",
          ],
        },
        {
          icon: Truck,
          title: "تكاليف التوصيل والاسترجاع",
          points: [
            "يتم احتساب رسوم التوصيل حسب موقع العميل وتظهر أثناء إتمام الطلب.",
            "عند الموافقة على استرجاع منتج غير تالف، يتحمل العميل تكاليف إعادة المنتج.",
            "تتحمل KAB Pharma تكاليف الاسترجاع أو الاستبدال إذا كان المنتج تالفاً أو معيباً أو ناقصاً أو تم إرساله بالخطأ.",
            "رسوم التوصيل الأصلية غير قابلة للاسترداد إلا إذا كان الاسترجاع ناتجاً عن خطأ من KAB Pharma.",
          ],
        },
        {
          icon: WalletCards,
          title: "معالجة استرداد المبلغ",
          points: [
            "تتم معالجة استرداد المبلغ بعد استلام المنتج المرتجع وفحصه.",
            "سيتم إبلاغ العميل بطريقة استرداد المبلغ والمدة المتوقعة بعد قبول الطلب.",
          ],
        },
      ],

      importantTitle: "معلومات مهمة",
      importantText:
        "تقديم طلب استرجاع أو استرداد مبلغ لا يعني قبوله تلقائياً. تتم مراجعة كل حالة وفقاً للشروط الموضحة في هذه الصفحة.",

      helpTitle: "هل تحتاج إلى مساعدة بخصوص طلبك؟",
      helpText:
        "تواصل مع فريق خدمة العملاء وأرسل اسمك ورقم الطلب مع وصف واضح للمشكلة.",

      contactButton: "التواصل مع خدمة العملاء",
      ordersButton: "عرض طلباتي",
    },
  }[isArabic ? "ar" : "en"];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f8f6] px-4 py-8 pb-28 sm:px-6 sm:py-12 md:pb-16"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="border-b border-[#dfe4e0] pb-8 sm:pb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
            <RefreshCcw size={21} />
          </div>

          <p
            className={`mt-6 text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic ? "tracking-normal" : "tracking-[0.16em]"
            }`}
          >
            {content.eyebrow}
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#142019] sm:text-5xl">
            {content.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#647168] sm:text-base">
            {content.introduction}
          </p>
        </header>

        {/* Policy sections */}
        <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">
          {content.sections.map((section, sectionIndex) => {
            const Icon = section.icon;

            return (
              <article
                key={section.title}
                className={`grid gap-5 p-6 sm:grid-cols-[52px_minmax(0,1fr)] sm:p-8 ${
                  sectionIndex !== content.sections.length - 1
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

                  <div className="mt-5 space-y-4">
                    {section.points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                          <Check size={12} strokeWidth={3} />
                        </div>

                        <p className="text-sm leading-7 text-[#647168] sm:text-base sm:leading-8">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Important note */}
        <section className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle
              size={21}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div>
              <h2 className="font-extrabold text-[#142019]">
                {content.importantTitle}
              </h2>

              <p className="mt-2 text-sm leading-7 text-[#526057]">
                {content.importantText}
              </p>
            </div>
          </div>
        </section>

        {/* Help section */}
        <section className="mt-8 rounded-[1.75rem] border border-[#dfe4e0] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <Headphones size={20} />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-[#142019] sm:text-xl">
                  {content.helpTitle}
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-7 text-[#647168]">
                  {content.helpText}
                </p>
              </div>
            </div>

            <ShieldCheck
              size={30}
              className="hidden shrink-0 text-[#c5d7cc] sm:block"
            />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="group flex min-h-[50px] items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#073f2c]"
            >
              <span>{content.contactButton}</span>

              <ContinueArrow
                size={15}
                className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              />
            </Link>

            <Link
              href="/orders"
              className="flex min-h-[50px] items-center justify-center rounded-full border border-[#cbd3cd] bg-white px-6 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
            >
              {content.ordersButton}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}