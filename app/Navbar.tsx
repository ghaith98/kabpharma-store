"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  UserRound,
  ShoppingBag,
  X,
  Heart,
  Home,
  Info,
  MessageCircle,
} from "lucide-react";

import { getCart } from "@/lib/cart";
import { getWishlist } from "@/lib/wishlist";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const currentLang = lang as "en" | "ar";

  const [count, setCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const text = {
    en: {
      announcement: "Carefully selected products for your everyday care",
      home: "Home",
      shop: "Shop",
      about: "About us",
      contact: "Contact us",
      search: "Search products...",
      closeSearch: "Close search",
      cart: "Cart",
      wishlist: "Wishlist",
      profile: "Profile",
    },
    ar: {
      announcement: "منتجات مختارة بعناية لروتين عنايتك اليومية",
      home: "الرئيسية",
      shop: "المتجر",
      about: "من نحن",
      contact: "تواصل معنا",
      search: "ابحث عن منتج...",
      closeSearch: "إغلاق البحث",
      cart: "السلة",
      wishlist: "المفضلة",
      profile: "الحساب",
    },
  };

  const t = text[currentLang];

  function updateCount() {
    const cart = getCart();
    const total = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    setCount(total);
  }

  function updateWishlistCount() {
    const wishlist = getWishlist();
    setWishlistCount(wishlist.length);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");

    if (pathname === "/products") {
      router.replace("/products");
    }
  }

  function openSearch() {
    if (pathname !== "/products") {
      router.push("/products?openSearch=1");
      return;
    }

    setSearchOpen(true);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  useEffect(() => {
    updateCount();
    updateWishlistCount();

    window.addEventListener("cartUpdated", updateCount);
    window.addEventListener("wishlistUpdated", updateWishlistCount);
    window.addEventListener("storage", updateCount);
    window.addEventListener("storage", updateWishlistCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCount);
      window.removeEventListener(
        "wishlistUpdated",
        updateWishlistCount
      );
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("storage", updateWishlistCount);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (
      pathname === "/products" &&
      params.get("openSearch") === "1"
    ) {
      setSearchOpen(true);

      params.delete("openSearch");

      const newUrl = params.toString()
        ? `/products?${params.toString()}`
        : "/products";

      router.replace(newUrl);
    }
  }, [pathname, router]);

  // Delayed search to avoid changing the URL with every keystroke immediately
  useEffect(() => {
    if (!searchOpen || pathname !== "/products") return;

    const timeout = window.setTimeout(() => {
      const cleanValue = query.trim();

      if (cleanValue) {
        router.replace(
          `/products?search=${encodeURIComponent(cleanValue)}`
        );
      } else {
        router.replace("/products");
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [query, searchOpen, pathname, router]);

  const desktopLinks = [
    {
      href: "/",
      label: t.home,
      icon: Home,
    },
    {
      href: "/products",
      label: t.shop,
      icon: ShoppingBag,
    },
    {
      href: "/about",
      label: t.about,
      icon: Info,
    },
    {
      href: "/contact",
      label: t.contact,
      icon: MessageCircle,
    },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div
        dir={currentLang === "ar" ? "rtl" : "ltr"}
        className="hidden bg-[#073d2b] px-4 py-2 text-center text-xs font-bold tracking-wide text-white sm:block"
      >
        {t.announcement}
      </div>

      <nav
        dir={currentLang === "ar" ? "rtl" : "ltr"}
        className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:h-[82px] sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            aria-label="KAB Pharma home"
            className={`shrink-0 ${
              searchOpen ? "hidden sm:block" : "block"
            }`}
          >
            <Image
              src="/logo.png"
              alt="KAB Pharma"
              width={175}
              height={60}
              className="h-auto w-[145px] object-contain sm:w-[165px]"
              priority
            />
          </Link>

          {searchOpen ? (
            /* Search field */
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:ms-auto sm:max-w-2xl">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-green-200 bg-green-50/70 px-4 py-2.5 transition focus-within:border-green-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-100">
                <Search
                  size={18}
                  strokeWidth={2}
                  className="shrink-0 text-green-700"
                />

                <input
                  autoFocus
                  type="search"
                  placeholder={t.search}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400"
                />
              </div>

              <button
                type="button"
                onClick={closeSearch}
                aria-label={t.closeSearch}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
              >
                <X size={19} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <>
              {/* Desktop navigation */}
              <div className="hidden items-center gap-1 lg:flex">
                {desktopLinks.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                        active
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                      }`}
                    >
                      <Icon size={16} strokeWidth={2} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Actions */}
              <div
                dir="ltr"
                className="flex items-center gap-2 sm:gap-2.5"
              >
                <button
                  type="button"
                  onClick={openSearch}
                  aria-label={t.search}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 sm:h-11 sm:w-11"
                >
                  <Search size={19} strokeWidth={2} />
                </button>

                <Link
                  href="/wishlist"
                  aria-label={t.wishlist}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 sm:h-11 sm:w-11"
                >
                  <Heart size={19} strokeWidth={2} />

                  {wishlistCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-green-700 px-1 text-[10px] font-extrabold leading-none text-white">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/cart"
                  aria-label={t.cart}
                  className="relative hidden h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 md:flex"
                >
                  <ShoppingBag size={19} strokeWidth={2} />

                  {count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-green-700 px-1 text-[10px] font-extrabold leading-none text-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>

                <Link
                  href="/profile"
                  aria-label={t.profile}
                  className="hidden h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 md:flex"
                >
                  <UserRound size={19} strokeWidth={2} />
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
}