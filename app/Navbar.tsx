"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

import Image from "next/image";
import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  ChevronDown,
  Heart,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useDialogFocus } from "@/lib/use-dialog-focus";

import { useLanguage } from "../context/LanguageContext";
import {
  useCartCount,
  useWishlistCount,
} from "./useStoreCounts";
type Category = {
  id: number;
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

export default function Navbar() {
  const {
    lang,
    setLang,
  } = useLanguage();

  const pathname = usePathname();
  const router = useRouter();

  const isArabic = lang === "ar";

  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const menuDialogRef =
    useRef<HTMLElement>(null);

  useDialogFocus(menuOpen, menuDialogRef);

  const [query, setQuery] =
    useState("");

  const [scrolled, setScrolled] =
    useState(false);
    const [categories, setCategories] =
  useState<Category[]>([]);

const [
  productsOpen,
  setProductsOpen,
] = useState(false);
const [
  desktopProductsOpen,
  setDesktopProductsOpen,
] = useState(false);

  const currentYear =
    new Date().getFullYear();

  const text = {
    en: {
      home: "Home",
      products: "Products",
      allProducts: "All products",
      bestSellers: "Best Sellers",
      newArrivals: "New Arrivals",
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
      allProducts: "جميع المنتجات",
      bestSellers: "الأكثر مبيعاً",
      newArrivals: "وصل حديثاً",
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
    label: t.bestSellers,
    href: "/best-sellers",
  },
  {
    label: t.newArrivals,
    href: "/new-arrivals",
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
      setQuery("");
      setSearchOpen(true);
      router.push("/products");

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
      window.history.replaceState(
        null,
        "",
        "/products"
      );
    }
  }

 function closeMenu() {
  setMenuOpen(false);
  setProductsOpen(false);
}

  function handlePrimaryNavigation(
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    closeMenu();
    setSearchOpen(false);

    if (pathname !== href) {
      return;
    }

    event.preventDefault();
    setSearchOpen(false);
    setQuery("");

    if (href === "/products") {
      window.dispatchEvent(
        new Event("productsResetRequested")
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
    فتح البحث بعد الانتقال
    من أي صفحة إلى المنتجات.
  */
 useEffect(() => {
  let cancelled = false;

  async function loadCategories() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("categories")
        .select(
          "id, name, name_ar, name_en"
        )
        .order("id", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Failed to load categories:",
          error
        );

        return;
      }

      if (!cancelled) {
        setCategories(
          (data || []) as Category[]
        );
      }
    } catch (error) {
      console.error(
        "Categories loading error:",
        error
      );
    }
  }

  void loadCategories();

  return () => {
    cancelled = true;
  };
}, []);
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
          window.history.replaceState(
            null,
            "",
            `/products?search=${encodeURIComponent(
              cleanQuery
            )}`
          );
        } else {
          window.history.replaceState(
            null,
            "",
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
  ]);
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
          window.history.replaceState(
            null,
            "",
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
              onClick={(event) =>
                handlePrimaryNavigation(
                  event,
                  "/"
                )
              }
              aria-label="KAB Pharma home"
              className="hidden shrink-0 items-center lg:flex"
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
                      window.history.replaceState(
                        null,
                        "",
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
  dir="ltr"
                  aria-label={
                    t.navigation
                  }
                  className="hidden min-w-0 flex-1 items-center justify-center lg:flex"
                >
                  <div className="flex items-center gap-7 xl:gap-10">
                      {navigationLinks.map((item) => {
  const active = isActive(
    item.href
  );

  const linkClass = `group relative flex h-[74px] items-center whitespace-nowrap text-[12px] font-extrabold transition-colors duration-200 ${
    isArabic
      ? "tracking-normal [font-family:Tahoma,Arial,sans-serif]"
      : "uppercase tracking-[0.1em]"
  } ${
    active
      ? "text-[#0a583b]"
      : "text-[#26352d] hover:text-[#0a583b]"
  }`;

  /* Products dropdown */
  if (
    item.href === "/products"
  ) {
    return (
      <div
        key={item.href}
        className="relative flex h-[74px] items-center"
        onMouseEnter={() =>
          setDesktopProductsOpen(
            true
          )
        }
        onMouseLeave={() =>
          setDesktopProductsOpen(
            false
          )
        }
        onFocus={() =>
          setDesktopProductsOpen(
            true
          )
        }
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(
              event.relatedTarget as Node
            )
          ) {
            setDesktopProductsOpen(
              false
            );
          }
        }}
      >
        <Link
          href="/products"
          onClick={(event) => {
            setDesktopProductsOpen(
              false
            );

            handlePrimaryNavigation(
              event,
              "/products"
            );
          }}
          aria-current={
            active
              ? "page"
              : undefined
          }
          aria-haspopup="menu"
          aria-expanded={
            desktopProductsOpen
          }
          className={`${linkClass} gap-1.5`}
        >
          <span
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
          >
            {item.label}
          </span>

          <ChevronDown
            size={14}
            strokeWidth={2}
            className={`transition-transform duration-200 ${
              desktopProductsOpen
                ? "rotate-180"
                : ""
            }`}
          />

          <span
            className={`absolute inset-x-0 bottom-0 h-[2px] origin-center bg-[#0a583b] transition-transform duration-300 ${
              active ||
              desktopProductsOpen
                ? "scale-x-100"
                : "scale-x-0 group-hover:scale-x-100"
            }`}
          />
        </Link>

        {/* Dropdown */}
        <div
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          className={`absolute ${
            isArabic
              ? "right-0"
              : "left-0"
          } top-full z-[100] w-[260px] origin-top overflow-hidden rounded-b-2xl border border-t-0 border-[#e2e9e4] bg-white shadow-[0_18px_45px_rgba(20,32,25,0.14)] transition-all duration-200 ${
            desktopProductsOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <div className="p-2">
            <Link
              href="/products"
              onClick={() => {
                setDesktopProductsOpen(
                  false
                );
              }}
              className="flex min-h-12 items-center rounded-xl px-4 text-sm font-extrabold text-[#0a583b] transition hover:bg-[#f1f6f3]"
            >
              {t.allProducts}
            </Link>

            {categories.map(
              (category) => {
                const categoryLabel =
                  isArabic
                    ? category.name_ar ||
                      category.name ||
                      category.name_en
                    : category.name_en ||
                      category.name ||
                      category.name_ar;

                if (
                  !categoryLabel
                ) {
                  return null;
                }

                return (
                  <Link
                    key={
                      category.id
                    }
                    href={`/products?category=${category.id}`}
                    onClick={() =>
                      setDesktopProductsOpen(
                        false
                      )
                    }
                    className="flex min-h-11 items-center rounded-xl border-t border-[#edf1ee] px-4 text-sm font-bold text-[#59675e] transition hover:bg-[#f4f7f5] hover:text-[#0a583b]"
                  >
                    {
                      categoryLabel
                    }
                  </Link>
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Other navigation links */
  return (
    <Link
      key={item.href}
      href={item.href}
      onClick={(event) =>
        handlePrimaryNavigation(
          event,
          item.href
        )
      }
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={linkClass}
    >
      <span
        dir={
          isArabic
            ? "rtl"
            : "ltr"
        }
      >
        {item.label}
      </span>

      <span
        className={`absolute inset-x-0 bottom-0 h-[2px] origin-center bg-[#0a583b] transition-transform duration-300 ${
          active
            ? "scale-x-100"
            : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
})}
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

                {/* Mobile header */}
<div
  dir="ltr"
  className="absolute inset-0 flex items-center justify-center lg:hidden"
>
  {/* Hamburger - left */}
  <button
    type="button"
    onClick={() =>
      setMenuOpen(true)
    }
    aria-label={t.openMenu}
    aria-expanded={menuOpen}
    aria-controls="mobile-navigation"
    className="absolute left-4 flex h-11 w-11 items-center justify-start bg-transparent transition active:scale-95 sm:left-6"
  >
    <span className="flex w-6 flex-col items-start gap-[5px]">
      <span className="block h-[2px] w-6 rounded-full bg-[#142019]" />

      <span className="block h-[2px] w-[19px] rounded-full bg-[#142019]" />

      <span className="block h-[2px] w-[13px] rounded-full bg-[#142019]" />
    </span>
  </button>

  {/* Centered K logo */}
  <Link
    href="/"
    onClick={(event) =>
      handlePrimaryNavigation(
        event,
        "/"
      )
    }
    aria-label="KAB Pharma home"
    className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
  >
    <Image
      src="/apple-icon.png"
      alt="KAB Pharma"
      width={180}
      height={180}
      priority
      className="h-[47px] w-[47px] object-contain sm:h-[50px] sm:w-[50px]"
    />
  </Link>

  {/* Search and wishlist - right */}
  <div className="absolute right-4 flex items-center gap-0.5 sm:right-6">
    <button
      type="button"
      onClick={openSearch}
      aria-label={t.search}
      className={mobileIconClass}
    >
      <Search
        size={19}
        strokeWidth={1.8}
      />
    </button>

    <Link
      href="/wishlist"
      aria-label={t.wishlist}
      className={mobileIconClass}
    >
      <Heart
        size={19}
        strokeWidth={1.8}
      />

      {wishlistCount > 0 && (
        <span className="absolute right-0 top-0 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[8px] font-extrabold leading-none text-white">
          {wishlistCount > 99
            ? "99+"
            : wishlistCount}
        </span>
      )}
    </Link>
  </div>
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
            ref={menuDialogRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            dir="ltr"
            aria-label={
              t.mobileNavigation
            }
           className="absolute inset-y-0 left-0 flex w-[88%] max-w-[390px] flex-col overflow-y-auto bg-white shadow-[18px_0_60px_rgba(7,31,20,0.16)]"
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
  {/* Home */}
  <Link
    href="/"
    onClick={(event) =>
      handlePrimaryNavigation(
        event,
        "/"
      )
    }
    aria-current={
      pathname === "/"
        ? "page"
        : undefined
    }
    className={`${mobilePrimaryLinkClass} ${
      pathname === "/"
        ? "text-[#0a583b]"
        : ""
    }`}
  >
    <span>{t.home}</span>

    {pathname === "/" && (
      <span className="h-1.5 w-1.5 rounded-full bg-[#0a583b]" />
    )}
  </Link>

  {/* Products + Categories */}
  <div className="border-b border-[#e8ece9]">
    <button
      type="button"
      onClick={() =>
        setProductsOpen(
          (current) => !current
        )
      }
      aria-expanded={
        productsOpen
      }
      aria-controls="mobile-product-categories"
      className={`flex min-h-[62px] w-full items-center justify-between text-start text-lg font-extrabold transition ${
        pathname.startsWith(
          "/products"
        )
          ? "text-[#0a583b]"
          : "text-[#142019]"
      }`}
    >
      <span>{t.products}</span>

      <ChevronDown
        size={19}
        strokeWidth={1.8}
        className={`text-[#77837b] transition-transform duration-300 ${
          productsOpen
            ? "rotate-180"
            : ""
        }`}
      />
    </button>

    <div
      id="mobile-product-categories"
      className={`grid transition-all duration-300 ease-in-out ${
        productsOpen
          ? "grid-rows-[1fr] pb-5 opacity-100"
          : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div
          className={`border-[#dce5df] ${
            isArabic
              ? "border-r pr-4"
              : "border-l pl-4"
          }`}
        >
          {/* All products */}
          <Link
            href="/products"
            onClick={(event) =>
              handlePrimaryNavigation(
                event,
                "/products"
              )
            }
            className="flex min-h-11 items-center text-sm font-extrabold text-[#0a583b] transition hover:opacity-70"
          >
            {t.allProducts}
          </Link>

          {/* Dynamic categories */}
          {categories.map(
            (category) => {
              const categoryLabel =
                isArabic
                  ? category.name_ar ||
                    category.name ||
                    category.name_en
                  : category.name_en ||
                    category.name ||
                    category.name_ar;

              if (
                !categoryLabel
              ) {
                return null;
              }

              return (
                <Link
                  key={
                    category.id
                  }
                  href={`/products?category=${category.id}`}
                  onClick={closeMenu}
                  className="flex min-h-11 items-center border-t border-[#edf0ed] text-sm font-bold text-[#647168] transition hover:text-[#0a583b]"
                >
                  {
                    categoryLabel
                  }
                </Link>
              );
            }
          )}
        </div>
      </div>
    </div>
  </div>

  {/* Remaining primary links */}
  {navigationLinks
    .filter(
      (item) =>
        item.href !== "/" &&
        item.href !== "/products"
    )
    .map((item) => {
      const active =
        isActive(item.href);

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={(event) =>
            handlePrimaryNavigation(
              event,
              item.href
            )
          }
          aria-current={
            active
              ? "page"
              : undefined
          }
          className={`${mobilePrimaryLinkClass} ${
            active
              ? "text-[#0a583b]"
              : ""
          }`}
        >
          <span>{item.label}</span>

          {active && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#0a583b]" />
          )}
        </Link>
      );
    })}
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
