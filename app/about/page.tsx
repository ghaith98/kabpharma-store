"use client";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  HeartHandshake,
  FlaskConical,
  MessageCircle,
} from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";

export default function AboutPage() {
  const { lang } =
    useLanguage();

  const isArabic =
    lang === "ar";

  const ArrowIcon =
    isArabic
      ? ArrowLeft
      : ArrowRight;

  const content = {
    ar: {
      eyebrow:
        "عن KAB Pharma",

      title:
        "عناية واضحة. جودة تثق بها كل يوم.",

      heroText:
        "نطوّر منتجات للعناية بالبشرة والشعر والجسم بهدف جعل روتين العناية اليومي أبسط، أوضح، وأكثر ملاءمة لاحتياجاتك.",

      signature:
        "الجودة لحياة أكثر صحة",

      storyLabel:
        "قصتنا",

      storyTitle:
        "بدأنا بفكرة بسيطة: العناية الشخصية لا يجب أن تكون معقّدة.",

      storyParagraph1:
        "تقدّم KAB Pharma مجموعة متنوعة من منتجات العناية بالبشرة والشعر والجسم، مع اهتمام حقيقي بجودة المنتج، سهولة استخدامه، وتجربة العميل.",

      storyParagraph2:
        "نهتم بكل تفصيل؛ من طريقة تقديم معلومات المنتج ومكوناته، إلى تصميم العبوة وتجربة التسوق وخدمة العملاء بعد الشراء.",

      statement:
        "نؤمن أن الثقة لا تُبنى بالكلمات الكبيرة، بل بالوضوح، الجودة، والاهتمام المستمر بكل تفصيل.",

      visionLabel:
        "01 — رؤيتنا",

      visionTitle:
        "علامة عناية قريبة وموثوقة.",

      visionText:
        "أن تكون KAB Pharma علامة موثوقة في مجال العناية الشخصية، وأن نساعد كل عميل على بناء روتين عملي يلائم احتياجاته اليومية.",

      missionLabel:
        "02 — رسالتنا",

      missionTitle:
        "منتجات عملية ومعلومات تساعدك على الاختيار.",

      missionText:
        "تقديم منتجات عناية شخصية موثوقة، ومعلومات واضحة، ودعم مباشر يساعدك على اختيار المنتج المناسب بثقة.",

      valuesLabel:
        "ما نؤمن به",

      valuesTitle:
        "قيم تقود كل ما نقوم به.",

      valuesSubtitle:
        "من تطوير المنتج إلى تجربة التسوق وخدمة العملاء، نعتمد على أربع مبادئ أساسية.",

      qualityTitle:
        "الجودة",

      qualityText:
        "نهتم بجودة منتجاتنا في كل مرحلة، من تطوير المنتج وحتى التغليف.",

      clarityTitle:
        "الوضوح",

      clarityText:
        "نقدّم معلومات واضحة عن المنتج، مكوناته، فوائده، وطريقة استخدامه.",

      customerTitle:
        "العناية بالعميل",

      customerText:
        "نستمع إلى أسئلة عملائنا ونقدّم الدعم قبل الشراء وبعده.",

      improvementTitle:
        "التطوير المستمر",

      improvementText:
        "نراجع باستمرار منتجاتنا وتجربة التسوق لنقدّم تجربة أفضل.",

      whyLabel:
        "لماذا KAB Pharma؟",

      whyTitle:
        "عناية مصممة لتناسب الحياة اليومية.",

      whyText:
        "نريد أن يحصل كل عميل على تجربة بسيطة وواضحة، مدعومة بمنتجات عملية وخدمة عملاء قريبة منه.",

      point1:
        "منتجات للعناية بالبشرة والشعر والجسم",

      point2:
        "معلومات واضحة وسهلة عن كل منتج",

      point3:
        "تجربة تسوق بسيطة ومريحة",

      point4:
        "دعم مباشر من فريق خدمة العملاء",

      promiseLabel:
        "وعدنا لك",

      promiseTitle:
        "سنواصل التحسن، من أجلك.",

      promiseText:
        "سنواصل العمل على تطوير منتجات العناية، تحسين تجربة الشراء، وتقديم خدمة عملاء جاهزة لمساعدتك في كل خطوة.",

      ctaTitle:
        "اكتشف عناية تناسب روتينك.",

      ctaText:
        "تصفّح مجموعة KAB Pharma واختر المنتجات المناسبة لاحتياجاتك اليومية.",

      productsButton:
        "تصفّح المنتجات",

      contactButton:
        "تواصل معنا",
    },

    en: {
      eyebrow:
        "About KAB Pharma",

      title:
        "Clear care. Quality you can trust every day.",

      heroText:
        "We develop skin, hair, and personal care products with one goal: making everyday care simpler, clearer, and better suited to your needs.",

      signature:
        "The quality for a healthier life",

      storyLabel:
        "Our story",

      storyTitle:
        "We began with a simple idea: personal care should not feel complicated.",

      storyParagraph1:
        "KAB Pharma offers a diverse range of skincare, haircare, and personal care products, with genuine attention to product quality, ease of use, and customer experience.",

      storyParagraph2:
        "We care about every detail—from how product information and ingredients are presented to packaging, online shopping, and after-sales support.",

      statement:
        "We believe trust is not built through big claims. It is built through clarity, quality, and consistent attention to every detail.",

      visionLabel:
        "01 — Our vision",

      visionTitle:
        "A personal care brand that feels trusted and close.",

      visionText:
        "To become a trusted personal care brand and help every customer build a practical routine that suits their everyday needs.",

      missionLabel:
        "02 — Our mission",

      missionTitle:
        "Practical products and information that helps you choose.",

      missionText:
        "To provide reliable personal care products, clear information, and direct support that helps customers choose confidently.",

      valuesLabel:
        "What we believe",

      valuesTitle:
        "Values that guide everything we do.",

      valuesSubtitle:
        "From product development to shopping and customer care, four principles shape our approach.",

      qualityTitle:
        "Quality",

      qualityText:
        "We care about quality at every stage, from product development to packaging.",

      clarityTitle:
        "Clarity",

      clarityText:
        "We provide clear information about each product, its ingredients, benefits, and use.",

      customerTitle:
        "Customer care",

      customerText:
        "We listen to our customers and provide support before and after every purchase.",

      improvementTitle:
        "Continuous improvement",

      improvementText:
        "We continuously review our products and shopping experience to make them better.",

      whyLabel:
        "Why KAB Pharma?",

      whyTitle:
        "Care designed around everyday life.",

      whyText:
        "We want every customer to enjoy a simple, clear experience supported by practical products and accessible customer service.",

      point1:
        "Skin, hair, and personal care products",

      point2:
        "Clear and accessible product information",

      point3:
        "A simple and convenient shopping experience",

      point4:
        "Direct support from our customer care team",

      promiseLabel:
        "Our promise",

      promiseTitle:
        "We will keep improving—for you.",

      promiseText:
        "We will continue developing our products, improving the shopping experience, and providing customer service that is ready to help at every step.",

      ctaTitle:
        "Discover care that fits your routine.",

      ctaText:
        "Explore KAB Pharma and find products suited to your everyday needs.",

      productsButton:
        "Browse products",

      contactButton:
        "Contact us",
    },
  };

  const t =
    content[
      lang as "ar" | "en"
    ];

  const values = [
    {
      number: "01",
      Icon:
        ShieldCheck,
      title:
        t.qualityTitle,
      text:
        t.qualityText,
    },
    {
      number: "02",
      Icon:
        FlaskConical,
      title:
        t.clarityTitle,
      text:
        t.clarityText,
    },
    {
      number: "03",
      Icon:
        HeartHandshake,
      title:
        t.customerTitle,
      text:
        t.customerText,
    },
    {
      number: "04",
      Icon:
        MessageCircle,
      title:
        t.improvementTitle,
      text:
        t.improvementText,
    },
  ];

  const whyPoints = [
    t.point1,
    t.point2,
    t.point3,
    t.point4,
  ];

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen overflow-hidden bg-[#fbfcfa] text-[#142019]"
    >
      <header className="bg-[#eaf2ed] px-5 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-10 lg:pb-32 lg:pt-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)] lg:items-end lg:gap-24">
            <div>
              <p
                className={`text-[11px] font-bold uppercase text-[#0a583b] ${
                  isArabic ? "tracking-normal" : "tracking-[0.22em]"
                }`}
              >
                {t.eyebrow}
              </p>
              <h1
                className={`mt-6 max-w-[920px] font-medium text-[#102c21] ${
                  isArabic
                    ? "text-[42px] leading-[1.25] [font-family:var(--font-arabic)] sm:text-[58px] lg:text-[76px]"
                    : "text-[50px] leading-[.98] tracking-[-0.055em] sm:text-[70px] lg:text-[88px]"
                }`}
              >
                {t.title}
              </h1>
            </div>
            <div className="border-s border-[#b9ccc0] ps-6 sm:ps-8">
              <p className="text-[15px] leading-8 text-[#42564b] sm:text-base">
                {t.heroText}
              </p>
              <Link
                href="/products"
                className="group mt-7 inline-flex items-center gap-3 text-sm font-bold text-[#0a583b]"
              >
                {t.productsButton}
                <ArrowIcon
                  size={16}
                  className={`transition-transform ${
                    isArabic
                      ? "group-hover:-translate-x-1"
                      : "group-hover:translate-x-1"
                  }`}
                />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-white px-5 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-24">
          <div className="lg:pt-2">
            <p
              className={`text-[11px] font-bold uppercase text-[#0a583b] ${
                isArabic ? "tracking-normal" : "tracking-[0.2em]"
              }`}
            >
              {t.storyLabel}
            </p>
            <p dir="ltr" className="mt-4 text-xs font-semibold tracking-[0.14em] text-[#849188]">
              KAB PHARMA
            </p>
          </div>
          <div>
            <h2
              className={`max-w-4xl font-medium text-[#142019] ${
                isArabic
                  ? "text-3xl leading-[1.4] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                  : "text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[58px]"
              }`}
            >
              {t.storyTitle}
            </h2>
            <div className="mt-10 grid gap-7 border-t border-[#dce4df] pt-8 sm:grid-cols-2 sm:gap-12">
              <p className="text-[15px] leading-8 text-[#536158]">
                {t.storyParagraph1}
              </p>
              <p className="text-[15px] leading-8 text-[#536158]">
                {t.storyParagraph2}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0a583b] px-5 py-16 text-white sm:px-6 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <blockquote
            className={`font-medium ${
              isArabic
                ? "text-3xl leading-[1.5] [font-family:var(--font-arabic)] sm:text-4xl"
                : "text-4xl leading-[1.12] tracking-[-0.035em] sm:text-5xl"
            }`}
          >
            “{t.statement}”
          </blockquote>
          <div className="grid gap-10 border-t border-white/25 pt-8 sm:grid-cols-2 lg:border-s lg:border-t-0 lg:ps-14 lg:pt-0">
            <article>
            <p
                className={`text-[10px] font-bold uppercase text-white/60 ${
                  isArabic ? "tracking-normal" : "tracking-[0.18em]"
                }`}
            >
              {t.visionLabel}
            </p>
              <h2 className="mt-5 text-xl font-semibold leading-snug">
              {t.visionTitle}
            </h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
              {t.visionText}
            </p>
          </article>
            <article>
            <p
                className={`text-[10px] font-bold uppercase text-white/60 ${
                  isArabic ? "tracking-normal" : "tracking-[0.18em]"
                }`}
            >
              {t.missionLabel}
            </p>
              <h2 className="mt-5 text-xl font-semibold leading-snug">
              {t.missionTitle}
            </h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
              {t.missionText}
            </p>
          </article>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfcfa] px-5 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:gap-20">
            <div>
              <p
                className={`text-[11px] font-bold uppercase text-[#0a583b] ${
                  isArabic ? "tracking-normal" : "tracking-[0.2em]"
                }`}
              >
                {t.valuesLabel}
              </p>
              <h2
                className={`mt-5 font-medium text-[#142019] ${
                  isArabic
                    ? "text-3xl leading-[1.35] [font-family:var(--font-arabic)] sm:text-4xl"
                    : "text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl"
                }`}
              >
                {t.valuesTitle}
              </h2>
            </div>
            <p className="max-w-2xl text-[15px] leading-8 text-[#647168]">
              {t.valuesSubtitle}
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[1.5rem] border border-[#dce4df] bg-[#dce4df] sm:grid-cols-2 lg:grid-cols-4">
            {values.map(
              ({
                number,
                Icon,
                title,
                text,
              }) => (
                <article
                  key={number}
                  className="bg-white p-7 sm:min-h-[285px] sm:p-8"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold tracking-[0.16em] text-[#8a948d]">
                      {number}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f0]">
                      <Icon size={18} strokeWidth={1.7} className="text-[#0a583b]" />
                    </span>
                  </div>
                  <h3 className="mt-12 text-lg font-semibold text-[#142019]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#647168]">
                    {text}
                  </p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe4e0] bg-white px-5 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-2 lg:items-start lg:gap-20">
          <div>
            <p
              className={`text-[11px] font-bold uppercase text-[#0a583b] ${
                isArabic ? "tracking-normal" : "tracking-[0.2em]"
              }`}
            >
              {t.whyLabel}
            </p>
            <h2
              className={`mt-5 max-w-xl font-medium text-[#142019] ${
                isArabic
                  ? "text-3xl leading-[1.3] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                  : "text-4xl leading-[1.04] tracking-[-0.04em] sm:text-5xl"
              }`}
            >
              {t.whyTitle}
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#647168]">
              {t.whyText}
            </p>
          </div>
          <div className="border-t border-[#ccd7d0]">
            {whyPoints.map(
              (
                point,
                index
              ) => (
                <div
                  key={point}
                  className="flex items-center gap-4 border-b border-[#dce4df] py-6"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eaf3ed] text-[#0a583b]">
                    <Check size={14} strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold leading-7 text-[#42564b]">
                    {point}
                  </span>
                  <span className="ms-auto shrink-0 text-[10px] font-bold tracking-[0.15em] text-[#a0aaa3]">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#eaf2ed] px-5 py-16 sm:px-6 sm:py-24 lg:px-10 lg:py-28">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={`text-[11px] font-bold uppercase text-[#0a583b] ${
              isArabic ? "tracking-normal" : "tracking-[0.2em]"
            }`}>
              {t.promiseLabel}
            </p>
            <h2
              className={`mt-5 max-w-3xl font-medium text-[#142019] ${
                isArabic
                  ? "text-3xl leading-[1.3] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                  : "text-4xl leading-[1.04] tracking-[-0.04em] sm:text-5xl"
              }`}
            >
              {t.promiseTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#647168]">
              {t.promiseText}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          </div>
        </div>
      </section>
    </main>
  );
}