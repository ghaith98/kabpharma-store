"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import {
  CartItem,
  getCart,
  saveCart,
} from "@/lib/cart";

import { useLanguage } from "../../context/LanguageContext";

type CartItemWithVariant =
  CartItem & {
    cart_key?: string;
    product_name?: string;

    variant_id?:
      | number
      | null;

    variant_label_ar?:
      | string
      | null;

    variant_label_en?:
      | string
      | null;
  };

export default function CartPage() {
  const { lang } =
    useLanguage();
  const router = useRouter();

  const isArabic =
    lang === "ar";

  const [
    cart,
    setCart,
  ] = useState<
    CartItemWithVariant[]
  >([]);

  const [
    freeShippingThreshold,
    setFreeShippingThreshold,
  ] = useState(0);

  const [
    showAccountModal,
    setShowAccountModal,
  ] = useState(false);

  const BackArrow =
    isArabic
      ? ArrowRight
      : ArrowLeft;

  const ContinueArrow =
    isArabic
      ? ArrowLeft
      : ArrowRight;

  useEffect(() => {
    setCart(
      getCart() as CartItemWithVariant[]
    );

    void loadFreeShippingThreshold();
  }, []);

  useEffect(() => {
    if (!showAccountModal) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        setShowAccountModal(
          false
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showAccountModal]);

  async function loadFreeShippingThreshold() {
    const { data, error } =
      await supabase
        .from("settings")
        .select("value")
        .eq(
          "key",
          "free_shipping_threshold"
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Failed to load free shipping threshold:",
        error
      );

      return;
    }

    setFreeShippingThreshold(
      Number(data?.value || 0)
    );
  }

  function formatPrice(
    value: number
  ) {
    return `${Math.round(
      Number(value || 0)
    ).toLocaleString()} SYP`;
  }

  function getCartItemKey(
    item: CartItemWithVariant
  ) {
    return (
      item.cart_key ||
      `${item.id}-${
        item.variant_id ||
        "base"
      }`
    );
  }

  function syncCart(
    updatedCart: CartItemWithVariant[]
  ) {
    setCart(updatedCart);

    saveCart(
      updatedCart as CartItem[]
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  }

  function updateQuantity(
    itemKey: string,
    quantity: number
  ) {
    if (quantity < 1) {
      return;
    }

    const updatedCart =
      cart.map((item) =>
        getCartItemKey(
          item
        ) === itemKey
          ? {
              ...item,
              quantity,
            }
          : item
      );

    syncCart(updatedCart);
  }

  function removeItem(
    itemKey: string
  ) {
    syncCart(
      cart.filter(
        (item) =>
          getCartItemKey(
            item
          ) !== itemKey
      )
    );
  }

  function clearCart() {
    const confirmed =
      window.confirm(
        isArabic
          ? "هل أنت متأكد من تفريغ السلة؟"
          : "Are you sure you want to clear your cart?"
      );

    if (!confirmed) {
      return;
    }

    syncCart([]);
  }

  const totalSaved =
    cart.reduce(
      (sum, item) => {
        const originalPrice =
          Number(
            item.original_price ||
              item.price
          );

        const currentPrice =
          Number(
            item.price || 0
          );

        return (
          sum +
          Math.max(
            originalPrice -
              currentPrice,
            0
          ) *
            Number(
              item.quantity || 0
            )
        );
      },
      0
    );

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.price || 0
        ) *
          Number(
            item.quantity || 0
          ),
      0
    );

  const itemsCount =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  const remainingForFreeDelivery =
    Math.max(
      freeShippingThreshold -
        total,
      0
    );

  const freeDeliveryProgress =
    freeShippingThreshold > 0
      ? Math.min(
          (total /
            freeShippingThreshold) *
            100,
          100
        )
      : 0;

  const hasFreeDelivery =
    freeShippingThreshold > 0 &&
    total >=
      freeShippingThreshold;

  function goToCheckout(
    event: React.MouseEvent<HTMLAnchorElement>
  ) {
    const savedUser =
      localStorage.getItem(
        "kab_user"
      );

    if (savedUser) {
      return;
    }

    event.preventDefault();

    setShowAccountModal(
      true
    );
  }

  function goToAccount(
    path: "/login" | "/signup"
  ) {
    localStorage.setItem(
      "redirect_after_login",
      "/checkout"
    );

    router.push(path);
  }

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-[#f7f8f6] px-4 py-8 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-12 lg:pb-16"
    >
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <header className="flex flex-col gap-6 border-b border-[#dfe4e0] pb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-10">
          <div
            className={
              isArabic
                ? "text-right"
                : "text-left"
            }
          >
            <p
              className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                isArabic
                  ? "tracking-normal"
                  : "tracking-[0.18em]"
              }`}
            >
              KAB Pharma
            </p>

            <h1
              className={`mt-3 font-extrabold text-[#142019] ${
                isArabic
                  ? "text-4xl leading-tight [font-family:Tahoma,Arial,sans-serif] sm:text-5xl"
                  : "text-4xl tracking-[-0.045em] sm:text-6xl"
              }`}
            >
              {isArabic
                ? "سلة التسوق"
                : "Shopping bag"}
            </h1>

            <p className="mt-3 text-sm leading-7 text-[#647168] sm:text-base">
              {cart.length > 0
                ? isArabic
                  ? `${itemsCount.toLocaleString()} قطعة في سلتك`
                  : `${itemsCount.toLocaleString()} ${
                      itemsCount === 1
                        ? "item"
                        : "items"
                    } in your bag`
                : isArabic
                ? "سلتك فارغة حالياً"
                : "Your bag is currently empty"}
            </p>
          </div>

          <Link
            href="/products"
            className="group inline-flex w-fit items-center gap-2 border-b border-[#142019] pb-1 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
          >
            <BackArrow
              size={16}
              className="transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
            />

            <span>
              {isArabic
                ? "متابعة التسوق"
                : "Continue shopping"}
            </span>
          </Link>
        </header>

        {cart.length === 0 ? (
          /* Empty cart */
          <section className="flex min-h-[440px] flex-col items-center justify-center border-b border-[#dfe4e0] px-5 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
              <ShoppingBag
                size={26}
                strokeWidth={1.6}
              />
            </div>

            <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[#142019] sm:text-3xl">
              {isArabic
                ? "سلة التسوق فارغة"
                : "Your shopping bag is empty"}
            </h2>

            <p className="mt-3 max-w-md text-sm leading-7 text-[#647168]">
              {isArabic
                ? "تصفّح منتجاتنا واختر ما يناسب روتين العناية الخاص بك."
                : "Explore our products and choose the essentials that fit your care routine."}
            </p>

            <Link
              href="/products"
              className="group mt-7 inline-flex min-h-[50px] items-center justify-center gap-3 rounded-full bg-[#0a583b] px-7 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-lg"
            >
              <span>
                {isArabic
                  ? "اكتشف المنتجات"
                  : "Discover products"}
              </span>

              <ContinueArrow
                size={16}
                className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              />
            </Link>
          </section>
        ) : (
          <>
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
              <div className="min-w-0">
                {/* Free delivery */}
                {freeShippingThreshold >
                  0 && (
                  <section className="mb-5 rounded-[1.5rem] border border-[#dfe4e0] bg-white p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          hasFreeDelivery
                            ? "bg-[#0a583b] text-white"
                            : "bg-[#edf5f0] text-[#0a583b]"
                        }`}
                      >
                        {hasFreeDelivery ? (
                          <Check
                            size={19}
                            strokeWidth={
                              2.2
                            }
                          />
                        ) : (
                          <Truck
                            size={19}
                            strokeWidth={
                              1.8
                            }
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-extrabold text-[#142019]">
                              {hasFreeDelivery
                                ? isArabic
                                  ? "تم تفعيل التوصيل المجاني"
                                  : "Free delivery unlocked"
                                : isArabic
                                ? "أنت قريب من التوصيل المجاني"
                                : "You’re close to free delivery"}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-[#647168]">
                              {hasFreeDelivery
                                ? isArabic
                                  ? "طلبك مؤهل للحصول على توصيل مجاني."
                                  : "Your order now qualifies for free delivery."
                                : isArabic
                                ? `أضف ${formatPrice(
                                    remainingForFreeDelivery
                                  )} للحصول على توصيل مجاني.`
                                : `Add ${formatPrice(
                                    remainingForFreeDelivery
                                  )} more to unlock free delivery.`}
                            </p>
                          </div>

                          <span className="text-xs font-extrabold text-[#0a583b]">
                            {Math.round(
                              freeDeliveryProgress
                            )}
                            %
                          </span>
                        </div>

                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e7ebe8]">
                          <div
                            className="h-full rounded-full bg-[#0a583b] transition-all duration-500"
                            style={{
                              width: `${freeDeliveryProgress}%`,
                            }}
                          />
                        </div>

                        <div
                          dir="ltr"
                          className="mt-2 flex items-center justify-between text-[11px] font-bold text-[#8a948d]"
                        >
                          <span>
                            {formatPrice(
                              total
                            )}
                          </span>

                          <span>
                            {formatPrice(
                              freeShippingThreshold
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Product list heading */}
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2
                    className={`text-sm font-extrabold uppercase text-[#142019] ${
                      isArabic
                        ? "tracking-normal"
                        : "tracking-[0.12em]"
                    }`}
                  >
                    {isArabic
                      ? "المنتجات المختارة"
                      : "Your selection"}
                  </h2>

                  <button
                    type="button"
                    onClick={
                      clearCart
                    }
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#7a857e] transition hover:text-red-600"
                  >
                    <Trash2
                      size={14}
                    />

                    <span>
                      {isArabic
                        ? "تفريغ السلة"
                        : "Clear bag"}
                    </span>
                  </button>
                </div>

                {/* Products */}
                <section className="overflow-hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white">
                  {cart.map(
                    (item) => {
                      const itemKey =
                        getCartItemKey(
                          item
                        );

                      const variantLabel =
                        isArabic
                          ? item.variant_label_ar ||
                            item.variant_label_en
                          : item.variant_label_en ||
                            item.variant_label_ar;

                      const displayName =
                        item.product_name ||
                        (variantLabel &&
                        item.name.includes(
                          " - "
                        )
                          ? item.name.split(
                              " - "
                            )[0]
                          : item.name);

                      const isOnSale =
                        Number(
                          item.sale_percent ||
                            0
                        ) > 0 &&
                        Number(
                          item.original_price ||
                            0
                        ) >
                          Number(
                            item.price
                          );

                      const itemSubtotal =
                        Number(
                          item.price
                        ) *
                        Number(
                          item.quantity
                        );

                      return (
                        <article
                          key={
                            itemKey
                          }
                          className="grid grid-cols-[104px_minmax(0,1fr)] gap-4 border-b border-[#e7ebe8] p-4 last:border-b-0 sm:grid-cols-[148px_minmax(0,1fr)] sm:gap-6 sm:p-6"
                        >
                          <Link
                            href={`/products/${item.id}`}
                            aria-label={
                              displayName
                            }
                            className="flex aspect-square items-center justify-center overflow-hidden rounded-[1.25rem] bg-[#f7f8f6] p-3 sm:p-4"
                          >
                            {item.image_url ? (
                              <img
                                src={
                                  item.image_url
                                }
                                alt={
                                  displayName
                                }
                                className="h-full w-full object-contain transition duration-500 hover:scale-105"
                              />
                            ) : (
                              <Package
                                size={26}
                                className="text-[#a2aaa4]"
                              />
                            )}
                          </Link>

                          <div className="flex min-w-0 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link
                                  href={`/products/${item.id}`}
                                  className="transition hover:text-[#0a583b]"
                                >
                                  <h3 className="line-clamp-2 text-[15px] font-extrabold leading-6 text-[#142019] sm:text-lg">
                                    {
                                      displayName
                                    }
                                  </h3>
                                </Link>

                                {variantLabel && (
                                  <p className="mt-1.5 text-xs font-bold text-[#647168]">
                                    {isArabic
                                      ? "الخيار: "
                                      : "Option: "}

                                    <span className="text-[#0a583b]">
                                      {
                                        variantLabel
                                      }
                                    </span>
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    itemKey
                                  )
                                }
                                aria-label={
                                  isArabic
                                    ? `إزالة ${displayName}`
                                    : `Remove ${displayName}`
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8a948d] transition hover:bg-red-50 hover:text-red-600"
                              >
                                <X
                                  size={
                                    17
                                  }
                                />
                              </button>
                            </div>

                            <div className="mt-4">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <p
                                  className={`font-extrabold ${
                                    isOnSale
                                      ? "text-red-600"
                                      : "text-[#0a583b]"
                                  }`}
                                >
                                  {formatPrice(
                                    item.price
                                  )}
                                </p>

                                {isOnSale && (
                                  <p className="text-xs font-bold text-[#99a29c] line-through">
                                    {formatPrice(
                                      Number(
                                        item.original_price
                                      )
                                    )}
                                  </p>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-[#8a948d]">
                                {isArabic
                                  ? "سعر القطعة"
                                  : "Price per item"}
                              </p>
                            </div>

                            <div className="mt-auto flex flex-col gap-4 pt-5 sm:flex-row sm:items-end sm:justify-between">
                              <div
                                dir="ltr"
                                className="flex h-11 w-fit items-center rounded-full border border-[#dfe4e0] bg-white p-1"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(
                                      itemKey,
                                      item.quantity -
                                        1
                                    )
                                  }
                                  disabled={
                                    item.quantity <=
                                    1
                                  }
                                  aria-label={
                                    isArabic
                                      ? "تقليل الكمية"
                                      : "Decrease quantity"
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#526057] transition hover:bg-[#edf5f0] hover:text-[#0a583b] disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <Minus
                                    size={
                                      15
                                    }
                                  />
                                </button>

                                <span className="min-w-9 text-center text-sm font-extrabold text-[#142019]">
                                  {
                                    item.quantity
                                  }
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(
                                      itemKey,
                                      item.quantity +
                                        1
                                    )
                                  }
                                  aria-label={
                                    isArabic
                                      ? "زيادة الكمية"
                                      : "Increase quantity"
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#526057] transition hover:bg-[#edf5f0] hover:text-[#0a583b]"
                                >
                                  <Plus
                                    size={
                                      15
                                    }
                                  />
                                </button>
                              </div>

                              <div
                                className={
                                  isArabic
                                    ? "text-right sm:text-left"
                                    : "text-left sm:text-right"
                                }
                              >
                                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a948d]">
                                  {isArabic
                                    ? "المجموع"
                                    : "Subtotal"}
                                </p>

                                <p className="mt-1 text-base font-extrabold text-[#142019]">
                                  {formatPrice(
                                    itemSubtotal
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </section>
              </div>

              {/* Desktop summary */}
              <aside className="sticky top-6 hidden rounded-[1.75rem] border border-[#dfe4e0] bg-white p-6 lg:block">
                <p
                  className={`text-[11px] font-extrabold uppercase text-[#0a583b] ${
                    isArabic
                      ? "tracking-normal"
                      : "tracking-[0.16em]"
                  }`}
                >
                  {isArabic
                    ? "ملخص الطلب"
                    : "Order summary"}
                </p>

                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#142019]">
                  {isArabic
                    ? "طلبك"
                    : "Your order"}
                </h2>

                <div className="mt-7 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4 text-[#526057]">
                    <span>
                      {isArabic
                        ? "عدد القطع"
                        : "Items"}
                    </span>

                    <span className="font-bold text-[#142019]">
                      {
                        itemsCount
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-[#526057]">
                    <span>
                      {isArabic
                        ? "المجموع الفرعي"
                        : "Subtotal"}
                    </span>

                    <span className="font-bold text-[#142019]">
                      {formatPrice(
                        total
                      )}
                    </span>
                  </div>

                  {totalSaved >
                    0 && (
                    <div className="flex items-center justify-between gap-4 text-[#0a583b]">
                      <span>
                        {isArabic
                          ? "تخفيض"
                          : "Discount"}
                      </span>

                      <span className="font-extrabold">
                        -
                        {formatPrice(
                          totalSaved
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 text-[#526057]">
                    <span>
                      {isArabic
                        ? "التوصيل"
                        : "Delivery"}
                    </span>

                    <span className="text-xs font-bold text-[#7a857e]">
                      {hasFreeDelivery
                        ? isArabic
                          ? "مجاني"
                          : "Free"
                        : isArabic
                        ? "يُحسب لاحقاً"
                        : "Calculated next"}
                    </span>
                  </div>
                </div>

                <div className="my-6 h-px bg-[#dfe4e0]" />

                <div className="flex items-end justify-between gap-5">
                  <span className="font-extrabold text-[#142019]">
                    {isArabic
                      ? "إجمالي السلة"
                      : "Cart total"}
                  </span>

                  <span className="text-xl font-extrabold text-[#0a583b]">
                    {formatPrice(
                      total
                    )}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  onClick={
                    goToCheckout
                  }
                  className="group mt-6 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#073f2c] hover:shadow-lg"
                >
                  <span>
                    {isArabic
                      ? "متابعة إتمام الطلب"
                      : "Continue to checkout"}
                  </span>

                  <ContinueArrow
                    size={16}
                    className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  />
                </Link>

                <p className="mt-3 text-center text-[11px] leading-5 text-[#8a948d]">
                  {isArabic
                    ? "سيتم تحديد عنوان ورسوم التوصيل في الخطوة التالية."
                    : "Delivery address and fees are confirmed in the next step."}
                </p>

                <div className="mt-7 border-t border-[#e7ebe8] pt-5">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-[#0a583b]"
                    />

                    <div>
                      <p className="text-xs font-extrabold text-[#142019]">
                        {isArabic
                          ? "طلب موثّق"
                          : "Verified checkout"}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#7a857e]">
                        {isArabic
                          ? "يتم ربط طلبك بحسابك لتتمكن من متابعة حالته."
                          : "Your order is connected to your account so you can track its status."}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      {/* Mobile checkout bar */}
      {cart.length > 0 && (
        <div
          dir={
            isArabic
              ? "rtl"
              : "ltr"
          }
          className="fixed inset-x-0 bottom-16 z-50 border-t border-[#dfe4e0] bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(20,32,25,0.08)] backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#7a857e]">
                {isArabic
                  ? "إجمالي السلة"
                  : "Cart total"}
              </p>

              <p className="mt-0.5 whitespace-nowrap text-base font-extrabold text-[#142019]">
                {formatPrice(
                  total
                )}
              </p>
            </div>

            <Link
              href="/checkout"
              onClick={
                goToCheckout
              }
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#0a583b] px-5 text-sm font-extrabold text-white transition active:scale-[0.98]"
            >
              <span>
                {isArabic
                  ? "إتمام الطلب"
                  : "Checkout"}
              </span>

              <ContinueArrow
                size={15}
              />
            </Link>
          </div>
        </div>
      )}

      {/* Account modal */}
      {showAccountModal && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-center bg-[#07130d]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowAccountModal(
                false
              );
            }
          }}
        >
          <div
            dir={
              isArabic
                ? "rtl"
                : "ltr"
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-account-title"
            className="w-full rounded-t-[2rem] bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-[2rem] sm:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f0] text-[#0a583b]">
                <UserRound
                  size={21}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAccountModal(
                    false
                  )
                }
                aria-label={
                  isArabic
                    ? "إغلاق"
                    : "Close"
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f5f3] text-[#526057] transition hover:bg-[#e7ebe8]"
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <h2
              id="cart-account-title"
              className="mt-6 text-2xl font-extrabold tracking-tight text-[#142019]"
            >
              {isArabic
                ? "سجّل الدخول لإتمام طلبك"
                : "Sign in to complete your order"}
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#647168]">
              {isArabic
                ? "يساعدك الحساب على إتمام الطلب ومتابعة حالته وتفاصيل التوصيل."
                : "Your account lets you complete checkout and follow the status and delivery details of your order."}
            </p>

            <button
              type="button"
              onClick={() =>
                goToAccount(
                  "/login"
                )
              }
              className="mt-7 min-h-[50px] w-full rounded-full bg-[#0a583b] px-6 text-sm font-extrabold text-white transition hover:bg-[#073f2c]"
            >
              {isArabic
                ? "تسجيل الدخول"
                : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() =>
                goToAccount(
                  "/signup"
                )
              }
              className="mt-3 min-h-[50px] w-full rounded-full border border-[#cbd3cd] bg-white px-6 text-sm font-extrabold text-[#142019] transition hover:border-[#0a583b] hover:text-[#0a583b]"
            >
              {isArabic
                ? "إنشاء حساب جديد"
                : "Create an account"}
            </button>

            <button
              type="button"
              onClick={() =>
                setShowAccountModal(
                  false
                )
              }
              className="mx-auto mt-5 block text-xs font-bold text-[#7a857e] underline decoration-[#cbd3cd] underline-offset-4 transition hover:text-[#142019]"
            >
              {isArabic
                ? "العودة إلى السلة"
                : "Return to bag"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
