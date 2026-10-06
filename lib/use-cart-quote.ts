"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  QuoteResponse,
  QuoteResponseIssue,
  QuoteResponseLine,
} from "@/lib/pricing/quote-response";

/*
  Server prices for the cart, checkout and payment pages.

  The cart in the browser only knows WHAT was added (product, size,
  quantity). Every price shown on these pages comes from the server's
  calculator through this hook: current prices, sale and flash-sale prices,
  promotions, free items, coupon, delivery and the total. The order routes
  run the same calculator, so the total on screen is the total charged.

  While a new answer is on its way (the customer changed a quantity), the
  previous one stays on screen and `updating` is true, so pages can dim the
  numbers instead of flashing wrong ones.
*/

type QuoteCartItem = {
  id: number | string;
  variant_id?: number | string | null;
  quantity: number;
};

export type CartQuoteOptions = {
  couponCode?: string | null;
  governorate?: string | null;
  deliveryArea?: string | null;
  paymentMethod?: "cod" | "transfer";
  /** false = do not ask yet (page still loading its own data). */
  enabled?: boolean;
};

export function cartItemKey(item: {
  id: number | string;
  variant_id?: number | string | null;
}) {
  return `${Number(item.id)}-${
    item.variant_id != null ? Number(item.variant_id) : "base"
  }`;
}

const DEBOUNCE_MS = 250;

export function useCartQuote(
  cart: QuoteCartItem[],
  options: CartQuoteOptions = {}
) {
  const {
    couponCode = null,
    governorate = null,
    deliveryArea = null,
    paymentMethod = "transfer",
    enabled = true,
  } = options;

  const request = useMemo(
    () => ({
      items: cart
        .map((item) => ({
          id: Number(item.id),
          variant_id:
            item.variant_id != null ? Number(item.variant_id) : null,
          quantity: Number(item.quantity),
        }))
        .filter(
          (item) =>
            Number.isInteger(item.id) &&
            item.id > 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        ),
      couponCode: couponCode || null,
      governorate: governorate || null,
      deliveryArea: deliveryArea || null,
      paymentMethod,
    }),
    [cart, couponCode, governorate, deliveryArea, paymentMethod]
  );

  // Everything that can change the answer, as one string.
  const signature = useMemo(() => JSON.stringify(request), [request]);

  const [answer, setAnswer] = useState<{
    signature: string;
    quote: QuoteResponse;
  } | null>(null);

  const [failedSignature, setFailedSignature] = useState<string | null>(
    null
  );

  const [attempt, setAttempt] = useState(0);
  const firstRequest = useRef(true);

  const hasItems = request.items.length > 0;

  useEffect(() => {
    if (!enabled || !hasItems) return;

    const controller = new AbortController();
    const body = signature;

    // The first answer is asked for at once; later changes (quantity
    // buttons pressed several times) wait a moment and send one request.
    const delay = firstRequest.current ? 0 : DEBOUNCE_MS;
    firstRequest.current = false;

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/customer/quote", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        });

        const result = (await response
          .json()
          .catch(() => null)) as QuoteResponse | null;

        if (controller.signal.aborted) return;

        if (!response.ok || !result?.success) {
          setFailedSignature(body);
          return;
        }

        setAnswer({ signature: body, quote: result });
        setFailedSignature(null);
      } catch {
        if (!controller.signal.aborted) {
          setFailedSignature(body);
        }
      }
    }, delay);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [enabled, hasItems, signature, attempt]);

  const retry = useCallback(() => {
    setFailedSignature(null);
    setAttempt((current) => current + 1);
  }, []);

  // An empty cart has nothing to price.
  const quote = hasItems ? answer?.quote ?? null : null;
  const fresh = hasItems && answer?.signature === signature;
  const failed = hasItems && failedSignature === signature;
  const updating = enabled && hasItems && !fresh && !failed;

  const linesByKey = useMemo(() => {
    const map = new Map<string, QuoteResponseLine>();

    for (const line of quote?.lines || []) {
      map.set(line.key, line);
      for (const key of line.requestKeys) map.set(key, line);
    }

    return map;
  }, [quote]);

  const issuesByKey = useMemo(() => {
    const map = new Map<string, QuoteResponseIssue>();

    for (const issue of quote?.issues || []) map.set(issue.key, issue);

    return map;
  }, [quote]);

  const lineFor = useCallback(
    (item: { id: number | string; variant_id?: number | string | null }) =>
      linesByKey.get(cartItemKey(item)) || null,
    [linesByKey]
  );

  const issueFor = useCallback(
    (item: { id: number | string; variant_id?: number | string | null }) =>
      issuesByKey.get(cartItemKey(item)) || null,
    [issuesByKey]
  );

  return {
    /** The latest answer. May be one step behind while `updating`. */
    quote,
    /** true when `quote` is the answer for exactly what is on screen. */
    fresh,
    updating,
    failed,
    retry,
    lineFor,
    issueFor,
  };
}

export type CartQuote = ReturnType<typeof useCartQuote>;

/** Why an item cannot be ordered, in the customer's language. */
export function quoteIssueText(
  issue: QuoteResponseIssue,
  isArabic: boolean
) {
  if (issue.reason === "product_unavailable") {
    return isArabic
      ? "هذا المنتج غير متوفر حالياً. يرجى إزالته للمتابعة."
      : "This product is currently unavailable. Please remove it to continue.";
  }

  if (issue.reason === "price_invalid") {
    return isArabic
      ? "تعذر تحديد سعر هذا المنتج. يرجى إزالته للمتابعة."
      : "This product cannot be priced right now. Please remove it to continue.";
  }

  return isArabic
    ? "هذا الحجم غير متوفر حالياً. يرجى إزالته للمتابعة."
    : "This size is currently unavailable. Please remove it to continue.";
}
