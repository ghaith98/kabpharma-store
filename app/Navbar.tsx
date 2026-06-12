"use client";

import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaSearch, FaUser, FaShoppingCart, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const router = useRouter();

  const [count, setCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  function updateCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCount(total);
  }

  function updateSearch(value: string) {
    setQuery(value);

    const cleanValue = value.trim();

    if (cleanValue) {
      router.replace(`/products?search=${encodeURIComponent(cleanValue)}`);
    } else {
      router.replace("/products");  
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 sm:py-3">
        <Link href="/" className={searchOpen ? "hidden sm:block" : "block"}>
          <Image
            src="/logo.png"
            alt="KAB Pharma"
            width={140}
            height={50}
            className="h-auto sm:w-[160px]"
            priority
          />
        </Link>

        {searchOpen ? (
          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-2">
              <FaSearch size={16} className="text-green-700" />

              <input
                autoFocus
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-500 outline-none"
              />
            </div>

            <button
              type="button"
              onClick={closeSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700"
              aria-label="Close search"
            >
              <FaTimes size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700"
            >
              <FaSearch size={17} />
            </button>

            <Link
              href="/profile"
              aria-label="Profile"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-green-600 hover:text-green-700 md:flex"
            >
              <FaUser size={17} />
            </Link>

            <Link
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
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}