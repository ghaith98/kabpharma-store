"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import type { Swiper as SwiperInstance } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay } from "swiper/modules";
import { useLanguage } from "@/context/LanguageContext";
import "swiper/css";

const benefits = [
  {
    id: "favorites",
    image: "/images/membership/favorites.svg",
    en: "Keep your favorite products together, ready to revisit whenever you like.",
    ar: "احتفظ بمنتجاتك المفضلة في مكان واحد، وارجع إليها وقت ما تحب.",
  },
  {
    id: "orders",
    image: "/images/membership/orders.svg",
    en: "Check your order status and look back at your previous purchases.",
    ar: "تابع حالة طلباتك، وارجع إلى مشترياتك السابقة بسهولة.",
  },
  {
    id: "checkout",
    image: "/images/membership/checkout.svg",
    en: "Enjoy an easier checkout with your saved delivery details on this device.",
    ar: "استمتع بطلب أسهل مع بيانات التوصيل المحفوظة على جهازك.",
  },
  {
    id: "account",
    image: "/images/membership/account.svg",
    en: "Access your account details and shopping essentials in one place.",
    ar: "اعثر على بيانات حسابك وكل ما يخص تسوقك في مكان واحد.",
  },
];

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeToMotion(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function getMotionPreference() {
  return window.matchMedia(motionQuery).matches;
}

export default function MembershipBenefits() {
  const { lang } = useLanguage();
  const isArabic = lang === "ar";
  const reduceMotion = useSyncExternalStore(subscribeToMotion, getMotionPreference, () => false);
  const [paused, setPaused] = useState(false);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const automatic = !reduceMotion && !paused;

  function togglePlayback() {
    if (paused) swiperRef.current?.autoplay.start();
    else swiperRef.current?.autoplay.stop();
    setPaused(!paused);
  }

  return (
    <section
      aria-labelledby="membership-benefits-title"
      dir={isArabic ? "rtl" : "ltr"}
      className="overflow-hidden border-t border-[#edf0ed] bg-[#fafbf9] pb-12 pt-12 sm:pb-16 sm:pt-16 lg:pb-20 lg:pt-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0a583b]">KAB Pharma</p>
        <h2 id="membership-benefits-title" className={`max-w-[900px] text-[28px] font-extrabold leading-tight text-[#142019] sm:text-3xl lg:text-[36px] ${isArabic ? "[font-family:var(--font-arabic)]" : "tracking-[-0.025em]"}`}>
          {isArabic ? "عناية أكثر، مع حسابك في كاب فارما." : "More care, with your KAB Pharma account."}
        </h2>
        <p className="mt-4 max-w-[680px] text-sm leading-7 text-[#647168] sm:text-base">
          {isArabic ? "منتجاتك المفضلة، طلباتك، وبياناتك — كلها أقرب إليك. أنشئ حسابك لتجربة تسوق أسهل." : "Your favorites, your orders, your details. Create an account for a shopping experience that feels a little easier."}
        </p>
      </div>

      <div
        className="mt-7 sm:mt-9"
        onFocusCapture={() => swiperRef.current?.autoplay.stop()}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && automatic) swiperRef.current?.autoplay.start();
        }}
      >
        <Swiper
          key={`${lang}-${reduceMotion}`}
          dir={isArabic ? "rtl" : "ltr"}
          modules={[Autoplay, A11y]}
          slidesPerView="auto"
          spaceBetween={16}
          loop={!reduceMotion}
          speed={reduceMotion ? 0 : 900}
          autoplay={automatic ? { delay: 2800, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
          a11y={{ containerMessage: isArabic ? "مزايا حساب كاب فارما" : "KAB Pharma account benefits" }}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          className="membership-benefits-swiper !overflow-visible !px-4 sm:!px-6 lg:!px-8"
        >
          {(reduceMotion ? benefits : [...benefits, ...benefits]).map((benefit, index) => (
            <SwiperSlide key={`${benefit.id}-${index}`} className="!h-auto !w-[min(340px,calc(100vw-48px))] sm:!w-[410px]">
              <div className="flex h-full min-h-[132px] items-center gap-4 rounded-xl border border-[#e8ede8] bg-white px-4 py-5 shadow-[0_4px_18px_rgba(20,32,25,0.045)] sm:min-h-[144px] sm:gap-5 sm:px-5">
                <Image src={benefit.image} width={88} height={88} alt="" className="h-[76px] w-[76px] shrink-0 rounded-lg sm:h-[88px] sm:w-[88px]" />
                <p className="text-sm leading-6 text-[#526058] sm:text-[15px] sm:leading-7">{isArabic ? benefit.ar : benefit.en}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="mx-auto mt-8 flex max-w-[1440px] flex-col items-center gap-4 px-4 sm:mt-10 sm:px-6 lg:px-8">
        <Link href="/signup" className="inline-flex min-h-11 w-full max-w-[340px] items-center justify-center rounded-full border border-[#142019] bg-transparent px-7 py-2.5 text-sm font-semibold text-[#142019] transition hover:bg-[#142019] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a583b] focus-visible:ring-offset-4">
          {isArabic ? "إنشاء حسابي" : "Create My Account"}
        </Link>
        <p className="text-center text-xs leading-6 text-[#647168] sm:text-sm">
          {isArabic ? "لديك حساب بالفعل؟ " : "Already have an account? "}
          <Link href="/login" className="underline underline-offset-4 transition hover:text-[#0a583b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a583b]">{isArabic ? "تسجيل الدخول" : "Log in"}</Link>
        </p>
        {!reduceMotion && <button type="button" onClick={togglePlayback} aria-pressed={paused} className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-[11px] text-[#647168] transition hover:bg-[#edf3ed] hover:text-[#142019] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a583b]">
          {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
          {paused ? (isArabic ? "تشغيل الحركة" : "Play carousel") : (isArabic ? "إيقاف الحركة مؤقتاً" : "Pause carousel")}
        </button>}
      </div>
    </section>
  );
}
