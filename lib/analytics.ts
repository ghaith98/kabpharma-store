"use client";

type EventParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    kabMetaPixelReady?: boolean;
    clarity?: (...args: unknown[]) => void;
  }
}

function clean(params: EventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
}

type MetaEvent = "AddToCart" | "InitiateCheckout" | "Purchase";
const pendingMetaEvents: unknown[][] = [];
const trackedPurchases = new Set<string>();
const metaReadyEvent = "kab-meta-pixel-ready";
let waitingForMeta = false;

function sendMetaEvent(args: unknown[]) {
  try {
    window.fbq?.(...args);
  } catch {
    // Analytics must never interrupt shopping.
  }
}

function trackMeta(name: MetaEvent, params: EventParams, eventId?: string) {
  if (typeof window === "undefined") return;
  const args = ["track", name, params, ...(eventId ? [{ eventID: eventId }] : [])];
  if (window.kabMetaPixelReady && typeof window.fbq === "function") {
    sendMetaEvent(args);
    return;
  }
  if (pendingMetaEvents.length >= 50) pendingMetaEvents.shift();
  pendingMetaEvents.push(args);
  if (!waitingForMeta) {
    waitingForMeta = true;
    window.addEventListener(metaReadyEvent, () => {
      waitingForMeta = false;
      pendingMetaEvents.splice(0).forEach(sendMetaEvent);
    }, { once: true });
  }
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
  trackMeta("AddToCart", { num_items: quantity });
}

export function trackCheckoutStart(itemCount: number) {
  trackEvent("begin_checkout", { items_count: itemCount });
}

export function trackMetaCheckoutStart(itemCount: number) {
  if (itemCount > 0) trackMeta("InitiateCheckout", { num_items: itemCount });
}

export function trackPurchase(orderId: unknown, total: unknown) {
  trackEvent("purchase");
  if (typeof window === "undefined" ||
      (typeof orderId !== "string" && typeof orderId !== "number") || !String(orderId).trim() ||
      typeof total !== "number" || !Number.isFinite(total) || total < 0) return;

  const eventId = `kab-order-${orderId}`;
  if (trackedPurchases.has(eventId)) return;
  try {
    if (window.sessionStorage.getItem(eventId)) return;
    window.sessionStorage.setItem(eventId, "1");
  } catch {
    // Keep in-memory deduplication if browser storage is unavailable.
  }
  trackedPurchases.add(eventId);
  trackMeta("Purchase", { value: total, currency: "SYP" }, eventId);
}

/** Records that a search occurred without sending the visitor's query. */
export function trackSearch(term: string) {
  if (term.trim().length >= 2) trackEvent("search");
}
