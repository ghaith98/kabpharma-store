"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const isArabic = lang === "ar";

  const [count, setCount] = useState(0);
  const [wishlistCount, setWishlistCount] =
    useState(0);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [query, setQuery] = useState("");

  function updateCartCount() {
    const cart = getCart();

    const total = cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );

    setCount(total);
  }

  function updateWishlistCount() {
    const wishlist = getWishlist();
    setWishlistCount(wishlist.length);
  }

  function openSearch() {
    if (pathname !== "/products") {
      router.push("/products?openSearch=1");
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
    const params = new URLSearchParams(
      window.location.search
    );

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

  // Debounced product search
  useEffect(() => {
    if (
      !searchOpen ||
      pathname !== "/products"
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const cleanQuery = query.trim();

      if (cleanQuery) {
        router.replace(
          `/products?search=${encodeURIComponent(
            cleanQuery
          )}`
        );
      } else {
        router.replace("/products");
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    query,
    searchOpen,
    pathname,
    router,
  ]);

  const iconButtonClass =
    "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e8e5] bg-white text-[#26352d] transition duration-200 hover:border-[#bfd5c8] hover:bg-[#f1f7f3] hover:text-[#0a583b] sm:h-11 sm:w-11";

  return (
    <nav
      dir={isArabic ? "rtl" : "ltr"}
      className="sticky top-0 z-50 border-b border-[#e8ebe9] bg-white/95 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[70px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[76px] sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          aria-label="KAB Pharma"
          className={`h-full shrink-0 items-center overflow-hidden ${
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
            className="h-[38px] w-auto object-contain sm:h-[44px]"
            priority
          />
        </Link>

        {searchOpen ? (
          /* Search mode */
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:ms-auto sm:max-w-2xl">
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
                  setQuery(event.target.value)
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
              className={iconButtonClass}
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        ) : (
          /* Navbar actions */
          <div
            dir="ltr"
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={openSearch}
              aria-label={
                isArabic
                  ? "البحث عن منتج"
                  : "Search products"
              }
              className={iconButtonClass}
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
              className={iconButtonClass}
            >
              <Heart
                size={19}
                strokeWidth={2}
              />

              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[9px] font-extrabold leading-none text-white">
                  {wishlistCount > 99
                    ? "99+"
                    : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              aria-label={
                isArabic ? "السلة" : "Cart"
              }
              className={`${iconButtonClass} hidden md:flex`}
            >
              <ShoppingBag
                size={19}
                strokeWidth={2}
              />

              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[9px] font-extrabold leading-none text-white">
                  {count > 99 ? "99+" : count}
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
          </div>
        )}
      </div>
    </nav>
  );
}