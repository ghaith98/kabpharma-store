"use client";

import { useEffect, useMemo, useState } from "react";

import {
  expireFlashSales,
  nextFlashSaleEnd,
  type FlashSaleFields,
} from "@/lib/pricing/flash";

/*
  Keeps flash-sale prices honest in the browser.

  The server writes live flash sales into the products before a page is
  rendered, and pages are cached for up to a minute. This hook puts a
  product back to its normal price at the exact moment its flash sale ends,
  even if the page stays open, without waiting for a refresh.

  The first render returns the products exactly as the server sent them
  (so the page hydrates cleanly); the check runs right after.
*/

// setTimeout cannot wait longer than this (about 24 days).
const MAX_TIMER_MS = 2_000_000_000;

export function useLiveFlashSales<T>(products: T[]): T[] {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const list = products as Array<FlashSaleFields>;

    if (!list.some((product) => product?.flash_sale_ends_at)) return;

    const now = Date.now();
    const nextEnd = nextFlashSaleEnd(list, now);

    // Already ended (page was cached a little too long): fix right away.
    const alreadyEnded = list.some((product) => {
      if (!product?.flash_sale_ends_at) return false;
      const endsAt = new Date(product.flash_sale_ends_at).getTime();
      return Number.isFinite(endsAt) && endsAt <= now;
    });

    const delay = alreadyEnded
      ? 0
      : nextEnd == null
        ? null
        : Math.min(nextEnd - now + 50, MAX_TIMER_MS);

    if (delay == null) return;

    const timer = window.setTimeout(() => setNowMs(Date.now()), delay);

    return () => window.clearTimeout(timer);
  }, [products, nowMs]);

  return useMemo(
    () =>
      nowMs == null
        ? products
        : (expireFlashSales(
            products as Array<FlashSaleFields>,
            nowMs
          ) as T[]),
    [products, nowMs]
  );
}

/** The same for a single product (product page). */
export function useLiveFlashSale<T>(product: T): T {
  const list = useMemo(() => [product], [product]);

  return useLiveFlashSales(list)[0];
}
