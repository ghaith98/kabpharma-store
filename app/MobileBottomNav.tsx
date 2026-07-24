"use client";

import type { MouseEvent as ReactMouseEvent } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  Home,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import { useCartCount } from "./useStoreCounts";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const currentLang =
    lang as "en" | "ar";

  const count = useCartCount();

  const items = [
    {
      href: "/",
      label:
        currentLang === "ar"
          ? "الرئيسية"
          : "Home",
      icon: Home,
    },
    {
      href: "/products",
      label:
        currentLang === "ar"
          ? "المتجر"
          : "Shop",
      icon: ShoppingBag,
    },
    {
      href: "/cart",
      label:
        currentLang === "ar"
          ? "السلة"
          : "Cart",
      icon: ShoppingCart,
    },
    {
      href: "/profile",
      label:
        currentLang === "ar"
          ? "الحساب"
          : "Profile",
      icon: UserRound,
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

  function handleNavigation(
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string
  ) {
    if (!isActive(href)) {
      return;
    }

    event.preventDefault();

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

  return (
    <nav
  dir="ltr"
      aria-label={
        currentLang === "ar"
          ? "التنقل الرئيسي"
          : "Mobile navigation"
      }
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e7ebe8] bg-white/95 shadow-[0_-8px_30px_rgba(7,63,44,0.07)] backdrop-blur-xl md:hidden"
    >
      <div
        className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5"
        style={{
          paddingBottom:
            "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) =>
                handleNavigation(
                  event,
                  item.href
                )
              }
              aria-current={
                active
                  ? "page"
                  : undefined
              }
              className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-extrabold transition ${
                active
                  ? "text-[#0a583b]"
                  : "text-[#78847c] hover:bg-[#f5f7f5] hover:text-[#26352d]"
              }`}
            >
              <div
                className={`relative flex h-8 min-w-12 items-center justify-center rounded-full px-3 transition ${
                  active
                    ? "bg-[#edf5f0]"
                    : "bg-transparent"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={
                    active
                      ? 2.5
                      : 2
                  }
                />

                {item.href ===
                  "/cart" &&
                  count > 0 && (
                    <span className="absolute -right-0.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#0a583b] px-1 text-[9px] font-extrabold leading-none text-white">
                      {count > 99
                        ? "99+"
                        : count}
                    </span>
                  )}
              </div>

              <span
  dir={
    currentLang === "ar"
      ? "rtl"
      : "ltr"
  }
  className="leading-none"
>
  {item.label}
</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

