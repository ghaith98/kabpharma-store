"use client";

import Link from "next/link";
import {
  FaArrowRight,
  FaBullseye,
  FaCheckCircle,
  FaEye,
  FaHeadset,
  FaHeart,
  FaLeaf,
  FaRegLightbulb,
  FaShieldAlt,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

export default function AboutPage() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";

  const content = {
    ar: {
      badge: "العناية تبدأ بالثقة",
      title: "من نحن",
      heroText:
        "في KAB Pharma نؤمن أن العناية اليومية بالبشرة والشعر والجسم يجب أن تكون بسيطة، واضحة، وملائمة لاحتياجاتك اليومية.",

      storyTitle: "قصتنا",
      storyParagraph1:
        "تقدّم KAB Pharma مجموعة متنوعة من منتجات العناية بالبشرة والشعر والجسم، مع الاهتمام بجودة المنتج، سهولة استخدامه، وتجربة العميل.",
      storyParagraph2:
        "نهتم بكل تفصيل، بدءاً من اختيار المنتجات وتقديم معلومات واضحة عنها، وصولاً إلى تصميم العبوة وخدمة العملاء بعد الشراء.",

      visionTitle: "رؤيتنا",
      visionText:
        "أن تكون KAB Pharma علامة موثوقة في مجال العناية الشخصية، وأن نساعد كل عميل على بناء روتين عناية بسيط يناسب احتياجاته اليومية.",

      missionTitle: "رسالتنا",
      missionText:
        "تقديم منتجات عناية شخصية موثوقة، ومعلومات واضحة، وخدمة عملاء تساعدك على اختيار المنتج المناسب بثقة.",

      valuesTitle: "قيمنا",
      valuesSubtitle:
        "القيم التي نعتمد عليها في تطوير منتجاتنا وتحسين تجربة عملائنا.",

      qualityTitle: "الجودة",
      qualityText:
        "نهتم بجودة منتجاتنا في كل مرحلة، من اختيار المنتج وحتى التغليف.",

      transparencyTitle: "الوضوح",
      transparencyText:
        "نحرص على تقديم معلومات واضحة عن المنتج، مكوناته، وطريقة استخدامه.",

      customerTitle: "العناية بالعميل",
      customerText:
        "نستمع إلى أسئلة العملاء ونقدّم الدعم قبل الشراء وبعده.",

      improvementTitle: "التطوير المستمر",
      improvementText:
        "نعمل باستمرار على تحسين منتجاتنا وتجربة التسوق عبر موقعنا.",

      whyTitle: "لماذا KAB Pharma؟",
      whyText:
        "لأننا نريد أن يحصل العميل على تجربة عناية بسيطة وواضحة، مع منتجات عملية وخدمة عملاء قريبة منه.",

      point1: "منتجات للعناية بالبشرة والشعر والجسم",
      point2: "معلومات واضحة وسهلة عن كل منتج",
      point3: "تجربة تسوق بسيطة ومريحة",
      point4: "دعم مباشر من فريق خدمة العملاء",

      promiseTitle: "وعدنا لك",
      promiseText:
        "سنواصل العمل على تقديم منتجات عناية شخصية موثوقة، وتجربة شراء سهلة، وخدمة عملاء جاهزة لمساعدتك.",

      slogan: "KAB Pharma — الجودة لحياة أكثر صحة",

      productsButton: "تصفّح المنتجات",
      contactButton: "تواصل معنا",
    },

    en: {
      badge: "Care Begins With Trust",
      title: "About Us",
      heroText:
        "At KAB Pharma, we believe that daily skin, hair, and personal care should be simple, clear, and suitable for your everyday needs.",

      storyTitle: "Our Story",
      storyParagraph1:
        "KAB Pharma offers a diverse range of skincare, haircare, and personal care products, with a focus on product quality, ease of use, and customer experience.",
      storyParagraph2:
        "We care about every detail, from selecting products and providing clear information to packaging design and after-sales customer support.",

      visionTitle: "Our Vision",
      visionText:
        "To become a trusted personal care brand and help every customer build a simple care routine that suits their daily needs.",

      missionTitle: "Our Mission",
      missionText:
        "To provide reliable personal care products, clear information, and helpful customer service that allows customers to choose with confidence.",

      valuesTitle: "Our Values",
      valuesSubtitle:
        "The principles that guide our products and customer experience.",

      qualityTitle: "Quality",
      qualityText:
        "We care about quality at every stage, from product selection to packaging.",

      transparencyTitle: "Transparency",
      transparencyText:
        "We provide clear information about each product, its ingredients, and how to use it.",

      customerTitle: "Customer Care",
      customerText:
        "We listen to our customers and provide support before and after every purchase.",

      improvementTitle: "Continuous Improvement",
      improvementText:
        "We continuously work to improve our products and online shopping experience.",

      whyTitle: "Why KAB Pharma?",
      whyText:
        "Because we want every customer to enjoy a simple and clear care experience, supported by practical products and accessible customer service.",

      point1: "Skincare, haircare, and personal care products",
      point2: "Clear and easy product information",
      point3: "A simple and convenient shopping experience",
      point4: "Direct customer service support",

      promiseTitle: "Our Promise",
      promiseText:
        "We will continue working to provide reliable personal care products, an easy shopping experience, and customer service that is ready to help.",

      slogan: "KAB Pharma — The Quality for a Healthier Life",

      productsButton: "Browse Products",
      contactButton: "Contact Us",
    },
  };

  const t = content[lang as "ar" | "en"];

  const values = [
    {
      icon: <FaShieldAlt />,
      title: t.qualityTitle,
      text: t.qualityText,
    },
    {
      icon: <FaRegLightbulb />,
      title: t.transparencyTitle,
      text: t.transparencyText,
    },
    {
      icon: <FaHeart />,
      title: t.customerTitle,
      text: t.customerText,
    },
    {
      icon: <FaLeaf />,
      title: t.improvementTitle,
      text: t.improvementText,
    },
  ];

  const whyPoints = [t.point1, t.point2, t.point3, t.point4];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 pb-28 md:pb-16"
    >
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-16 md:py-24">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-green-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-green-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700 ring-1 ring-green-100">
            <FaLeaf />
            <span>{t.badge}</span>
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 md:text-xl">
            {t.heroText}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        {/* Story */}
        <section className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100 md:p-12">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-700">
                <FaLeaf />
              </div>

              <h2 className="mt-5 text-3xl font-extrabold text-gray-900">
                {t.storyTitle}
              </h2>

              <p className="mt-5 leading-8 text-gray-600">
                {t.storyParagraph1}
              </p>

              <p className="mt-4 leading-8 text-gray-600">
                {t.storyParagraph2}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-600 to-green-800 p-8 text-white md:p-10">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-white/5" />

              <div className="relative">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-100">
                  KAB Pharma
                </p>

                <p className="mt-6 text-2xl font-extrabold leading-relaxed md:text-3xl">
                  {t.slogan}
                </p>

                <div className="mt-8 flex items-center gap-3 text-green-100">
                  <FaCheckCircle className="text-xl" />
                  <span className="font-medium">{t.badge}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vision and mission */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-700">
              <FaEye />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
              {t.visionTitle}
            </h2>

            <p className="mt-4 leading-8 text-gray-600">
              {t.visionText}
            </p>
          </article>

          <article className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-700">
              <FaBullseye />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
              {t.missionTitle}
            </h2>

            <p className="mt-4 leading-8 text-gray-600">
              {t.missionText}
            </p>
          </article>
        </section>

        {/* Values */}
        <section className="mt-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 md:text-4xl">
              {t.valuesTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
              {t.valuesSubtitle}
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-xl text-green-700">
                  {value.icon}
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-gray-900">
                  {value.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {value.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Why KAB Pharma */}
        <section className="mt-16 overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-100">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12">
              <h2 className="text-3xl font-extrabold text-gray-900">
                {t.whyTitle}
              </h2>

              <p className="mt-5 leading-8 text-gray-600">
                {t.whyText}
              </p>

              <div className="mt-7 space-y-4">
                {whyPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <FaCheckCircle className="mt-1 shrink-0 text-green-600" />

                    <span className="leading-7 text-gray-700">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-10 md:p-12">
              <div className="text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl text-green-700 shadow-sm">
                  <FaHeadset />
                </div>

                <h3 className="mt-6 text-2xl font-extrabold text-gray-900">
                  {t.promiseTitle}
                </h3>

                <p className="mx-auto mt-4 max-w-md leading-8 text-gray-600">
                  {t.promiseText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 rounded-[2rem] bg-gradient-to-br from-green-600 to-green-800 px-8 py-12 text-center text-white shadow-lg md:px-12">
          <h2 className="text-3xl font-extrabold">
            {t.slogan}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-green-50">
            {t.promiseText}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-bold text-green-700 transition hover:-translate-y-0.5 hover:bg-green-50"
            >
              <span>{t.productsButton}</span>

              <FaArrowRight
                className={isArabic ? "rotate-180" : ""}
              />
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
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