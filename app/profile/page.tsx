"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  FaBoxOpen,
  FaChevronDown,
  FaChevronRight,
  FaFileContract,
  FaGlobe,
  FaHeadset,
  FaShieldAlt,
  FaSignOutAlt,
  FaUndoAlt,
  FaUserCircle,
} from "react-icons/fa";

import { useLanguage } from "../../context/LanguageContext";

type KabUser = {
  full_name: string;
  phone: string;
};

export default function ProfilePage() {
  const { lang, setLang } =
    useLanguage();

  const [user, setUser] =
    useState<KabUser | null>(null);

  const [pageReady, setPageReady] =
    useState(false);

  const [
    policiesOpen,
    setPoliciesOpen,
  ] = useState(false);

  const isArabic = lang === "ar";

  useEffect(() => {
    const savedUser =
      localStorage.getItem("kab_user");

    if (savedUser) {
      try {
        const parsedUser =
          JSON.parse(
            savedUser
          ) as KabUser;

        setUser(parsedUser);
      } catch (error) {
        console.error(
          "Failed to read saved user:",
          error
        );

        localStorage.removeItem(
          "kab_user"
        );
      }
    }

    setPageReady(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem(
      "kab_user"
    );

    setUser(null);

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }

  const profileInitial =
    user?.full_name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "";

  const accountLinkClass =
    "group flex items-center justify-between gap-5 border-t border-[#e5eae6] py-6 transition duration-200 hover:border-[#b8cbbf] sm:py-7";

  const sidebarLinkClass =
    "group flex min-h-12 items-center justify-between gap-4 rounded-xl px-3 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white";

  const policyLinkClass =
    "group flex items-center justify-between gap-5 border-b border-[#edf0ed] py-5 transition last:border-b-0 hover:ps-2";

  if (!pageReady) {
    return (
      <main className="min-h-screen bg-[#f7f7f3]">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[1.75rem] border border-[#e4e8e4] bg-white">
            <div className="grid lg:grid-cols-[310px_minmax(0,1fr)]">
              <div className="h-[260px] animate-pulse bg-[#0a583b]/90 lg:h-[680px]" />

              <div className="space-y-6 p-6 sm:p-10 lg:p-14">
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
        isArabic
          ? "[font-family:Tahoma,Arial,sans-serif]"
          : ""
      }`}
    >
      <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        {/* Editorial heading */}
        <header
          className={`mb-7 sm:mb-9 ${
            isArabic
              ? "text-right"
              : "text-left"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#0a583b]" />

            <p
              className={`text-[10px] font-extrabold uppercase text-[#0a583b] sm:text-[11px] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.2em]"
              }`}
            >
              KAB Pharma
            </p>
          </div>

          <h1
            className={`mt-4 text-3xl font-extrabold text-[#142019] sm:text-4xl lg:text-[2.8rem] ${
              isArabic
                ? "tracking-normal"
                : "tracking-[-0.045em]"
            }`}
          >
            {isArabic
              ? "حسابي"
              : "My account"}
          </h1>
        </header>

        {/* Main account shell */}
        <div className="overflow-hidden rounded-[1.75rem] border border-[#dde4df] bg-white shadow-[0_25px_80px_rgba(20,32,25,0.06)] lg:rounded-[2rem]">
          <div className="grid lg:grid-cols-[310px_minmax(0,1fr)]">
            {/* Account navigation rail */}
            <aside className="relative overflow-hidden bg-[#073f2c] text-white">
              <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

              <div className="relative flex h-full flex-col p-5 sm:p-7 lg:min-h-[680px] lg:p-8">
                <p
                  className={`text-[10px] font-extrabold uppercase text-white/55 ${
                    isArabic
                      ? "tracking-normal"
                      : "tracking-[0.2em]"
                  }`}
                >
                  {isArabic
                    ? "مركز الحساب"
                    : "Account center"}
                </p>

                {/* User identity */}
                <div className="mt-7 flex items-center gap-4 lg:mt-10 lg:block">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl font-extrabold uppercase backdrop-blur lg:h-16 lg:w-16 lg:text-2xl">
                    {user ? (
                      profileInitial
                    ) : (
                      <FaUserCircle />
                    )}
                  </div>

                  {user ? (
                    <div className="min-w-0 lg:mt-5">
                      <p className="text-xs font-bold text-white/55">
                        {isArabic
                          ? "تم تسجيل الدخول باسم"
                          : "Signed in as"}
                      </p>

                      <h2 className="mt-1 truncate text-lg font-extrabold text-white lg:text-xl">
                        {user.full_name}
                      </h2>

                      <p
                        dir="ltr"
                        className={`mt-1 text-xs font-medium text-white/60 ${
                          isArabic
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        +
                        {user.phone.replace(
                          /^\+/,
                          ""
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="min-w-0 lg:mt-5">
                      <p className="text-xs font-bold text-white/55">
                        {isArabic
                          ? "حساب كاب فارما"
                          : "KAB Pharma account"}
                      </p>

                      <h2 className="mt-1 text-lg font-extrabold text-white lg:text-xl">
                        {isArabic
                          ? "أهلاً بك"
                          : "Welcome"}
                      </h2>
                    </div>
                  )}
                </div>

                {/* Account navigation */}
                <nav
                  aria-label={
                    isArabic
                      ? "روابط الحساب"
                      : "Account navigation"
                  }
                  className="mt-7 border-t border-white/15 pt-4 lg:mt-9"
                >
                  <Link
                    href="/orders"
                    className={sidebarLinkClass}
                  >
                    <span className="flex items-center gap-3">
                      <FaBoxOpen className="text-white/60 transition group-hover:text-white" />

                      {isArabic
                        ? "طلباتي"
                        : "My orders"}
                    </span>

                    <FaChevronRight
                      className={`text-[11px] text-white/35 transition group-hover:text-white ${
                        isArabic
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </Link>

                  <Link
                    href="/contact"
                    className={sidebarLinkClass}
                  >
                    <span className="flex items-center gap-3">
                      <FaHeadset className="text-white/60 transition group-hover:text-white" />

                      {isArabic
                        ? "خدمة العملاء"
                        : "Customer care"}
                    </span>

                    <FaChevronRight
                      className={`text-[11px] text-white/35 transition group-hover:text-white ${
                        isArabic
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </Link>
                </nav>

                {/* Sidebar footer */}
                <div className="mt-7 space-y-5 border-t border-white/15 pt-5 lg:mt-auto">
                  {/* Minimal language switch */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-white/55">
                      <FaGlobe />

                      <span>
                        {isArabic
                          ? "اللغة"
                          : "Language"}
                      </span>
                    </div>

                    <div
                      dir="ltr"
                      className="flex items-center gap-3 text-xs font-extrabold"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setLang("en")
                        }
                        aria-pressed={
                          lang === "en"
                        }
                        className={`border-b pb-1 transition ${
                          lang === "en"
                            ? "border-white text-white"
                            : "border-transparent text-white/45 hover:text-white"
                        }`}
                      >
                        EN
                      </button>

                      <span className="text-white/20">
                        /
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setLang("ar")
                        }
                        aria-pressed={
                          lang === "ar"
                        }
                        className={`border-b pb-1 transition ${
                          lang === "ar"
                            ? "border-white text-white"
                            : "border-transparent text-white/45 hover:text-white"
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
                      className="flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-white"
                    >
                      <FaSignOutAlt />

                      <span>
                        {isArabic
                          ? "تسجيل الخروج"
                          : "Sign out"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* Main account content */}
            <div className="min-w-0 p-5 sm:p-8 lg:p-12 xl:p-14">
             
              {user ? (
                /* Signed-in actions */
                <section>
                  <Link
                    href="/orders"
                    className={accountLinkClass}
                  >
                    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dbe5de] bg-[#f3f7f4] text-[#0a583b] sm:h-12 sm:w-12">
                        <FaBoxOpen />
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-[#142019] sm:text-xl">
                          {isArabic
                            ? "طلباتي"
                            : "My orders"}
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
                        className={
                          isArabic
                            ? "rotate-180"
                            : ""
                        }
                      />
                    </div>
                  </Link>

                  <Link
                    href="/contact"
                    className={`${accountLinkClass} border-b`}
                  >
                    <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dbe5de] bg-[#f3f7f4] text-[#0a583b] sm:h-12 sm:w-12">
                        <FaHeadset />
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-[#142019] sm:text-xl">
                          {isArabic
                            ? "خدمة العملاء"
                            : "Customer care"}
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
                        className={
                          isArabic
                            ? "rotate-180"
                            : ""
                        }
                      />
                    </div>
                  </Link>
                </section>
              ) : (
                /* Guest account introduction */
                <section className="border border-[#e3e6df] bg-[#f5f3ed] p-5 sm:p-8">
                  <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-xl">
                      <p
                        className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${
                          isArabic
                            ? "tracking-normal"
                            : "tracking-[0.18em]"
                        }`}
                      >
                        {isArabic
                          ? "مزايا الحساب"
                          : "Account benefits"}
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
                            {isArabic
                              ? "متابعة الطلبات"
                              : "Track orders"}
                          </p>
                        </div>

                        <div className="border-t border-[#d8ddd5] pt-3">
                          <span className="text-xs font-extrabold text-[#0a583b]">
                            02
                          </span>

                          <p className="mt-2 text-sm font-bold text-[#526057]">
                            {isArabic
                              ? "حفظ البيانات"
                              : "Save details"}
                          </p>
                        </div>

                        <div className="border-t border-[#d8ddd5] pt-3">
                          <span className="text-xs font-extrabold text-[#0a583b]">
                            03
                          </span>

                          <p className="mt-2 text-sm font-bold text-[#526057]">
                            {isArabic
                              ? "كتابة التقييمات"
                              : "Write reviews"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                      <Link
                        href="/signup"
                        className="inline-flex min-h-12 items-center justify-center bg-[#0a583b] px-7 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
                      >
                        {isArabic
                          ? "إنشاء حساب"
                          : "Create account"}
                      </Link>

                      <Link
                        href="/login"
                        className="inline-flex min-h-12 items-center justify-center border border-[#0a583b] bg-transparent px-7 text-sm font-extrabold text-[#0a583b] transition hover:bg-[#0a583b] hover:text-white"
                      >
                        {isArabic
                          ? "تسجيل الدخول"
                          : "Sign in"}
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              {/* Policies */}
              <section className="mt-11 sm:mt-14">
                <div>
                  <p
                    className={`text-[10px] font-extrabold uppercase text-[#0a583b] ${
                      isArabic
                        ? "tracking-normal"
                        : "tracking-[0.18em]"
                    }`}
                  >
                    {isArabic
                      ? "المساعدة والمعلومات"
                      : "Help & information"}
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-[#142019]">
                    {isArabic
                      ? "السياسات"
                      : "Policies"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPoliciesOpen(
                      (current) => !current
                    )
                  }
                  aria-expanded={policiesOpen}
                  aria-controls="profile-policies"
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
                        policiesOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </div>
                </button>

                <div
                  id="profile-policies"
                  className={`grid transition-all duration-300 ease-in-out ${
                    policiesOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <nav
                      aria-label={
                        isArabic
                          ? "روابط السياسات"
                          : "Policy links"
                      }
                      className="pt-2"
                    >
                      <Link
                        href="/privacy-policy"
                        className={policyLinkClass}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <FaShieldAlt className="shrink-0 text-[#0a583b]" />

                          <div>
                            <h3 className="font-extrabold text-[#142019]">
                              {isArabic
                                ? "سياسة الخصوصية"
                                : "Privacy policy"}
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
                            isArabic
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </Link>

                      <Link
                        href="/terms"
                        className={policyLinkClass}
                      >
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
                            isArabic
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </Link>

                      <Link
                        href="/refund-policy"
                        className={policyLinkClass}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <FaUndoAlt className="shrink-0 text-[#0a583b]" />

                          <div>
                            <h3 className="font-extrabold text-[#142019]">
                              {isArabic
                                ? "سياسة الاسترجاع"
                                : "Refund policy"}
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
                            isArabic
                              ? "rotate-180"
                              : ""
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