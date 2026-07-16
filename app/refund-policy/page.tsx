"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  CircleAlert,
  Headphones,
  MessageCircle,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

export default function RefundPolicyPage() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const t = {
    en: {
      eyebrow: "Returns & refunds",
      title: "A clear and considered return policy.",
      introduction:
        "We want every KAB Pharma order to arrive exactly as expected. Here you’ll find the conditions, timing, and support available for returns, replacements, and refunds.",
      overview: "Policy overview",
      returnWindow: "Return window",
      returnWindowValue: "Within 3 days",
      issueWindow: "Order issues",
      issueWindowValue: "Report within 48 hours",
      eligibility: "Product condition",
      eligibilityValue: "Unopened and unused",
      returnTitle: "Return conditions",
      returnText:
        "A return may be requested within 3 days of delivery, provided that the product is unopened, unused, in its original packaging, and in the same condition in which it was received.",
      hygieneText:
        "For health and hygiene reasons, opened, used, or unsealed personal care products cannot be returned unless they are damaged, defective, or incorrectly supplied.",
      changeMindText:
        "Returns are not accepted solely because the customer changed their mind after receiving the order.",
      proofText:
        "A valid order number or proof of purchase may be required to process the request.",
      issueTitle: "Missing, damaged, or incorrect items",
      issueText:
        "If an item is missing, damaged, defective, or different from the product ordered, please contact us within 48 hours of delivery.",
      replacementText:
        "After reviewing the request, KAB Pharma will arrange for the missing or replacement product to be sent at no additional delivery cost to the customer.",
      shippingTitle: "Shipping and delivery costs",
      deliveryText:
        "Delivery fees are calculated according to the customer’s location and are communicated during the ordering process.",
      customerShippingText:
        "If an eligible, non-defective product is approved for return, the customer is responsible for the return shipping costs.",
      companyShippingText:
        "If the product is damaged, defective, missing, or incorrectly supplied, KAB Pharma will cover the applicable return or replacement shipping costs.",
      originalFeesText:
        "Original delivery fees are non-refundable unless the return results from an error by KAB Pharma or a defective product.",
      refundTitle: "Refund processing",
      refundText:
        "Refunds are processed after the returned product has been received, inspected, and confirmed to meet the return conditions.",
      refundMethodText:
        "The refund method and expected processing time will be communicated to the customer after the request has been approved.",
      importantTitle: "Please note",
      importantText:
        "Submitting a request does not automatically guarantee approval. Every request is reviewed according to the conditions stated on this page.",
      helpEyebrow: "Customer care",
      helpTitle: "Need help with an order?",
      helpText:
        "Contact our customer care team and include your name, order number, and a clear description of the issue.",
      whatsappButton: "Contact us on WhatsApp",
      contactButton: "Other contact methods",
      whatsappMessage:
        "Hello KAB Pharma team 👋\nI would like to submit a return or refund request.\n\nOrder number:\nIssue:",
    },
    ar: {
      eyebrow: "الاسترجاع واسترداد المبلغ",
      title: "سياسة استرجاع واضحة ومدروسة.",
      introduction:
        "نحرص على أن يصلك كل طلب من KAB Pharma كما تتوقع. ستجد هنا شروط ومواعيد الاسترجاع والاستبدال واسترداد المبلغ، وكيفية الحصول على المساعدة.",
      overview: "ملخص السياسة",
      returnWindow: "مهلة الاسترجاع",
      returnWindowValue: "خلال 3 أيام",
      issueWindow: "مشكلات الطلب",
      issueWindowValue: "الإبلاغ خلال 48 ساعة",
      eligibility: "حالة المنتج",
      eligibilityValue: "غير مفتوح وغير مستخدم",
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
      helpEyebrow: "خدمة العملاء",
      helpTitle: "هل تحتاج إلى مساعدة بخصوص طلبك؟",
      helpText:
        "تواصل مع فريق خدمة العملاء وأرسل اسمك ورقم الطلب مع وصف واضح للمشكلة.",
      whatsappButton: "تواصل معنا عبر واتساب",
      contactButton: "طرق التواصل الأخرى",
      whatsappMessage:
        "مرحباً فريق KAB Pharma 👋\nأرغب بتقديم طلب استرجاع أو استرداد مبلغ.\n\nرقم الطلب:\nتفاصيل المشكلة:",
    },
  }[lang as "en" | "ar"];

  const whatsappUrl = useMemo(
    () =>
      `https://wa.me/963958088969?text=${encodeURIComponent(
        t.whatsappMessage
      )}`,
    [t.whatsappMessage]
  );

  const overviewItems = [
    {
      label: t.returnWindow,
      value: t.returnWindowValue,
      Icon: RotateCcw,
    },
    {
      label: t.issueWindow,
      value: t.issueWindowValue,
      Icon: CircleAlert,
    },
    {
      label: t.eligibility,
      value: t.eligibilityValue,
      Icon: ShieldCheck,
    },
  ];

  const sections = [
    {
      number: "01",
      title: t.returnTitle,
      Icon: Box,
      paragraphs: [
        t.returnText,
        t.hygieneText,
        t.changeMindText,
        t.proofText,
      ],
    },
    {
      number: "02",
      title: t.issueTitle,
      Icon: CircleAlert,
      paragraphs: [t.issueText, t.replacementText],
    },
    {
      number: "03",
      title: t.shippingTitle,
      Icon: Truck,
      paragraphs: [
        t.deliveryText,
        t.customerShippingText,
        t.companyShippingText,
        t.originalFeesText,
      ],
    },
    {
      number: "04",
      title: t.refundTitle,
      Icon: ReceiptText,
      paragraphs: [t.refundText, t.refundMethodText],
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f8f6] pb-24 text-[#142019] md:pb-16"
    >
      {/* Editorial hero */}
      <header className="border-b border-[#dfe4e0] bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] lg:items-end lg:gap-20">
          <div>
            <div className="flex items-center gap-3 text-[#0a583b]">
              <RotateCcw size={18} strokeWidth={1.8} />
              <p
                className={`text-[11px] font-extrabold uppercase ${
                  isArabic ? "tracking-normal" : "tracking-[0.2em]"
                }`}
              >
                {t.eyebrow}
              </p>
            </div>

            <h1
              className={`mt-6 max-w-4xl font-extrabold text-[#142019] ${
                isArabic
                  ? "text-[38px] leading-[1.24] tracking-normal [font-family:Tahoma,Arial,sans-serif] sm:text-[52px] lg:text-[66px]"
                  : "text-[44px] leading-[0.98] tracking-[-0.055em] sm:text-[62px] lg:text-[78px]"
              }`}
            >
              {t.title}
            </h1>
          </div>

          <div className="lg:pb-1">
            <p className="text-[15px] leading-8 text-[#526057] sm:text-base">
              {t.introduction}
            </p>

            <div className="mt-7 flex items-center gap-3 border-t border-[#dfe4e0] pt-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <ShieldCheck size={17} />
              </span>
              <p className="text-xs font-bold leading-6 text-[#647168]">
                KAB Pharma · {t.eyebrow}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-10">
        {/* Quick overview */}
        <section className="border-b border-[#dfe4e0] py-10 sm:py-12">
          <p
            className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic ? "tracking-normal" : "tracking-[0.16em]"
            }`}
          >
            {t.overview}
          </p>

          <div className="mt-7 grid gap-px overflow-hidden rounded-[1.5rem] border border-[#dfe4e0] bg-[#dfe4e0] sm:grid-cols-3">
            {overviewItems.map(({ label, value, Icon }) => (
              <article key={label} className="bg-white p-5 sm:p-6">
                <Icon size={19} className="text-[#0a583b]" />
                <p className="mt-5 text-xs font-bold text-[#7a857e]">
                  {label}
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#142019] sm:text-base">
                  {value}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Policy sections */}
        <div className="divide-y divide-[#dfe4e0]">
          {sections.map(({ number, title, Icon, paragraphs }) => (
            <section
              key={number}
              className="grid gap-7 py-11 sm:py-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16"
            >
              <div>
                <p className="text-xs font-extrabold text-[#9aa39d]">
                  {number}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                    <Icon size={18} strokeWidth={1.8} />
                  </span>
                  <h2 className="text-lg font-extrabold leading-7 text-[#142019]">
                    {title}
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-[#e7ebe8] border-t border-[#e7ebe8] lg:border-t-0">
                {paragraphs.map((paragraph, index) => (
                  <div
                    key={`${number}-${index}`}
                    className="flex items-start gap-4 py-5 first:pt-6 lg:first:pt-0"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a583b]" />
                    <p className="text-[15px] leading-8 text-[#526057]">
                      {paragraph}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Important notice */}
        <section className="border-y border-[#d8cba7] bg-[#f5f0e3] px-5 py-7 sm:px-7 sm:py-8">
          <div className="flex items-start gap-4">
            <CircleAlert
              size={21}
              className="mt-1 shrink-0 text-[#866c2f]"
            />
            <div>
              <h2 className="font-extrabold text-[#342d1d]">
                {t.importantTitle}
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-[#655a40]">
                {t.importantText}
              </p>
            </div>
          </div>
        </section>

        {/* Customer-care CTA */}
        <section className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16 lg:py-20">
          <div>
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic ? "tracking-normal" : "tracking-[0.16em]"
              }`}
            >
              {t.helpEyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#142019] sm:text-4xl">
              {t.helpTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-[#647168] sm:text-base">
              {t.helpText}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-lg"
            >
              <MessageCircle size={17} />
              <span>{t.whatsappButton}</span>
            </a>

            <Link
              href="/contact"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#bfc9c2] bg-white px-6 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
            >
              <Headphones size={17} />
              <span>{t.contactButton}</span>
              <ArrowIcon
                size={15}
                className={`transition-transform ${
                  isArabic
                    ? "group-hover:-translate-x-1"
                    : "group-hover:translate-x-1"
                }`}
              />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
