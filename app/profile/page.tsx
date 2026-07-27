"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  FaBoxOpen,
  FaChevronDown,
  FaChevronRight,
  FaFileContract,
  FaGlobe,
  FaHeadset,
  FaHeart,
  FaShieldAlt,
  FaSignOutAlt,
  FaUndoAlt,
} from "react-icons/fa";

import { useLanguage } from "../../context/LanguageContext";

type KabUser = {
  full_name: string;
  phone: string;
};

type ProfileLogoStageProps = {
  compact?: boolean;
  isArabic: boolean;
};

function ProfileLogoStage({
  compact = false,
  isArabic,
}: ProfileLogoStageProps) {
  return (
    <div className={compact ? "shrink-0" : "w-full"}>
      <div
        role="img"
        aria-label={
          isArabic
            ? "شعار كاب فارما ثلاثي الأبعاد يدور تلقائياً."
            : "Automatically rotating 3D KAB Pharma logo."
        }
        className={`relative isolate overflow-visible ${
          compact ? "h-[112px] w-[112px]" : "aspect-square w-full"
        }`}
        style={{
          perspective: "1100px",
        }}
      >
        <div
          aria-hidden="true"
          className="profile-logo-spinner absolute inset-[2%] transform-gpu"
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src="/profile-kab-3d-transparent.png"
            alt=""
            fill
            draggable={false}
            priority={!compact}
            sizes={compact ? "112px" : "280px"}
            className="pointer-events-none object-contain"
            style={{
              backfaceVisibility: "hidden",
              transform: "translateZ(13px)",
            }}
          />

          <Image
            src="/profile-kab-3d-transparent.png"
            alt=""
            fill
            draggable={false}
            sizes={compact ? "112px" : "280px"}
            className="pointer-events-none object-contain"
            style={{
              backfaceVisibility: "hidden",
              filter: "brightness(0.88) saturate(1.06)",
              transform: "rotateY(180deg) translateZ(13px)",
            }}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[5%] left-[16%] right-[16%] h-[9%] rounded-full bg-[#0a583b]/15 blur-lg"
        />
      </div>

      <style jsx>{`
        @keyframes profile-logo-spin {
          from {
            transform: rotateY(0deg);
          }

          to {
            transform: rotateY(360deg);
          }
        }

        .profile-logo-spinner {
          animation: profile-logo-spin 24s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .profile-logo-spinner {
            animation: none;
            transform: rotateY(-12deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function ProfilePage() {
  const { lang, setLang } = useLanguage();

  const [user, setUser] = useState<KabUser | null>(null);

  const [pageReady, setPageReady] = useState(false);

  const [policiesOpen, setPoliciesOpen] = useState(false);

  const isArabic = lang === "ar";

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/customer/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          localStorage.removeItem("kab_user");
          return;
        }

        const result = await response.json();

        if (!result.authenticated || !result.user) {
          localStorage.removeItem("kab_user");
          return;
        }

        const verifiedUser: KabUser = {
          full_name: result.user.full_name,
          phone: result.user.phone,
        };

        localStorage.setItem(
          "kab_user",
          JSON.stringify({
            id: result.user.id,
            ...verifiedUser,
          }),
        );

        if (!cancelled) {
          setUser(verifiedUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setPageReady(true);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch("/api/customer/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      localStorage.removeItem("kab_user");

      setUser(null);

      window.dispatchEvent(new Event("cartUpdated"));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch {
      window.alert(
        isArabic
          ? "تعذر تسجيل الخروج. يرجى المحاولة مرة أخرى."
          : "Could not sign out. Please try again.",
      );
    }
  }

  const accountLinkClass =
    "group flex items-center justify-between gap-5 border-t border-[#e5eae6] py-6 transition duration-200 hover:border-[#b8cbbf] sm:py-7";

  const sidebarLinkClass =
    "group flex min-h-12 items-center justify-between gap-4 rounded-xl px-3 py-3 text-sm font-bold text-[#38473e] transition hover:bg-[#0a583b]/[0.08] hover:text-[#073f2c]";

  const policyLinkClass =
    "group flex items-center justify-between gap-5 border-b border-[#edf0ed] py-5 transition last:border-b-0 hover:ps-2";

  const mobileActionClass =
    "group flex min-h-[76px] items-center justify-between gap-4 px-4 py-3.5 transition active:bg-[#f3f6f4]";

  const mobilePolicyLinkClass =
    "group flex min-h-[64px] items-center justify-between gap-4 border-t border-[#edf0ed] px-4 py-3.5 transition active:bg-[#f3f6f4]";

  if (!pageReady) {
    return (
      <main className="min-h-screen bg-[#f7f7f3]">
        {/* Mobile skeleton */}
        <div className="mx-auto max-w-md px-4 py-5 lg:hidden">
          <div className="h-[190px] animate-pulse rounded-[1.5rem] bg-[#e5ded2]" />

          <div className="mt-4 h-[152px] animate-pulse rounded-[1.25rem] bg-white" />

          <div className="mt-4 h-[76px] animate-pulse rounded-[1.25rem] bg-white" />

          <div className="mt-4 h-[76px] animate-pulse rounded-[1.25rem] bg-white" />
        </div>

        {/* Desktop skeleton */}
        <div className="mx-auto hidden max-w-[1360px] px-4 py-10 sm:px-6 lg:block lg:px-8">
          <div className="overflow-hidden rounded-[1.75rem] border border-[#e4e8e4] bg-white">
            <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="h-[760px] animate-pulse bg-[#e5ded2]" />

              <div className="space-y-6 p-14">
                <div className="h-4 w-28 animate-pulse rounded-full bg-[#edf0ed]" />

                <div className="h-12 max-w-md animate-pulse rounded-xl bg-[#edf0ed]" />

                <div className="h-5 max-w-xl animate-pulse rounded-lg bg-[#f3f5f3]" />

                <div className="mt-12 h-24 animate-pulse border-y border-[#edf0ed] bg-[#fafbfa]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className={`min-h-screen bg-[#f7f7f3] pb-20 ${
        isArabic ? "[font-family:var(--font-arabic)]" : ""
      }`}
    >
      {/* Mobile layout */}
      <div className="mx-auto max-w-md px-4 pb-10 pt-4 lg:hidden">
        {/* Account comes first */}
        {user ? (
          <section className="relative overflow-hidden rounded-[1.5rem] border border-[#d9d2c7] bg-[#eee8de] p-5 text-[#142019] shadow-[0_14px_35px_rgba(20,32,25,0.09)]">
            <div className="absolute -end-12 -top-16 h-40 w-40 rounded-full bg-[#0a583b]/[0.06]" />

            <div className="relative flex items-center gap-4">
              <ProfileLogoStage compact isArabic={isArabic} />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#6d786f]">
                  {isArabic ? "تم تسجيل الدخول باسم" : "Signed in as"}
                </p>

                <h1 className="mt-1 truncate text-xl font-extrabold">
                  {user.full_name}
                </h1>

                <p
                  dir="ltr"
                  className={`mt-1 text-xs text-[#66736b] ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  +{user.phone.replace(/^\+/, "")}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-[1.5rem] border border-[#d9d2c7] bg-[#eee8de] p-5 text-[#142019] shadow-[0_14px_35px_rgba(20,32,25,0.09)]">
            <div className="absolute -end-12 -top-16 h-40 w-40 rounded-full bg-[#0a583b]/[0.06]" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <ProfileLogoStage compact isArabic={isArabic} />

                <div>
                  <h1 className="text-xl font-extrabold">
                    {isArabic ? "حسابي" : "My account"}
                  </h1>

                  <p className="mt-1 text-xs leading-5 text-[#66736b]">
                    {isArabic
                      ? "سجّل دخولك لمتابعة طلباتك."
                      : "Sign in to view and track your orders."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Link
                  href="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0a583b] px-4 text-sm font-extrabold text-white transition active:scale-[0.98]"
                >
                  {isArabic ? "تسجيل الدخول" : "Sign in"}
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0a583b] bg-transparent px-4 text-center text-sm font-extrabold text-[#0a583b] transition active:scale-[0.98] active:bg-[#0a583b]/[0.07]"
                >
                  {isArabic ? "إنشاء حساب" : "Create account"}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Main actions */}
        <nav
          aria-label={isArabic ? "روابط الحساب" : "Account links"}
          className="mt-4 divide-y divide-[#edf0ed] overflow-hidden rounded-[1.25rem] border border-[#e2e7e3] bg-white"
        >
          <Link href="/orders" className={mobileActionClass}>
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <FaBoxOpen />
              </div>

              <span className="font-extrabold text-[#142019]">
                {isArabic ? "طلباتي" : "My orders"}
              </span>
            </div>

            <FaChevronRight
              className={`shrink-0 text-xs text-[#96a098] transition group-active:text-[#0a583b] ${
                isArabic ? "rotate-180" : ""
              }`}
            />
          </Link>

          <Link href="/wishlist" className={mobileActionClass}>
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <FaHeart />
              </div>

              <span className="font-extrabold text-[#142019]">
                {isArabic ? "قائمة المفضلة" : "Wishlist"}
              </span>
            </div>

            <FaChevronRight
              className={`shrink-0 text-xs text-[#96a098] transition group-active:text-[#0a583b] ${
                isArabic ? "rotate-180" : ""
              }`}
            />
          </Link>

          <Link href="/contact" className={mobileActionClass}>
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <FaHeadset />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#142019]">
                  {isArabic ? "خدمة العملاء" : "Customer care"}
                </span>

                <span className="h-2 w-2 rounded-full bg-[#22a66f]" />
              </div>
            </div>

            <FaChevronRight
              className={`shrink-0 text-xs text-[#96a098] transition group-active:text-[#0a583b] ${
                isArabic ? "rotate-180" : ""
              }`}
            />
          </Link>
        </nav>

        {/* Language */}
        <section className="mt-4 flex min-h-[76px] items-center justify-between gap-4 rounded-[1.25rem] border border-[#e2e7e3] bg-white px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <FaGlobe />
            </div>

            <span className="font-extrabold text-[#142019]">
              {isArabic ? "اللغة" : "Language"}
            </span>
          </div>

          <div dir="ltr" className="flex rounded-full bg-[#f1f4f2] p-1">
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`flex h-9 min-w-12 items-center justify-center rounded-full px-3 text-xs font-extrabold transition ${
                lang === "en"
                  ? "bg-[#0a583b] text-white shadow-sm"
                  : "text-[#647168]"
              }`}
            >
              EN
            </button>

            <button
              type="button"
              onClick={() => setLang("ar")}
              aria-pressed={lang === "ar"}
              className={`flex h-9 min-w-12 items-center justify-center rounded-full px-3 text-xs font-extrabold transition ${
                lang === "ar"
                  ? "bg-[#0a583b] text-white shadow-sm"
                  : "text-[#647168]"
              }`}
            >
              AR
            </button>
          </div>
        </section>

        {/* Mobile policies */}
        <section className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#e2e7e3] bg-white">
          <button
            type="button"
            onClick={() => setPoliciesOpen((current) => !current)}
            aria-expanded={policiesOpen}
            aria-controls="mobile-profile-policies"
            className="flex min-h-[76px] w-full items-center justify-between gap-4 px-4 py-3.5 text-start transition active:bg-[#f3f6f4]"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <FaFileContract />
              </div>

              <span className="font-extrabold text-[#142019]">
                {isArabic ? "السياسات والمعلومات" : "Policies & information"}
              </span>
            </div>

            <FaChevronDown
              className={`shrink-0 text-xs text-[#96a098] transition-transform duration-300 ${
                policiesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            id="mobile-profile-policies"
            className={`grid transition-all duration-300 ease-in-out ${
              policiesOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <nav aria-label={isArabic ? "روابط السياسات" : "Policy links"}>
                <Link href="/privacy-policy" className={mobilePolicyLinkClass}>
                  <div className="flex items-center gap-3.5">
                    <FaShieldAlt className="shrink-0 text-[#0a583b]" />

                    <span className="text-sm font-bold text-[#526057]">
                      {isArabic ? "سياسة الخصوصية" : "Privacy policy"}
                    </span>
                  </div>

                  <FaChevronRight
                    className={`shrink-0 text-[10px] text-[#99a29c] ${
                      isArabic ? "rotate-180" : ""
                    }`}
                  />
                </Link>

                <Link href="/terms" className={mobilePolicyLinkClass}>
                  <div className="flex items-center gap-3.5">
                    <FaFileContract className="shrink-0 text-[#0a583b]" />

                    <span className="text-sm font-bold text-[#526057]">
                      {isArabic ? "الشروط والأحكام" : "Terms & conditions"}
                    </span>
                  </div>

                  <FaChevronRight
                    className={`shrink-0 text-[10px] text-[#99a29c] ${
                      isArabic ? "rotate-180" : ""
                    }`}
                  />
                </Link>

                <Link href="/refund-policy" className={mobilePolicyLinkClass}>
                  <div className="flex items-center gap-3.5">
                    <FaUndoAlt className="shrink-0 text-[#0a583b]" />

                    <span className="text-sm font-bold text-[#526057]">
                      {isArabic ? "سياسة الاسترجاع" : "Refund policy"}
                    </span>
                  </div>

                  <FaChevronRight
                    className={`shrink-0 text-[10px] text-[#99a29c] ${
                      isArabic ? "rotate-180" : ""
                    }`}
                  />
                </Link>
              </nav>
            </div>
          </div>
        </section>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-[#78837b] transition active:bg-[#e9edea] active:text-[#142019]"
          >
            <FaSignOutAlt />

            <span>{isArabic ? "تسجيل الخروج" : "Sign out"}</span>
          </button>
        )}
      </div>

      {/* Desktop layout — unchanged */}
      <div className="mx-auto hidden max-w-[1360px] px-4 pb-10 pt-8 sm:px-6 lg:block lg:px-8 lg:pt-12">
        <header className={`mb-9 ${isArabic ? "text-right" : "text-left"}`}>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#0a583b]" />

            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic ? "tracking-normal" : "tracking-[0.2em]"
              }`}
            >
              KAB Pharma
            </p>
          </div>

          <h1
            className={`mt-4 text-[2.8rem] font-extrabold text-[#142019] ${
              isArabic ? "tracking-normal" : "tracking-[-0.045em]"
            }`}
          >
            {isArabic ? "حسابي" : "My account"}
          </h1>
        </header>

        <div className="overflow-hidden rounded-[2rem] border border-[#dde4df] bg-white shadow-[0_25px_80px_rgba(20,32,25,0.06)]">
          <div className="grid grid-cols-[340px_minmax(0,1fr)]">
            <aside className="relative overflow-hidden bg-[#eee8de] text-[#142019]">
              <div className="absolute inset-x-0 top-0 h-px bg-[#0a583b]/20" />

              <div className="relative flex min-h-[760px] h-full flex-col p-8">
                <p
                  className={`text-[10px] font-extrabold uppercase text-[#637168] ${
                    isArabic ? "tracking-normal" : "tracking-[0.2em]"
                  }`}
                >
                  {isArabic ? "مركز الحساب" : "Account center"}
                </p>

                <div className="mt-7 block">
                  <ProfileLogoStage isArabic={isArabic} />

                  {user ? (
                    <div className="mt-6 min-w-0">
                      <p className="text-xs font-bold text-[#6d786f]">
                        {isArabic ? "تم تسجيل الدخول باسم" : "Signed in as"}
                      </p>

                      <h2 className="mt-1 truncate text-xl font-extrabold text-[#142019]">
                        {user.full_name}
                      </h2>

                      <p
                        dir="ltr"
                        className={`mt-1 text-xs font-medium text-[#66736b] ${
                          isArabic ? "text-right" : "text-left"
                        }`}
                      >
                        +{user.phone.replace(/^\+/, "")}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 min-w-0">
                      <p className="text-xs font-bold text-[#6d786f]">
                        {isArabic ? "حساب كاب فارما" : "KAB Pharma account"}
                      </p>

                      <h2 className="mt-1 text-xl font-extrabold text-[#142019]">
                        {isArabic ? "أهلاً بك" : "Welcome"}
                      </h2>
                    </div>
                  )}
                </div>

                <nav
                  aria-label={isArabic ? "روابط الحساب" : "Account navigation"}
                  className="mt-9 border-t border-[#0a583b]/15 pt-4"
                >
                  <Link href="/orders" className={sidebarLinkClass}>
                    <span className="flex items-center gap-3">
                      <FaBoxOpen className="text-[#718077] transition group-hover:text-[#073f2c]" />

                      {isArabic ? "طلباتي" : "My orders"}
                    </span>

                    <FaChevronRight
                      className={`text-[11px] text-[#8b958e] transition group-hover:text-[#073f2c] ${
                        isArabic ? "rotate-180" : ""
                      }`}
                    />
                  </Link>

                  <Link href="/wishlist" className={sidebarLinkClass}>
                    <span className="flex items-center gap-3">
                      <FaHeart className="text-[#718077] transition group-hover:text-[#073f2c]" />

                      {isArabic ? "قائمة المفضلة" : "Wishlist"}
                    </span>

                    <FaChevronRight
                      className={`text-[11px] text-[#8b958e] transition group-hover:text-[#073f2c] ${
                        isArabic ? "rotate-180" : ""
                      }`}
                    />
                  </Link>

                  <Link href="/contact" className={sidebarLinkClass}>
                    <span className="flex items-center gap-3">
                      <FaHeadset className="text-[#718077] transition group-hover:text-[#073f2c]" />

                      {isArabic ? "خدمة العملاء" : "Customer care"}
                    </span>

                    <FaChevronRight
                      className={`text-[11px] text-[#8b958e] transition group-hover:text-[#073f2c] ${
                        isArabic ? "rotate-180" : ""
                      }`}
                    />
                  </Link>
                </nav>

                <div className="mt-auto space-y-5 border-t border-[#0a583b]/15 pt-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#637168]">
                      <FaGlobe />

                      <span>{isArabic ? "اللغة" : "Language"}</span>
                    </div>

                    <div
                      dir="ltr"
                      className="flex items-center gap-3 text-xs font-extrabold"
                    >
                      <button
                        type="button"
                        onClick={() => setLang("en")}
                        aria-pressed={lang === "en"}
                        className={`border-b pb-1 transition ${
                          lang === "en"
                            ? "border-[#0a583b] text-[#0a583b]"
                            : "border-transparent text-[#7b867f] hover:text-[#0a583b]"
                        }`}
                      >
                        EN
                      </button>

                      <span className="text-[#9aa39d]">/</span>

                      <button
                        type="button"
                        onClick={() => setLang("ar")}
                        aria-pressed={lang === "ar"}
                        className={`border-b pb-1 transition ${
                          lang === "ar"
                            ? "border-[#0a583b] text-[#0a583b]"
                            : "border-transparent text-[#7b867f] hover:text-[#0a583b]"
                        }`}
                      >
                        AR
                      </button>
                    </div>
                  </div>

                  {user && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-xs font-bold text-[#637168] transition hover:text-[#0a583b]"
                    >
                      <FaSignOutAlt />

                      <span>{isArabic ? "تسجيل الخروج" : "Sign out"}</span>
                    </button>
                  )}
                </div>
              </div>
            </aside>

            <div className="min-w-0 p-12 xl:p-14">
              {user ? (
                <section>
                  <Link href="/orders" className={accountLinkClass}>
                    <div className="flex min-w-0 items-center gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#dbe5de] bg-[#f3f7f4] text-[#0a583b]">
                        <FaBoxOpen />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xl font-extrabold text-[#142019]">
                          {isArabic ? "طلباتي" : "My orders"}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#647168]">
                          {isArabic
                            ? "عرض سجل الطلبات ومتابعة حالة الطلب الحالي."
                            : "View your order history and follow the status of current orders."}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfe5e1] text-xs text-[#647168] transition group-hover:border-[#0a583b] group-hover:bg-[#0a583b] group-hover:text-white">
                      <FaChevronRight
                        className={isArabic ? "rotate-180" : ""}
                      />
                    </div>
                  </Link>

                  <Link href="/wishlist" className={accountLinkClass}>
                    <div className="flex min-w-0 items-center gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#dbe5de] bg-[#f3f7f4] text-[#0a583b]">
                        <FaHeart />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xl font-extrabold text-[#142019]">
                          {isArabic ? "قائمة المفضلة" : "Wishlist"}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#647168]">
                          {isArabic
                            ? "العودة إلى المنتجات التي حفظتها ومتابعة التسوق."
                            : "Return to saved products and continue shopping."}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfe5e1] text-xs text-[#647168] transition group-hover:border-[#0a583b] group-hover:bg-[#0a583b] group-hover:text-white">
                      <FaChevronRight
                        className={isArabic ? "rotate-180" : ""}
                      />
                    </div>
                  </Link>

                  <Link
                    href="/contact"
                    className={`${accountLinkClass} border-b`}
                  >
                    <div className="flex min-w-0 items-center gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#dbe5de] bg-[#f3f7f4] text-[#0a583b]">
                        <FaHeadset />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xl font-extrabold text-[#142019]">
                          {isArabic ? "خدمة العملاء" : "Customer care"}
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#647168]">
                          {isArabic
                            ? "نحن هنا لمساعدتك في المنتجات والطلبات وأي استفسار."
                            : "Get help with products, orders, or anything else you need."}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfe5e1] text-xs text-[#647168] transition group-hover:border-[#0a583b] group-hover:bg-[#0a583b] group-hover:text-white">
                      <FaChevronRight
                        className={isArabic ? "rotate-180" : ""}
                      />
                    </div>
                  </Link>
                </section>
              ) : (
                <section className="border border-[#e3e6df] bg-[#f5f3ed] p-8">
                  <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-xl">
                      <p
                        className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${
                          isArabic ? "tracking-normal" : "tracking-[0.18em]"
                        }`}
                      >
                        {isArabic ? "مزايا الحساب" : "Account benefits"}
                      </p>

                      <h3 className="mt-3 text-2xl font-extrabold text-[#142019]">
                        {isArabic
                          ? "تجربة تسوق أسهل"
                          : "A better shopping experience"}
                      </h3>

                      <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="border-t border-[#d8ddd5] pt-3">
                          <span className="text-xs font-extrabold text-[#0a583b]">
                            01
                          </span>

                          <p className="mt-2 text-sm font-bold text-[#526057]">
                            {isArabic ? "متابعة الطلبات" : "Track orders"}
                          </p>
                        </div>

                        <div className="border-t border-[#d8ddd5] pt-3">
                          <span className="text-xs font-extrabold text-[#0a583b]">
                            02
                          </span>

                          <p className="mt-2 text-sm font-bold text-[#526057]">
                            {isArabic ? "حفظ البيانات" : "Save details"}
                          </p>
                        </div>

                        <div className="border-t border-[#d8ddd5] pt-3">
                          <span className="text-xs font-extrabold text-[#0a583b]">
                            03
                          </span>

                          <p className="mt-2 text-sm font-bold text-[#526057]">
                            {isArabic ? "كتابة التقييمات" : "Write reviews"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 xl:flex-row">
                      <Link
                        href="/signup"
                        className="inline-flex min-h-12 items-center justify-center bg-[#0a583b] px-7 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
                      >
                        {isArabic ? "إنشاء حساب" : "Create account"}
                      </Link>

                      <Link
                        href="/login"
                        className="inline-flex min-h-12 items-center justify-center border border-[#0a583b] bg-transparent px-7 text-sm font-extrabold text-[#0a583b] transition hover:bg-[#0a583b] hover:text-white"
                      >
                        {isArabic ? "تسجيل الدخول" : "Sign in"}
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              <section className="mt-11 sm:mt-14">
                <div>
                  <p
                    className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${
                      isArabic ? "tracking-normal" : "tracking-[0.18em]"
                    }`}
                  >
                    {isArabic ? "المساعدة والمعلومات" : "Help & information"}
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-[#142019]">
                    {isArabic ? "السياسات" : "Policies"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setPoliciesOpen((current) => !current)}
                  aria-expanded={policiesOpen}
                  aria-controls="desktop-profile-policies"
                  className="group mt-6 flex w-full items-center justify-between gap-5 border-y border-[#dfe5e1] py-5 text-start"
                >
                  <div>
                    <h3 className="font-extrabold text-[#142019]">
                      {isArabic
                        ? "سياسات ومعلومات الموقع"
                        : "Website policies & information"}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-[#647168]">
                      {isArabic
                        ? "الخصوصية، الشروط وسياسة الاسترجاع."
                        : "Privacy, terms, and refund information."}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dfe5e1] text-xs text-[#647168] transition group-hover:border-[#0a583b] group-hover:text-[#0a583b]">
                    <FaChevronDown
                      className={`transition-transform duration-300 ${
                        policiesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                <div
                  id="desktop-profile-policies"
                  className={`grid transition-all duration-300 ease-in-out ${
                    policiesOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <nav
                      aria-label={isArabic ? "روابط السياسات" : "Policy links"}
                      className="pt-2"
                    >
                      <Link href="/privacy-policy" className={policyLinkClass}>
                        <div className="flex min-w-0 items-center gap-4">
                          <FaShieldAlt className="shrink-0 text-[#0a583b]" />

                          <div>
                            <h3 className="font-extrabold text-[#142019]">
                              {isArabic ? "سياسة الخصوصية" : "Privacy policy"}
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[#647168]">
                              {isArabic
                                ? "كيفية استخدام معلوماتك وحماية بياناتك."
                                : "How your information is used and protected."}
                            </p>
                          </div>
                        </div>

                        <FaChevronRight
                          className={`shrink-0 text-xs text-[#99a29c] transition group-hover:text-[#0a583b] ${
                            isArabic ? "rotate-180" : ""
                          }`}
                        />
                      </Link>

                      <Link href="/terms" className={policyLinkClass}>
                        <div className="flex min-w-0 items-center gap-4">
                          <FaFileContract className="shrink-0 text-[#0a583b]" />

                          <div>
                            <h3 className="font-extrabold text-[#142019]">
                              {isArabic
                                ? "الشروط والأحكام"
                                : "Terms & conditions"}
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[#647168]">
                              {isArabic
                                ? "شروط استخدام الموقع وإتمام الطلبات."
                                : "Website usage and ordering terms."}
                            </p>
                          </div>
                        </div>

                        <FaChevronRight
                          className={`shrink-0 text-xs text-[#99a29c] transition group-hover:text-[#0a583b] ${
                            isArabic ? "rotate-180" : ""
                          }`}
                        />
                      </Link>

                      <Link href="/refund-policy" className={policyLinkClass}>
                        <div className="flex min-w-0 items-center gap-4">
                          <FaUndoAlt className="shrink-0 text-[#0a583b]" />

                          <div>
                            <h3 className="font-extrabold text-[#142019]">
                              {isArabic ? "سياسة الاسترجاع" : "Refund policy"}
                            </h3>

                            <p className="mt-1 text-xs leading-5 text-[#647168]">
                              {isArabic
                                ? "شروط إعادة المنتجات واسترداد المبلغ."
                                : "Product return and refund conditions."}
                            </p>
                          </div>
                        </div>

                        <FaChevronRight
                          className={`shrink-0 text-xs text-[#99a29c] transition group-hover:text-[#0a583b] ${
                            isArabic ? "rotate-180" : ""
                          }`}
                        />
                      </Link>
                    </nav>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}