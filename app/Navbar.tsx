"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getCart } from "@/lib/cart";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const isHomePage = pathname === "/";

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

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/">
  <Image
    src="/logo.png"
    alt="KAB Pharma"
    width={180}
    height={60}
    className="h-auto"
  />
</a>

        {!isHomePage && (
          <div className="flex items-center gap-6">
  <a
    href="/products"
    className="font-medium text-gray-700 transition hover:text-green-700"
  >
    Products
  </a>

  <a
    href="/orders"
    className="font-medium text-gray-700 transition hover:text-green-700"
  >
    My Orders
  </a>

  <a
    href="/cart"
    className="relative rounded-xl bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
  >
    Cart
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                  {count}
                </span>
              )}
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}