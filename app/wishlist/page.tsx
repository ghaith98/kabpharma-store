"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Package,
  Trash2,
} from "lucide-react";
import {
  getWishlist,
  saveWishlist,
  WishlistItem,
} from "@/lib/wishlist";
import { useLanguage } from "@/context/LanguageContext";

export default function WishlistPage() {
  const { lang } = useLanguage();

  const isArabic = lang === "ar";
  const ContinueArrow = isArabic ? ArrowLeft : ArrowRight;

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function refreshWishlist() {
      setWishlist(getWishlist());
      setLoaded(true);
    }

    refreshWishlist();

    window.addEventListener("wishlistUpdated", refreshWishlist);
    window.addEventListener("storage", refreshWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", refreshWishlist);
      window.removeEventListener("storage", refreshWishlist);
    };
  }, []);

  function removeFromWishlist(id: number) {
    const updatedWishlist = wishlist.filter((item) => item.id !== id);

    setWishlist(updatedWishlist);
    saveWishlist(updatedWishlist);

    window.dispatchEvent(new Event("wishlistUpdated"));
  }

  function formatPrice(value: number) {
    return `${Number(value).toLocaleString()} SYP`;
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f7f8f6] px-4 py-8 pb-28 sm:px-6 sm:py-12 md:pb-16"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-[#dfe4e0] pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
          <div>
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic ? "tracking-normal" : "tracking-[0.16em]"
              }`}
            >
              KAB Pharma
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#142019] sm:text-5xl">
              {isArabic ? "قائمة المفضلة" : "Your wishlist"}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#647168] sm:text-base">
              {isArabic
                ? "المنتجات التي حفظتها للعودة إليها لاحقاً."
                : "The products you saved to revisit later."}
            </p>
          </div>

          {wishlist.length > 0 && (
            <div className="w-fit rounded-full border border-[#dfe4e0] bg-white px-4 py-2 text-sm font-extrabold text-[#526057]">
              {wishlist.length}{" "}
              {isArabic
                ? wishlist.length === 1
                  ? "منتج"
                  : "منتجات"
                : wishlist.length === 1
                ? "product"
                : "products"}
            </div>
          )}
        </header>

        {!loaded ? (
          <section className="mt-8 rounded-[1.75rem] border border-[#dfe4e0] bg-white p-10 text-center">
            <p className="text-sm font-bold text-[#647168]">
              {isArabic
                ? "جاري تحميل قائمة المفضلة..."
                : "Loading your wishlist..."}
            </p>
          </section>
        ) : wishlist.length === 0 ? (
          <section className="mt-8 flex min-h-[360px] flex-col items-center justify-center rounded-[1.75rem] border border-[#dfe4e0] bg-white px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <Heart size={25} />
            </div>

            <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[#142019]">
              {isArabic
                ? "قائمة المفضلة فارغة"
                : "Your wishlist is empty"}
            </h2>

            <p className="mt-3 max-w-md text-sm leading-7 text-[#647168]">
              {isArabic
                ? "اضغط على أيقونة القلب بجانب أي منتج لحفظه هنا."
                : "Select the heart icon beside a product to save it here."}
            </p>

            <Link
              href="/products"
              className="group mt-7 flex min-h-[50px] items-center justify-center gap-3 rounded-full bg-[#0a583b] px-7 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#073f2c]"
            >
              <span>
                {isArabic ? "تصفح المنتجات" : "Explore products"}
              </span>

              <ContinueArrow
                size={15}
                className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              />
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-8 flex items-center justify-between gap-4">
              <h2 className="text-xl font-extrabold text-[#142019] sm:text-2xl">
                {isArabic ? "المنتجات المحفوظة" : "Saved products"}
              </h2>

              <Link
                href="/products"
                className="group flex items-center gap-2 text-sm font-extrabold text-[#0a583b]"
              >
                <span>
                  {isArabic ? "متابعة التسوق" : "Continue shopping"}
                </span>

                <ContinueArrow
                  size={14}
                  className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                />
              </Link>
            </div>

            <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">
              {wishlist.map((product, index) => {
                const hasSale = Number(product.sale_percent || 0) > 0;

                return (
                  <article
                    key={product.id}
                    className={`grid grid-cols-[112px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-7 sm:p-6 ${
                      index !== wishlist.length - 1
                        ? "border-b border-[#e7ebe8]"
                        : ""
                    }`}
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.25rem] bg-[#f7f8f6] p-3 sm:p-5"
                    >
                      {hasSale && (
                        <span className="absolute left-2 top-2 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold text-red-600">
                          -{product.sale_percent}%
                        </span>
                      )}

                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-contain transition duration-500 hover:scale-105"
                        />
                      ) : (
                        <Package size={26} className="text-[#a2aaa4]" />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/products/${product.id}`}
                          className="min-w-0 transition hover:text-[#0a583b]"
                        >
                          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-6 text-[#142019] sm:text-xl">
                            {product.name}
                          </h3>
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeFromWishlist(product.id)}
                          aria-label={
                            isArabic
                              ? `إزالة ${product.name} من المفضلة`
                              : `Remove ${product.name} from wishlist`
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8a948d] transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-baseline gap-2">
                        <p
                          className={`font-extrabold ${
                            hasSale ? "text-red-600" : "text-[#0a583b]"
                          }`}
                        >
                          {formatPrice(product.price)}
                        </p>

                        {hasSale &&
                          product.original_price !== undefined && (
                            <p className="text-xs font-bold text-[#99a29c] line-through">
                              {formatPrice(product.original_price)}
                            </p>
                          )}
                      </div>

                      <p className="mt-1 text-xs text-[#8a948d]">
                        {isArabic ? "السعر الحالي" : "Current price"}
                      </p>

                      <div className="mt-auto pt-5">
                        <Link
                          href={`/products/${product.id}`}
                          className="group flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border border-[#cbd3cd] bg-white px-5 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b] sm:w-fit"
                        >
                          <span>
                            {isArabic ? "عرض المنتج" : "View product"}
                          </span>

                          <ContinueArrow
                            size={14}
                            className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}