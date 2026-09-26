"use client";

type EventParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

function clean(params: EventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
}

/** Sends anonymous product interactions only; never include personal or payment data. */
export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  // Queue GA4 events until its script has finished loading.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
  window.gtag("event", name, clean(params));
  if (typeof window.clarity === "function") {
    window.clarity("event", name);
  }
}

export function trackPageView(path: string) {
  trackEvent("page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  });
}

export function trackProductView(productId: number, category?: string | null) {
  trackEvent("view_item", { item_id: productId, item_category: category || undefined });
}

export function trackBrandView(brandName: string) {
  trackEvent("view_brand", { brand_name: brandName });
}

export function trackAddToCart(productId: number, quantity: number) {
  trackEvent("add_to_cart", { item_id: productId, quantity });
}

export function trackCheckoutStart(itemCount: number) {
  trackEvent("begin_checkout", { items_count: itemCount });
}

export function trackPurchase() {
  trackEvent("purchase");
}

/** Records that a search occurred without sending the visitor's query. */
export function trackSearch(term: string) {
  if (term.trim().length >= 2) trackEvent("search");
}
