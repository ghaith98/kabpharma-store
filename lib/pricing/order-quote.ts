import "server-only";

import { readPriceToken } from "./price-token";
import {
  buildQuote,
  type Quote,
  type QuoteItemInput,
} from "./quote";

/*
  Shared by the two order routes (Sham Cash and cash on delivery): price the
  order with the same calculator the customer saw, and turn anything that
  must stop the order into one clear error.
*/

export type OrderQuoteResult =
  | { ok: true; quote: Quote }
  | {
      ok: false;
      status: number;
      error: string;
      /** Machine-readable reason, when the page can react to it. */
      code?: "TOTAL_CHANGED";
      /** The correct total, sent with TOTAL_CHANGED. */
      total?: number;
    };

const ISSUE_MESSAGES = {
  product_unavailable: "A product is unavailable",
  option_invalid: "A product option is invalid",
  option_unavailable: "A product option is unavailable",
  price_invalid: "A product price is invalid",
} as const;

const COUPON_MESSAGES = {
  invalid: "Invalid or inactive coupon",
  not_valid_now: "This coupon is not currently valid",
  already_used: "This coupon has already been used on your account",
} as const;

export async function quoteOrder(options: {
  items: QuoteItemInput[];
  couponCode: unknown;
  profileId: number;
  governorate: string;
  deliveryAreaName: string;
  paymentMethod: "cod" | "transfer";
  /** From the payment page: holds the prices it showed for 30 minutes. */
  priceToken: unknown;
  /** From the payment page: the total it showed the customer. */
  expectedTotal: unknown;
}): Promise<OrderQuoteResult> {
  const realNowMs = Date.now();
  const nowMs = readPriceToken(options.priceToken, realNowMs) ?? realNowMs;

  let quote: Quote;

  try {
    quote = await buildQuote({
      items: options.items,
      couponCode: options.couponCode,
      profileId: options.profileId,
      governorate: options.governorate,
      deliveryAreaName: options.deliveryAreaName,
      paymentMethod: options.paymentMethod,
      nowMs,
    });
  } catch (error) {
    console.error("Order pricing failed:", error);
    return { ok: false, status: 500, error: "Could not validate order" };
  }

  const firstIssue = quote.issues[0];

  if (firstIssue) {
    return {
      ok: false,
      status: 409,
      error: ISSUE_MESSAGES[firstIssue.reason],
    };
  }

  if (quote.lines.length === 0) {
    return { ok: false, status: 400, error: "Invalid cart" };
  }

  if (quote.deliveryAreaFound !== true) {
    return {
      ok: false,
      status: 409,
      error: "Delivery area is unavailable",
    };
  }

  if (quote.couponError) {
    return {
      ok: false,
      status: 400,
      error: COUPON_MESSAGES[quote.couponError],
    };
  }

  // A coupon that is valid but gives nothing on this cart (minimum not
  // reached, no eligible items, delivery already free) is simply not used.
  // The total is the same as without it, so there is nothing to refuse.

  const total = quote.pricing.totals.total;
  const expectedTotal =
    options.expectedTotal == null ? null : Number(options.expectedTotal);

  // The page showed a different total than the one about to be charged
  // (a price or promotion changed and the price hold has run out).
  // Stop, so nobody is charged an amount they did not see.
  if (
    expectedTotal != null &&
    Number.isFinite(expectedTotal) &&
    Math.round(expectedTotal) !== total
  ) {
    return {
      ok: false,
      status: 409,
      code: "TOTAL_CHANGED",
      total,
      error: `Prices have changed. The order total is now ${total} SYP. Please review it and try again.`,
    };
  }

  return { ok: true, quote };
}

/** The promotion columns saved on the order, or null when there are none. */
export function orderPromotionFields(quote: Quote) {
  const promotions = quote.pricing.promotions;

  if (promotions.length === 0) return null;

  const ids = [...new Set(promotions.map((item) => item.promotionId))];
  const names = [...new Set(promotions.map((item) => item.labelAr))];

  return {
    promotion_id: ids.length === 1 ? ids[0] : null,
    promotion_name: names.join(" + ").slice(0, 300),
    promotion_discount_amount: quote.pricing.order.promotionDiscountAmount,
    promotion_details: promotions,
  };
}
