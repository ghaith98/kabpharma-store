"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Heart,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { getCart } from "@/lib/cart";
import { getWishlist } from "@/lib/wishlist";

import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const {
    lang,
    setLang,
  } = useLanguage();

  const pathname = usePathname();
  const router = useRouter();

  const isArabic = lang === "ar";

  const [cartCount, setCartCount] =
    useState(0);

  const [
    wishlistCount,
    setWishlistCount,
  ] = useState(0);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [scrolled, setScrolled] =
    useState(false);

  const currentYear =
    new Date().getFullYear();

  const text = {
    en: {
      home: "Home",
      products: "Products",
      about: "About us",
      contact: "Contact us",

      orders: "My orders",
      wishlist: "Wishlist",
      cart: "Shopping bag",
      account: "My account",

      privacy: "Privacy policy",
      terms: "Terms & conditions",
      refund: "Refund policy",

      search: "Search products",
      searchPlaceholder:
        "Search KAB Pharma products...",

      openMenu: "Open menu",
      closeMenu: "Close menu",
      closeSearch: "Close search",

      navigation: "Main navigation",
      mobileNavigation:
        "Mobile navigation",

      accountLinks:
        "Account & shopping",

      information:
        "Information",

      language: "Language",

      copyright:
        `© ${currentYear} KAB Pharma`,
    },

    ar: {
      home: "الرئيسية",
      products: "المنتجات",
      about: "عن الشركة",
      contact: "تواصل معنا",

      orders: "طلباتي",
      wishlist: "المفضلة",
      cart: "سلة التسوق",
      account: "حسابي",

      privacy: "سياسة الخصوصية",
      terms: "الشروط والأحكام",
      refund: "سياسة الاسترجاع",

      search: "البحث عن منتج",
      searchPlaceholder:
        "ابحث في منتجات KAB Pharma...",

      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      closeSearch: "إغلاق البحث",

      navigation: "التنقل الرئيسي",
      mobileNavigation:
        "قائمة التنقل",

      accountLinks:
        "الحساب والتسوق",

      information:
        "المعلومات",

      language: "اللغة",

      copyright:
        `© ${currentYear} KAB Pharma`,
    },
  };

  const t =
    text[
      lang as "en" | "ar"
    ];

  const navigationLinks = [
    {
      label: t.home,
      href: "/",
    },
    {
      label: t.products,
      href: "/products",
    },
    {
      label: t.about,
      href: "/about",
    },
    {
      label: t.contact,
      href: "/contact",
    },
  ];

  function updateCartCount() {
    const cart = getCart();

    const total = cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

    setCartCount(total);
  }

  function updateWishlistCount() {
    const wishlist =
      getWishlist();

    setWishlistCount(
      wishlist.length
    );
  }

  function isActive(
    href: string
  ) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(
      href
    );
  }

  function openSearch() {
    setMenuOpen(false);

    if (
      pathname !== "/products"
    ) {
      router.push(
        "/products?openSearch=1"
      );

      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    setQuery(
      params.get("search") || ""
    );

    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");

    if (
      pathname === "/products"
    ) {
      router.replace("/products");
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  useEffect(() => {
    updateCartCount();
    updateWishlistCount();

    window.addEventListener(
      "cartUpdated",
      updateCartCount
    );

    window.addEventListener(
      "wishlistUpdated",
      updateWishlistCount
    );

    window.addEventListener(
      "storage",
      updateCartCount
    );

    window.addEventListener(
      "storage",
      updateWishlistCount
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        updateCartCount
      );

      window.removeEventListener(
        "wishlistUpdated",
        updateWishlistCount
      );

      window.removeEventListener(
        "storage",
        updateCartCount
      );

      window.removeEventListener(
        "storage",
        updateWishlistCount
      );
    };
  }, []);

  /*
    فتح البحث بعد الانتقال
    من أي صفحة إلى المنتجات.
  */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      pathname === "/products" &&
      params.get(
        "openSearch"
      ) === "1"
    ) {
      setQuery(
        params.get("search") || ""
      );

      setSearchOpen(true);

      params.delete(
        "openSearch"
      );

      const cleanUrl =
        params.toString()
          ? `/products?${params.toString()}`
          : "/products";

      router.replace(cleanUrl);
    }
  }, [
    pathname,
    router,
  ]);

  /*
    البحث مع تأخير بسيط.
  */
  useEffect(() => {
    if (
      !searchOpen ||
      pathname !== "/products"
    ) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        const cleanQuery =
          query.trim();

        if (cleanQuery) {
          router.replace(
            `/products?search=${encodeURIComponent(
              cleanQuery
            )}`
          );
        } else {
          router.replace(
            "/products"
          );
        }
      }, 350);

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    query,
    searchOpen,
    pathname,
    router,
  ]);

  /*
    إغلاق القائمة بعد الانتقال.
  */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /*
    تغيير شكل الـNavbar عند Scroll.
  */
  useEffect(() => {
    function handleScroll() {
      setScrolled(
        window.scrollY > 8
      );
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  /*
    منع الصفحة من التحرك خلف
    قائمة الموبايل.
  */
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [menuOpen]);

  /*
    Escape + إخفاء قائمة الموبايل
    عند الوصول لحجم Desktop.
  */
  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key !== "Escape"
      ) {
        return;
      }

      setMenuOpen(false);

      if (searchOpen) {
        setSearchOpen(false);
        setQuery("");

        if (
          pathname === "/products"
        ) {
          router.replace(
            "/products"
          );
        }
      }
    }

    function handleResize() {
      if (
        window.innerWidth >=
        1024
      ) {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [
    searchOpen,
    pathname,
    router,
  ]);

  const desktopIconClass =
    "relative flex h-10 w-10 shrink-0 items-center justify-center bg-transparent text-[#26352d] transition duration-200 hover:bg-[#f1f5f2] hover:text-[#0a583b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8eb19d]";

  const mobileIconClass =
    "relative flex h-10 w-10 shrink-0 items-center justify-center bg-transparent text-[#26352d] transition active:scale-95";

  const mobilePrimaryLinkClass =
    "group flex min-h-[62px] items-center justify-between border-b border-[#e8ece9] text-lg font-extrabold text-[#142019] transition hover:text-[#0a583b]";

  const mobileSecondaryLinkClass =
    "flex min-h-11 items-center justify-between border-b border-[#edf0ed] text-sm font-bold text-[#526057] last:border-b-0 hover:text-[#0a583b]";

  return (
    <>
      <header
        dir="ltr"
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-xl transition-shadow duration-300 ${
          scrolled
            ? "shadow-[0_8px_30px_rgba(20,32,25,0.06)]"
            : ""
        }`}
      >
        <div className="relative border-b border-[#e6ebe7]">
          <div className="mx-auto flex h-[68px] max-w-[1600px] items-center gap-3 px-4 sm:h-[74px] sm:px-6 lg:px-8">
            {/* Logo */}
            <Link
              href="/"
              aria-label="KAB Pharma home"
              className={`shrink-0 items-center ${
                searchOpen
                  ? "hidden sm:flex"
                  : "flex"
              }`}
            >
              <Image
                src="/logo.png"
                alt="KAB Pharma"
                width={220}
                height={53}
                priority
                className="h-[36px] w-auto object-contain sm:h-[41px] lg:h-[42px]"
              />
            </Link>

            {searchOpen ? (
              /* Search mode */
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:ms-auto">
                <form
                  role="search"
                  onSubmit={(
                    event
                  ) => {
                    event.preventDefault();

                    const cleanQuery =
                      query.trim();

                    if (
                      cleanQuery
                    ) {
                      router.replace(
                        `/products?search=${encodeURIComponent(
                          cleanQuery
                        )}`
                      );
                    }
                  }}
                  className="flex min-w-0 flex-1 justify-end"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-[#94aa9c] py-2 sm:max-w-2xl">
                    <Search
                      size={19}
                      strokeWidth={1.8}
                      className="shrink-0 text-[#0a583b]"
                    />

                    <input
                      autoFocus
                      dir={
                        isArabic
                          ? "rtl"
                          : "ltr"
                      }
                      type="search"
                      value={query}
                      onChange={(
                        event
                      ) =>
                        setQuery(
                          event.target
                            .value
                        )
                      }
                      placeholder={
                        t.searchPlaceholder
                      }
                      className={`min-w-0 flex-1 bg-transparent text-base font-medium text-[#142019] outline-none placeholder:text-[#98a39c] ${
                        isArabic
                          ? "[font-family:Tahoma,Arial,sans-serif]"
                          : ""
                      }`}
                    />
                  </div>
                </form>

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label={
                    t.closeSearch
                  }
                  className={
                    desktopIconClass
                  }
                >
                  <X
                    size={20}
                    strokeWidth={1.8}
                  />
                </button>
              </div>
            ) : (
              <>
                {/* Desktop navigation */}
                <nav
                  dir={
                    isArabic
                      ? "rtl"
                      : "ltr"
                  }
                  aria-label={
                    t.navigation
                  }
                  className="hidden min-w-0 flex-1 items-center justify-center lg:flex"
                >
                  <div className="flex items-center gap-7 xl:gap-10">
                    {navigationLinks.map(
                      (item) => {
                        const active =
                          isActive(
                            item.href
                          );

                        return (
                          <Link
                            key={
                              item.href
                            }
                            href={
                              item.href
                            }
                            aria-current={
                              active
                                ? "page"
                                : undefined
                            }
                            className={`group relative flex h-[74px] items-center whitespace-nowrap text-[12px] font-extrabold transition-colors duration-200 ${
                              isArabic
                                ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
                                : "uppercase tracking-[0.1em]"
                            } ${
                              active
                                ? "text-[#0a583b]"
                                : "text-[#26352d] hover:text-[#0a583b]"
                            }`}
                          >
                            {
                              item.label
                            }

                            <span
                              className={`absolute inset-x-0 bottom-0 h-[2px] origin-center bg-[#0a583b] transition-transform duration-300 ${
                                active
                                  ? "scale-x-100"
                                  : "scale-x-0 group-hover:scale-x-100"
                              }`}
                            />
                          </Link>
                        );
                      }
                    )}
                  </div>
                </nav>

                {/* Desktop icons */}
                <div
                  dir="ltr"
                  className="ms-auto hidden shrink-0 items-center gap-1 lg:flex"
                >
                  <button
                    type="button"
                    onClick={
                      openSearch
                    }
                    aria-label={
                      t.search
                    }
                    title={
                      t.search
                    }
                    className={
                      desktopIconClass
                    }
                  >
                    <Search
                      size={19}
                      strokeWidth={1.8}
                    />
                  </button>

                  <Link
                    href="/wishlist"
                    aria-label={
                      t.wishlist
                    }
                    title={
                      t.wishlist
                    }
                    className={
                      desktopIconClass
                    }
                  >
                    <Heart
                      size={19}
                      strokeWidth={1.8}
                    />

                    {wishlistCount >
                      0 && (
                      <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[8px] font-extrabold leading-none text-white">
                        {wishlistCount >
                        99
                          ? "99+"
                          : wishlistCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    aria-label={
                      t.account
                    }
                    title={
                      t.account
                    }
                    className={
                      desktopIconClass
                    }
                  >
                    <UserRound
                      size={19}
                      strokeWidth={1.8}
                    />
                  </Link>

                  <Link
                    href="/cart"
                    aria-label={
                      t.cart
                    }
                    title={t.cart}
                    className={
                      desktopIconClass
                    }
                  >
                    <ShoppingBag
                      size={20}
                      strokeWidth={1.8}
                    />

                    {cartCount >
                      0 && (
                      <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[8px] font-extrabold leading-none text-white">
                        {cartCount >
                        99
                          ? "99+"
                          : cartCount}
                      </span>
                    )}
                  </Link>
                </div>

                {/* Mobile actions */}
                <div
                  dir="ltr"
                  className="ms-auto flex shrink-0 items-center gap-0.5 lg:hidden"
                >
                  <button
                    type="button"
                    onClick={
                      openSearch
                    }
                    aria-label={
                      t.search
                    }
                    className={
                      mobileIconClass
                    }
                  >
                    <Search
                      size={19}
                      strokeWidth={1.8}
                    />
                  </button>

                  <Link
                    href="/wishlist"
                    aria-label={
                      t.wishlist
                    }
                    className={
                      mobileIconClass
                    }
                  >
                    <Heart
                      size={19}
                      strokeWidth={1.8}
                    />

                    {wishlistCount >
                      0 && (
                      <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[8px] font-extrabold leading-none text-white">
                        {wishlistCount >
                        99
                          ? "99+"
                          : wishlistCount}
                      </span>
                    )}
                  </Link>

                  {/* Mobile-only hamburger */}
                  <button
                    type="button"
                    onClick={() =>
                      setMenuOpen(true)
                    }
                    aria-label={
                      t.openMenu
                    }
                    aria-expanded={
                      menuOpen
                    }
                    className="flex h-10 w-11 shrink-0 flex-col items-center justify-center gap-[5px] bg-transparent transition active:scale-95"
                  >
                    <span className="block h-[2px] w-[22px] rounded-full bg-[#142019]" />

                    <span className="block h-[2px] w-[17px] translate-x-[2.5px] rounded-full bg-[#142019]" />

                    <span className="block h-[2px] w-[12px] translate-x-[5px] rounded-full bg-[#142019]" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Subtle KAB scroll accent */}
          <span
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 h-px bg-[#0a583b] transition-opacity duration-300 ${
              scrolled
                ? "opacity-35"
                : "opacity-0"
            }`}
          />
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[999] bg-[#07130d]/40 backdrop-blur-[2px] lg:hidden"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeMenu();
            }
          }}
        >
          <aside
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            aria-label={
              t.mobileNavigation
            }
            className="absolute inset-y-0 right-0 flex w-[88%] max-w-[390px] flex-col overflow-y-auto bg-white shadow-[-18px_0_60px_rgba(7,31,20,0.16)]"
          >
            {/* Menu header */}
            <div
              dir="ltr"
              className="sticky top-0 z-10 flex min-h-[72px] items-center justify-between border-b border-[#e6ebe7] bg-white/95 px-5 backdrop-blur"
            >
              <Link
                href="/"
                onClick={
                  closeMenu
                }
                aria-label="KAB Pharma home"
              >
                <Image
                  src="/logo.png"
                  alt="KAB Pharma"
                  width={190}
                  height={46}
                  className="h-[36px] w-auto object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={
                  closeMenu
                }
                aria-label={
                  t.closeMenu
                }
                className="flex h-10 w-10 items-center justify-center bg-transparent text-[#142019] transition active:scale-95"
              >
                <X
                  size={22}
                  strokeWidth={1.7}
                />
              </button>
            </div>

            <div className="flex flex-1 flex-col px-5">
              {/* Main links */}
              <nav
                aria-label={
                  t.mobileNavigation
                }
                className="pt-3"
              >
                {navigationLinks.map(
                  (item) => (
                    <Link
                      key={
                        item.href
                      }
                      href={
                        item.href
                      }
                      onClick={
                        closeMenu
                      }
                      aria-current={
                        isActive(
                          item.href
                        )
                          ? "page"
                          : undefined
                      }
                      className={`${mobilePrimaryLinkClass} ${
                        isActive(
                          item.href
                        )
                          ? "text-[#0a583b]"
                          : ""
                      }`}
                    >
                      <span>
                        {
                          item.label
                        }
                      </span>

                      {isActive(
                        item.href
                      ) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0a583b]" />
                      )}
                    </Link>
                  )
                )}
              </nav>

              {/* Account links */}
              <section className="pt-8">
                <p
                  className={`text-[10px] font-extrabold uppercase text-[#8a968e] ${
                    isArabic
                      ? "tracking-normal"
                      : "tracking-[0.16em]"
                  }`}
                >
                  {t.accountLinks}
                </p>

                <div className="mt-3 border-y border-[#e8ece9]">
                  <Link
                    href="/orders"
                    onClick={
                      closeMenu
                    }
                    className={
                      mobileSecondaryLinkClass
                    }
                  >
                    <span>
                      {t.orders}
                    </span>
                  </Link>

                  <Link
                    href="/wishlist"
                    onClick={
                      closeMenu
                    }
                    className={
                      mobileSecondaryLinkClass
                    }
                  >
                    <span>
                      {t.wishlist}
                    </span>

                    {wishlistCount >
                      0 && (
                      <span className="text-xs font-extrabold text-[#0a583b]">
                        {
                          wishlistCount
                        }
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/cart"
                    onClick={
                      closeMenu
                    }
                    className={
                      mobileSecondaryLinkClass
                    }
                  >
                    <span>
                      {t.cart}
                    </span>

                    {cartCount >
                      0 && (
                      <span className="text-xs font-extrabold text-[#0a583b]">
                        {
                          cartCount
                        }
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    onClick={
                      closeMenu
                    }
                    className={
                      mobileSecondaryLinkClass
                    }
                  >
                    <span>
                      {t.account}
                    </span>
                  </Link>
                </div>
              </section>

              {/* Information */}
              <section className="pt-8">
                <p
                  className={`text-[10px] font-extrabold uppercase text-[#8a968e] ${
                    isArabic
                      ? "tracking-normal"
                      : "tracking-[0.16em]"
                  }`}
                >
                  {t.information}
                </p>

                <div className="mt-3 flex flex-col items-start gap-3">
                  <Link
                    href="/privacy-policy"
                    onClick={
                      closeMenu
                    }
                    className="text-xs font-bold text-[#647168] transition hover:text-[#0a583b]"
                  >
                    {t.privacy}
                  </Link>

                  <Link
                    href="/terms"
                    onClick={
                      closeMenu
                    }
                    className="text-xs font-bold text-[#647168] transition hover:text-[#0a583b]"
                  >
                    {t.terms}
                  </Link>

                  <Link
                    href="/refund-policy"
                    onClick={
                      closeMenu
                    }
                    className="text-xs font-bold text-[#647168] transition hover:text-[#0a583b]"
                  >
                    {t.refund}
                  </Link>
                </div>
              </section>

              {/* Menu footer */}
              <div className="mt-auto pb-[calc(2rem+env(safe-area-inset-bottom))] pt-10">
                <div
                  dir="ltr"
                  className="flex items-center justify-between border-t border-[#e8ece9] pt-5"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#8a968e]">
                    {t.language}
                  </p>

                  <div className="flex items-center gap-3 text-xs font-extrabold">
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
                          ? "border-[#0a583b] text-[#0a583b]"
                          : "border-transparent text-[#9aa49d]"
                      }`}
                    >
                      EN
                    </button>

                    <span className="text-[#c8d0ca]">
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
                          ? "border-[#0a583b] text-[#0a583b]"
                          : "border-transparent text-[#9aa49d]"
                      }`}
                    >
                      AR
                    </button>
                  </div>
                </div>

                <p className="mt-5 text-[10px] font-medium text-[#9aa49d]">
                  {t.copyright}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}