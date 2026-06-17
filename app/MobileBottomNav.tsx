"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { getCart } from "@/lib/cart";
import { useLanguage } from "../context/LanguageContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [count, setCount] = useState(0);

  function updateCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
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
      label: lang === "ar" ? "الرئيسية" : "Home",
      icon: Home,
    },
    {
      href: "/products",
      label: lang === "ar" ? "المتجر" : "Shop",
      icon: ShoppingBag,
    },
    {
      href: "/cart",
      label: lang === "ar" ? "السلة" : "Cart",
      icon: ShoppingCart,
    },
    {
      href: "/profile",
      label: lang === "ar" ? "الحساب" : "Profile",
      icon: User,
    },
  ];

  return (
    <nav
      dir="ltr"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-white shadow-lg md:hidden"
    >
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 text-xs font-bold transition ${
                active ? "text-green-700" : "text-gray-600"
              }`}
            >
              <div className="relative">
                <Icon size={22} />

                {item.href === "/cart" && count > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                    {count}
                  </span>
                )}
              </div>

              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}