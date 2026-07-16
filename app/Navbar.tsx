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
  ChevronRight,
  Globe2,
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
  const { lang, setLang } =
    useLanguage();

  const router = useRouter();
  const pathname = usePathname();

  const isArabic = lang === "ar";

  const [count, setCount] =
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

  const text = {
    menu: isArabic
      ? "القائمة"
      : "Menu",

    home: isArabic
      ? "الرئيسية"
      : "Home",

    products: isArabic
      ? "جميع المنتجات"
      : "All products",

    orders: isArabic
      ? "طلباتي"
      : "My orders",

    about: isArabic
      ? "عن KAB Pharma"
      : "About KAB Pharma",

    contact: isArabic
      ? "تواصل معنا"
      : "Contact us",

    privacy: isArabic
      ? "سياسة الخصوصية"
      : "Privacy",

    terms: isArabic
      ? "الشروط والأحكام"
      : "Terms",

    refund: isArabic
      ? "سياسة الاسترجاع"
      : "Refund policy",

    language: isArabic
      ? "اللغة"
      : "Language",
  };

  const mainLinks = [
    {
      label: text.home,
      href: "/",
    },
    {
      label: text.products,
      href: "/products",
    },
    {
      label: text.orders,
      href: "/orders",
    },
    {
      label: text.about,
      href: "/about",
    },
    {
      label: text.contact,
      href: "/contact",
    },
  ];

  const policyLinks = [
    {
      label: text.privacy,
      href: "/privacy-policy",
    },
    {
      label: text.terms,
      href: "/terms",
    },
    {
      label: text.refund,
      href: "/refund-policy",
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

    setCount(total);
  }

  function updateWishlistCount() {
    const wishlist =
      getWishlist();

    setWishlistCount(
      wishlist.length
    );
  }

  function openSearch() {
    setMenuOpen(false);

    if (pathname !== "/products") {
      router.push(
        "/products?openSearch=1"
      );

      return;
    }

    setSearchOpen(true);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");

    if (pathname === "/products") {
      router.replace("/products");
    }
  }

  function openMenu() {
    setSearchOpen(false);
    setMenuOpen(true);
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

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      pathname === "/products" &&
      params.get("openSearch") ===
        "1"
    ) {
      setSearchOpen(true);

      params.delete("openSearch");

      const newUrl =
        params.toString()
          ? `/products?${params.toString()}`
          : "/products";

      router.replace(newUrl);
    }
  }, [pathname, router]);

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

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const iconButtonClass =
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e8e5] bg-white text-[#26352d] transition duration-200 hover:border-[#bfd5c8] hover:bg-[#f1f7f3] hover:text-[#0a583b] active:scale-95 sm:h-11 sm:w-11";

  return (
    <>
      <nav
        dir="ltr"
        className="sticky top-0 z-50 border-b border-[#e8ebe9] bg-white/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[70px] max-w-[1600px] items-center justify-between gap-2 px-4 sm:h-[76px] sm:gap-4 sm:px-6 lg:px-8">
          {/* Logo stays on the left */}
          <Link
            href="/"
            aria-label="KAB Pharma"
            className={`h-full min-w-0 shrink items-center overflow-hidden ${
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
              className="h-[35px] max-w-[138px] object-contain sm:h-[44px] sm:max-w-none"
              priority
            />
          </Link>

          {searchOpen ? (
            /* Search mode */
            <div
              dir={
                isArabic
                  ? "rtl"
                  : "ltr"
              }
              className="flex min-w-0 flex-1 items-center gap-2 sm:ms-auto sm:max-w-2xl"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[#d9e3dd] bg-[#f5f8f6] px-4 py-2.5 transition focus-within:border-[#75a68b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#edf5f0]">
                <Search
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-[#0a583b]"
                />

                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    isArabic
                      ? "ابحث عن منتج..."
                      : "Search products..."
                  }
                  className="min-w-0 flex-1 bg-transparent text-base font-medium text-[#142019] outline-none placeholder:text-[#829087]"
                />
              </div>

              <button
                type="button"
                onClick={closeSearch}
                aria-label={
                  isArabic
                    ? "إغلاق البحث"
                    : "Close search"
                }
                className={
                  iconButtonClass
                }
              >
                <X
                  size={18}
                  strokeWidth={2}
                />
              </button>
            </div>
          ) : (
            /* Navbar actions */
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={openSearch}
                aria-label={
                  isArabic
                    ? "البحث عن منتج"
                    : "Search products"
                }
                className={
                  iconButtonClass
                }
              >
                <Search
                  size={19}
                  strokeWidth={2}
                />
              </button>

              <Link
                href="/wishlist"
                aria-label={
                  isArabic
                    ? "المفضلة"
                    : "Wishlist"
                }
                className={
                  iconButtonClass
                }
              >
                <Heart
                  size={19}
                  strokeWidth={2}
                />

                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[9px] font-extrabold leading-none text-white">
                    {wishlistCount >
                    99
                      ? "99+"
                      : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                aria-label={
                  isArabic
                    ? "السلة"
                    : "Cart"
                }
                className={`${iconButtonClass} hidden md:flex`}
              >
                <ShoppingBag
                  size={19}
                  strokeWidth={2}
                />

                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[9px] font-extrabold leading-none text-white">
                    {count > 99
                      ? "99+"
                      : count}
                  </span>
                )}
              </Link>

              <Link
                href="/profile"
                aria-label={
                  isArabic
                    ? "الحساب"
                    : "Profile"
                }
                className={`${iconButtonClass} hidden md:flex`}
              >
                <UserRound
                  size={19}
                  strokeWidth={2}
                />
              </Link>

              {/* Hamburger */}
              <button
                type="button"
                onClick={openMenu}
                aria-label={
                  isArabic
                    ? "فتح القائمة"
                    : "Open menu"
                }
                aria-expanded={
                  menuOpen
                }
                aria-controls="main-navigation-drawer"
                className={
                  iconButtonClass
                }
              >
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 flex-col items-start justify-center gap-[4px]"
                >
                  <span className="h-[2px] w-[14px] rounded-full bg-current" />

                  <span className="h-[2px] w-[20px] rounded-full bg-current" />

                  <span className="h-[2px] w-[11px] rounded-full bg-current" />
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Drawer overlay */}
      <div
        className={`fixed inset-0 z-[80] transition ${
          menuOpen
            ? "pointer-events-auto visible"
            : "pointer-events-none invisible"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          onClick={closeMenu}
          aria-label={
            isArabic
              ? "إغلاق القائمة"
              : "Close menu"
          }
          tabIndex={
            menuOpen ? 0 : -1
          }
          className={`absolute inset-0 bg-[#07130d]/45 backdrop-blur-[2px] transition-opacity duration-300 ${
            menuOpen
              ? "opacity-100"
              : "opacity-0"
          }`}
        />

        <aside
          id="main-navigation-drawer"
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          role="dialog"
          aria-modal="true"
          aria-label={text.menu}
          className={`absolute inset-y-0 right-0 flex w-[88%] max-w-[390px] flex-col overflow-y-auto bg-[#fafbf9] shadow-[-20px_0_60px_rgba(7,19,13,0.18)] transition-transform duration-300 ease-out ${
            menuOpen
              ? "translate-x-0"
              : "translate-x-full"
          }`}
        >
          {/* Drawer header */}
          <div
            dir="ltr"
            className="flex min-h-[76px] items-center justify-between border-b border-[#e4e9e5] px-5"
          >
            <Link
              href="/"
              onClick={closeMenu}
              aria-label="KAB Pharma"
              className="flex min-w-0 items-center"
            >
              <Image
                src="/logo.png"
                alt="KAB Pharma"
                width={190}
                height={46}
                className="h-[38px] w-auto max-w-[160px] object-contain"
              />
            </Link>

            <button
              type="button"
              onClick={closeMenu}
              aria-label={
                isArabic
                  ? "إغلاق القائمة"
                  : "Close menu"
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfe5e1] bg-white text-[#526057] transition hover:border-[#0a583b] hover:text-[#0a583b] active:scale-95"
            >
              <X
                size={18}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Main links */}
          <nav className="flex-1 px-5 py-6">
            <p
              className={`mb-3 text-[10px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.18em]"
              }`}
            >
              {text.menu}
            </p>

            <div className="border-t border-[#dfe5e1]">
              {mainLinks.map(
                (item) => {
                  const active =
                    item.href === "/"
                      ? pathname ===
                        "/"
                      : pathname.startsWith(
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
                      onClick={
                        closeMenu
                      }
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                      className="group flex min-h-[61px] items-center justify-between gap-5 border-b border-[#e5e9e6] text-[16px] font-extrabold transition hover:text-[#0a583b]"
                    >
                      <span
                        className={
                          active
                            ? "text-[#0a583b]"
                            : "text-[#26352d]"
                        }
                      >
                        {item.label}
                      </span>

                      <ChevronRight
                        size={16}
                        strokeWidth={1.8}
                        className={`shrink-0 transition group-hover:text-[#0a583b] ${
                          active
                            ? "text-[#0a583b]"
                            : "text-[#9aa39d]"
                        } ${
                          isArabic
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </Link>
                  );
                }
              )}
            </div>
          </nav>

          {/* Drawer footer */}
          <div className="border-t border-[#e1e6e2] bg-[#f4f6f3] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {policyLinks.map(
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
                    className="text-xs font-bold text-[#748078] transition hover:text-[#0a583b]"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#dde3de] pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#647168]">
                <Globe2
                  size={15}
                  strokeWidth={1.8}
                />

                <span>
                  {text.language}
                </span>
              </div>

              <div
                dir="ltr"
                className="flex rounded-full border border-[#d9e1db] bg-white p-1"
              >
                <button
                  type="button"
                  onClick={() =>
                    setLang("en")
                  }
                  aria-pressed={
                    lang === "en"
                  }
                  className={`flex h-8 min-w-11 items-center justify-center rounded-full px-3 text-[11px] font-extrabold transition ${
                    lang === "en"
                      ? "bg-[#0a583b] text-white"
                      : "text-[#718078] hover:text-[#0a583b]"
                  }`}
                >
                  EN
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setLang("ar")
                  }
                  aria-pressed={
                    lang === "ar"
                  }
                  className={`flex h-8 min-w-11 items-center justify-center rounded-full px-3 text-[11px] font-extrabold transition ${
                    lang === "ar"
                      ? "bg-[#0a583b] text-white"
                      : "text-[#718078] hover:text-[#0a583b]"
                  }`}
                >
                  AR
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}