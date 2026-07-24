"use client";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  Headphones,
  HeartHandshake,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
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
        Eye,

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
        RefreshCw,

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
      className="min-h-screen bg-[#f7f8f6] text-[#142019]"
    >
      {/* Hero */}
      <header className="border-b border-[#dfe4e0] bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <p
            className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
              isArabic
                ? "tracking-normal"
                : "tracking-[0.2em]"
            }`}
          >
            {t.eyebrow}
          </p>

          <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-end lg:gap-20">
            <h1
              className={`max-w-[1000px] font-extrabold text-[#142019] ${
                isArabic
                  ? "text-[42px] leading-[1.2] tracking-normal [font-family:var(--font-arabic)] sm:text-[58px] lg:text-[76px]"
                  : "text-[50px] leading-[0.94] tracking-[-0.06em] sm:text-[72px] lg:text-[98px]"
              }`}
            >
              {t.title}
            </h1>

            <div>
              <p className="text-[15px] leading-8 text-[#526057] sm:text-base">
                {t.heroText}
              </p>

              <div className="mt-7 border-t border-[#dfe4e0] pt-5">
                <p
                  dir="ltr"
                  className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0a583b]"
                >
                  KAB Pharma
                </p>

                <p className="mt-2 text-sm font-bold text-[#647168]">
                  {t.signature}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Story */}
      <section className="px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-20">
          <div>
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.18em]"
              }`}
            >
              {t.storyLabel}
            </p>

            <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#cbd3cd] text-[#0a583b]">
              <Leaf size={20} />
            </div>
          </div>

          <div>
            <h2
              className={`max-w-4xl font-extrabold text-[#142019] ${
                isArabic
                  ? "text-3xl leading-[1.35] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                  : "text-4xl leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
              }`}
            >
              {t.storyTitle}
            </h2>

            <div className="mt-10 grid gap-7 border-t border-[#dfe4e0] pt-8 sm:grid-cols-2 sm:gap-10">
              <p className="text-[15px] leading-8 text-[#526057]">
                {t.storyParagraph1}
              </p>

              <p className="text-[15px] leading-8 text-[#526057]">
                {t.storyParagraph2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <section className="bg-[#0a583b] px-5 py-16 text-white sm:px-6 sm:py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <Sparkles
            size={22}
            className="text-white/70"
          />

          <blockquote
            className={`mt-8 max-w-[1150px] font-extrabold ${
              isArabic
                ? "text-3xl leading-[1.45] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                : "text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-7xl"
            }`}
          >
            “{t.statement}”
          </blockquote>

          <p
            dir="ltr"
            className="mt-10 text-xs font-extrabold uppercase tracking-[0.18em] text-white/65"
          >
            KAB Pharma
          </p>
        </div>
      </section>

      {/* Vision and mission */}
      <section className="border-b border-[#dfe4e0] bg-white px-5 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1320px] lg:grid-cols-2">
          <article className="border-b border-[#dfe4e0] py-14 lg:border-b-0 lg:border-e lg:py-20 lg:pe-16">
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.16em]"
              }`}
            >
              {t.visionLabel}
            </p>

            <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <Eye size={20} />
            </div>

            <h2 className="mt-7 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[#142019] sm:text-4xl">
              {t.visionTitle}
            </h2>

            <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#647168]">
              {t.visionText}
            </p>
          </article>

          <article className="py-14 lg:py-20 lg:ps-16">
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.16em]"
              }`}
            >
              {t.missionLabel}
            </p>

            <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <Target size={20} />
            </div>

            <h2 className="mt-7 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[#142019] sm:text-4xl">
              {t.missionTitle}
            </h2>

            <p className="mt-5 max-w-xl text-[15px] leading-8 text-[#647168]">
              {t.missionText}
            </p>
          </article>
        </div>
      </section>

      {/* Values */}
      <section className="px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-end lg:gap-20">
            <div>
              <p
                className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                  isArabic
                    ? "tracking-normal"
                    : "tracking-[0.18em]"
                }`}
              >
                {t.valuesLabel}
              </p>

              <h2
                className={`mt-5 font-extrabold text-[#142019] ${
                  isArabic
                    ? "text-3xl leading-[1.3] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                    : "text-4xl leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
                }`}
              >
                {t.valuesTitle}
              </h2>
            </div>

            <p className="max-w-2xl text-[15px] leading-8 text-[#647168]">
              {t.valuesSubtitle}
            </p>
          </div>

          <div className="mt-12 grid border-y border-[#dfe4e0] sm:grid-cols-2 lg:grid-cols-4">
            {values.map(
              ({
                number,
                Icon,
                title,
                text,
              }) => (
                <article
                  key={number}
                  className="border-b border-[#dfe4e0] py-8 last:border-b-0 sm:p-7 sm:[&:nth-child(odd)]:border-e lg:border-b-0 lg:border-e lg:last:border-e-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-extrabold text-[#8a948d]">
                      {number}
                    </span>

                    <Icon
                      size={19}
                      className="text-[#0a583b]"
                    />
                  </div>

                  <h3 className="mt-10 text-lg font-extrabold text-[#142019]">
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

      {/* Why KAB */}
      <section className="border-y border-[#dfe4e0] bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-2 lg:items-start lg:gap-20">
          <div>
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.18em]"
              }`}
            >
              {t.whyLabel}
            </p>

            <h2
              className={`mt-5 max-w-xl font-extrabold text-[#142019] ${
                isArabic
                  ? "text-3xl leading-[1.3] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                  : "text-4xl leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
              }`}
            >
              {t.whyTitle}
            </h2>

            <p className="mt-6 max-w-xl text-[15px] leading-8 text-[#647168]">
              {t.whyText}
            </p>
          </div>

          <div className="border-t border-[#dfe4e0]">
            {whyPoints.map(
              (
                point,
                index
              ) => (
                <div
                  key={point}
                  className="flex items-start gap-4 border-b border-[#dfe4e0] py-5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                    <Check
                      size={14}
                      strokeWidth={2.5}
                    />
                  </span>

                  <span className="text-sm font-bold leading-7 text-[#526057]">
                    {point}
                  </span>

                  <span className="ms-auto shrink-0 text-xs font-bold text-[#9aa39d]">
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

      {/* Promise */}
      <section className="px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1320px] overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-[#edf5f0] lg:grid-cols-[0.65fr_1.35fr]">
          <div className="flex min-h-[260px] flex-col justify-between bg-[#142019] p-7 text-white sm:p-10 lg:min-h-[440px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25">
              <Headphones size={20} />
            </div>

            <div>
              <p
                className={`text-[11px] font-extrabold uppercase text-white/60 ${
                  isArabic
                    ? "tracking-normal"
                    : "tracking-[0.16em]"
                }`}
              >
                {t.promiseLabel}
              </p>

              <p
                dir="ltr"
                className="mt-3 text-xs font-extrabold uppercase tracking-[0.18em] text-white"
              >
                KAB Pharma
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-16">
            <h2
              className={`font-extrabold text-[#142019] ${
                isArabic
                  ? "text-3xl leading-[1.35] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                  : "text-4xl leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
              }`}
            >
              {t.promiseTitle}
            </h2>

            <p className="mt-6 max-w-2xl text-[15px] leading-8 text-[#526057]">
              {t.promiseText}
            </p>

            <Link
              href="/contact"
              className="group mt-8 inline-flex w-fit items-center gap-3 border-b border-[#142019] pb-1 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
            >
              <span>
                {t.contactButton}
              </span>

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
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#dfe4e0] bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              dir="ltr"
              className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0a583b]"
            >
              KAB Pharma
            </p>

            <h2
              className={`mt-5 max-w-3xl font-extrabold text-[#142019] ${
                isArabic
                  ? "text-3xl leading-[1.3] [font-family:var(--font-arabic)] sm:text-4xl lg:text-5xl"
                  : "text-4xl leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl"
              }`}
            >
              {t.ctaTitle}
            </h2>

            <p className="mt-5 max-w-2xl text-[15px] leading-8 text-[#647168]">
              {t.ctaText}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Link
              href="/products"
              className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
            >
              <span>
                {t.productsButton}
              </span>

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
      </section>
    </main>
  );
}
