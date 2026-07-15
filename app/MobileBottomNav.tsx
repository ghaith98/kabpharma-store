"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import { getCart } from "@/lib/cart";
import { useLanguage } from "../context/LanguageContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const currentLang = lang as "en" | "ar";
  const [count, setCount] = useState(0);

  function updateCount() {
    const cart = getCart();

    const total = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );

    setCount(total);
  }

  useEffect(() => {
    updateCount();

    window.addEventListener("cartUpdated", updateCount);
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  const items = [
    {
      href: "/",
      label: currentLang === "ar" ? "الرئيسية" : "Home",
      icon: Home,
    },
    {
      href: "/products",
      label: currentLang === "ar" ? "المتجر" : "Shop",
      icon: ShoppingBag,
    },
    {
      href: "/cart",
      label: currentLang === "ar" ? "السلة" : "Cart",
      icon: ShoppingCart,
    },
    {
      href: "/profile",
      label: currentLang === "ar" ? "الحساب" : "Profile",
      icon: UserRound,
    },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      dir="ltr"
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
    >
      <div
        className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5"
        style={{
          paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-extrabold transition ${
                active
                  ? "text-green-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div
                className={`relative flex h-8 min-w-12 items-center justify-center rounded-full px-3 transition ${
                  active ? "bg-green-50" : "bg-transparent"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 2}
                />

                {item.href === "/cart" && count > 0 && (
                  <span className="absolute -right-0.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-green-700 px-1 text-[9px] font-extrabold leading-none text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </div>

              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}