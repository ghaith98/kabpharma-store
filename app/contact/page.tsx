"use client";

import { useMemo } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Headphones,
  Mail,
  MessageCircle,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import {
  FaFacebookF as Facebook,
  FaInstagram as Instagram,
  FaWhatsapp,
} from "react-icons/fa";

import { useLanguage } from "../../context/LanguageContext";

export default function ContactPage() {
  const { lang } = useLanguage();

  const isArabic = lang === "ar";

  const ArrowIcon = isArabic
    ? ArrowLeft
    : ArrowRight;

  const text = {
    ar: {
      eyebrow: "خدمة العملاء",

      title: "نحن هنا لمساعدتك.",

      description:
        "سواء كان لديك سؤال عن أحد منتجاتنا، أو احتجت إلى مساعدة بخصوص طلبك، يمكنك التواصل مباشرة مع فريق KAB Pharma.",

      status: "جاهزون لاستقبال رسالتك",

      statusText:
        "سنراجع رسالتك ونرد عليك في أقرب وقت ممكن.",

      primaryLabel: "خدمة العملاء",

      whatsappTitle:
        "تحدث معنا عبر واتساب",

      whatsappText:
        "ابدأ محادثة مباشرة مع فريق خدمة العملاء للحصول على مساعدة بخصوص المنتجات أو الطلبات.",

      whatsappButton:
        "بدء المحادثة",

      whatsappSupport:
        "دعم للمنتجات والطلبات",

      otherChannels:
        "قنوات التواصل",

      otherChannelsText:
        "يمكنك أيضاً التواصل معنا عبر إحدى القنوات التالية.",

      instagramText:
        "تابع آخر أخبارنا وأرسل لنا رسالة مباشرة.",

      facebookText:
        "تواصل معنا وتابع تحديثات KAB Pharma.",

      emailTitle:
        "البريد الإلكتروني",

      emailText:
        "للاستفسارات العامة والتعاون.",

      prepareTitle:
        "لمساعدتك بشكل أسرع",

      orderHelpTitle:
        "إذا كان سؤالك عن طلب",

      orderHelpText:
        "أرسل رقم الهاتف المرتبط بحسابك ورقم الطلب.",

      productHelpTitle:
        "إذا كان سؤالك عن منتج",

      productHelpText:
        "اذكر اسم المنتج والسؤال أو المساعدة التي تحتاجها.",

      note:
        "خصوصيتك مهمة لنا. لا ترسل أي كلمات مرور أو رموز تحقق عبر الرسائل.",
    },

    en: {
      eyebrow: "Customer care",

      title: "We’re here to help.",

      description:
        "Whether you have a question about a product or need help with an order, you can contact the KAB Pharma team directly.",

      status:
        "Ready to receive your message",

      statusText:
        "We’ll review your message and respond as soon as possible.",

      primaryLabel: "Customer service",

      whatsappTitle:
        "Chat with us on WhatsApp",

      whatsappText:
        "Start a direct conversation with our customer care team for help with products or orders.",

      whatsappButton:
        "Start conversation",

      whatsappSupport:
        "Product and order support",

      otherChannels:
        "Contact channels",

      otherChannelsText:
        "You can also reach us through any of the following channels.",

      instagramText:
        "Follow our latest updates and send us a direct message.",

      facebookText:
        "Connect with us and follow KAB Pharma updates.",

      emailTitle:
        "Email",

      emailText:
        "For general questions and collaboration.",

      prepareTitle:
        "Help us assist you faster",

      orderHelpTitle:
        "For order questions",

      orderHelpText:
        "Include the phone number linked to your account and your order number if available.",

      productHelpTitle:
        "For product questions",

      productHelpText:
        "Tell us the product name and the information or help you need.",

      note:
        "Your privacy matters. Never send passwords or verification codes through messages.",
    },
  }[lang as "ar" | "en"];

  const whatsappUrl = useMemo(() => {
    const message = isArabic
      ? `مرحباً فريق KAB Pharma 👋
أحتاج مساعدة بخصوص:

`
      : `Hello KAB Pharma team 👋
I need help regarding:

`;

    return `https://wa.me/963958088969?text=${encodeURIComponent(
      message
    )}`;
  }, [isArabic]);

  const channels = [
    {
      label: "Instagram",

      text: text.instagramText,

      href:
        "https://www.instagram.com/kabpharma?igsh=NHpuY2F1eHFlYWgw&utm_source=qr",

      Icon: Instagram,
    },

    {
      label: "Facebook",

      text: text.facebookText,

      href:
        "https://www.facebook.com/share/17YjFUHZcR/?mibextid=wwXIfr",

      Icon: Facebook,
    },

    {
      label: text.emailTitle,

      text: text.emailText,

      href:
        "mailto:kabpharma.sy@hotmail.com",

      detail:
        "kabpharma.sy@hotmail.com",

      Icon: Mail,
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f8f6] pb-28 text-[#142019] lg:pb-16"
    >
      {/* Hero */}
      <header className="border-b border-[#dfe4e0] bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] lg:items-end lg:gap-20">
          <div>
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.2em]"
              }`}
            >
              {text.eyebrow}
            </p>

            <h1
              className={`mt-5 max-w-4xl font-extrabold text-[#142019] ${
                isArabic
                  ? "text-[40px] leading-[1.2] tracking-normal [font-family:Tahoma,Arial,sans-serif] sm:text-[54px] lg:text-[68px]"
                  : "text-[46px] leading-[0.98] tracking-[-0.055em] sm:text-[64px] lg:text-[82px]"
              }`}
            >
              {text.title}
            </h1>
          </div>

          <div>
            <p className="text-[15px] leading-8 text-[#526057] sm:text-base">
              {text.description}
            </p>

            <div className="mt-6 flex items-start gap-3 border-t border-[#dfe4e0] pt-5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <Check
                  size={15}
                  strokeWidth={2.5}
                />
              </div>

              <div>
                <p className="text-sm font-extrabold text-[#142019]">
                  {text.status}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7a857e]">
                  {text.statusText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1320px] px-5 sm:px-6 lg:px-10">
        {/* Contact methods */}
        <section className="grid gap-6 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-8 lg:py-20">
          {/* WhatsApp — mobile and tablet */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={text.whatsappTitle}
            className="group block overflow-hidden rounded-[1.5rem] border border-[#dfe4e0] bg-white transition duration-200 active:scale-[0.99] lg:hidden"
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                  <FaWhatsapp size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${
                        isArabic
                          ? "tracking-normal"
                          : "tracking-[0.14em]"
                      }`}
                    >
                      {text.primaryLabel}
                    </p>

                    <span className="h-1 w-1 rounded-full bg-[#b8c2bb]" />

                    <p className="text-[10px] font-bold text-[#7a857e]">
                      WhatsApp
                    </p>
                  </div>

                  <h2
                    className={`mt-2 font-extrabold text-[#142019] ${
                      isArabic
                        ? "text-lg leading-7 [font-family:Tahoma,Arial,sans-serif]"
                        : "text-xl leading-6 tracking-[-0.02em]"
                    }`}
                  >
                    {text.whatsappTitle}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#647168]">
                    {text.whatsappText}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex min-h-12 items-center justify-between gap-4 rounded-full bg-[#0a583b] px-5 text-sm font-extrabold text-white transition group-active:bg-[#073f2c]">
                <span>
                  {text.whatsappButton}
                </span>

                <ArrowIcon
                  size={17}
                  className={`shrink-0 transition-transform ${
                    isArabic
                      ? "group-active:-translate-x-1"
                      : "group-active:translate-x-1"
                  }`}
                />
              </div>
            </div>

           <div
  dir={isArabic ? "rtl" : "ltr"}
  className="flex items-center border-t border-[#e7ebe8] bg-[#f7f8f6] px-5 py-3 sm:px-6"
>
  <div className="flex min-w-0 items-center gap-2">
    <span className="h-2 w-2 shrink-0 rounded-full bg-[#25d366]" />

    <span className="truncate text-[11px] font-bold text-[#647168]">
      {text.whatsappSupport}
    </span>
  </div>
</div>
          </a>

          {/* WhatsApp — desktop */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={text.whatsappTitle}
            className="group relative hidden min-h-[480px] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-[#0a583b] p-11 text-white transition duration-300 hover:bg-[#073f2c] lg:flex"
          >
            <div>
              <div className="flex items-center justify-between gap-5">
                <span className="rounded-full border border-white/25 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/80">
                  {text.primaryLabel}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0a583b]">
                  <MessageCircle size={22} />
                </div>
              </div>

              <h2
                className={`mt-10 max-w-xl font-extrabold ${
                  isArabic
                    ? "text-4xl leading-[1.3] [font-family:Tahoma,Arial,sans-serif]"
                    : "text-5xl leading-[1.02] tracking-[-0.04em]"
                }`}
              >
                {text.whatsappTitle}
              </h2>

              <p className="mt-5 max-w-lg text-base leading-8 text-white/75">
                {text.whatsappText}
              </p>
            </div>

            <div className="mt-12 flex items-center justify-between border-t border-white/20 pt-6">
              <span className="text-sm font-extrabold">
                {text.whatsappButton}
              </span>

              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 transition group-hover:bg-white group-hover:text-[#0a583b]">
                <ArrowIcon
                  size={18}
                  className={`transition-transform ${
                    isArabic
                      ? "group-hover:-translate-x-1"
                      : "group-hover:translate-x-1"
                  }`}
                />
              </span>
            </div>
          </a>

          {/* Other contact channels */}
          <div className="overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">
            <div className="border-b border-[#e7ebe8] p-6 sm:p-8">
              <p
                className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                  isArabic
                    ? "tracking-normal"
                    : "tracking-[0.16em]"
                }`}
              >
                KAB Pharma
              </p>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#142019] sm:text-3xl">
                {text.otherChannels}
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#647168]">
                {text.otherChannelsText}
              </p>
            </div>

            <div>
              {channels.map(
                ({
                  label,
                  text: channelText,
                  href,
                  detail,
                  Icon,
                }) => (
                  <a
                    key={label}
                    href={href}
                    target={
                      href.startsWith("mailto:")
                        ? undefined
                        : "_blank"
                    }
                    rel={
                      href.startsWith("mailto:")
                        ? undefined
                        : "noopener noreferrer"
                    }
                    className="group flex items-center gap-4 border-b border-[#e7ebe8] p-5 transition last:border-b-0 hover:bg-[#f7f8f6] sm:p-6"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d5ddd7] bg-white text-[#0a583b] transition group-hover:border-[#0a583b] group-hover:bg-[#0a583b] group-hover:text-white">
                      <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-[#142019]">
                        {label}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-[#7a857e]">
                        {channelText}
                      </span>

                      {detail && (
                        <span
                          dir="ltr"
                          className="mt-1 block truncate text-start text-xs font-bold text-[#0a583b]"
                        >
                          {detail}
                        </span>
                      )}
                    </span>

                    <ArrowIcon
                      size={16}
                      className={`shrink-0 text-[#8a948d] transition ${
                        isArabic
                          ? "group-hover:-translate-x-1"
                          : "group-hover:translate-x-1"
                      }`}
                    />
                  </a>
                )
              )}
            </div>
          </div>
        </section>

        {/* Helpful information */}
        <section className="border-y border-[#dfe4e0] py-10 sm:py-12">
          <div className="mb-8">
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.16em]"
              }`}
            >
              {text.prepareTitle}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
            <article className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <PackageCheck size={19} />
              </div>

              <div>
                <h2 className="font-extrabold text-[#142019]">
                  {text.orderHelpTitle}
                </h2>

                <p className="mt-2 text-sm leading-7 text-[#647168]">
                  {text.orderHelpText}
                </p>
              </div>
            </article>

            <article className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <Sparkles size={19} />
              </div>

              <div>
                <h2 className="font-extrabold text-[#142019]">
                  {text.productHelpTitle}
                </h2>

                <p className="mt-2 text-sm leading-7 text-[#647168]">
                  {text.productHelpText}
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Privacy note */}
        <section className="flex flex-col gap-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:py-12">
          <div className="flex items-start gap-3">
            <Headphones
              size={18}
              className="mt-0.5 shrink-0 text-[#0a583b]"
            />

            <p className="max-w-2xl text-xs leading-6 text-[#7a857e]">
              {text.note}
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#0a583b] px-5 text-xs font-extrabold text-[#0a583b] transition hover:bg-[#0a583b] hover:text-white"
          >
            <FaWhatsapp size={15} />

            {text.whatsappButton}
          </a>
        </section>
      </div>
    </main>
  );
}