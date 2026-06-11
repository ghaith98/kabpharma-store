"use client";

import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";
import Image from "next/image";
import { FaSearch, FaUser, FaShoppingCart } from "react-icons/fa";

export default function Navbar() {
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

  return (
    <nav className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 sm:py-3">
        <a href="/">
          <Image
            src="/logo.png"
            alt="KAB Pharma"
            width={140}
            height={50}
            className="h-auto sm:w-[160px]"
            priority
          />
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/search"
            aria-label="Search products"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700"
          >
            <FaSearch size={17} />
          </a>

          <a
            href="/profile"
            aria-label="Profile"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700 md:flex"
          >
            <FaUser size={17} />
          </a>

          <a
            href="/cart"
            aria-label="Cart"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700 md:flex"
          >
            <FaShoppingCart size={17} />

            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </a>
        </div>
      </div>
    </nav>
  );
}