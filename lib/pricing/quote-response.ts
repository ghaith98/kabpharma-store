/*
  What POST /api/customer/quote sends to the browser. Types only, shared by
  the route and by the cart, checkout and payment pages.
*/

import type {
  AppliedPromotion,
  Bilingual,
  CouponOutcome,
  PricingResult,
} from "./engine";

export type QuoteResponseLine = {
  key: string;
  /** Keys the browser may know this line by. */
  requestKeys: string[];
  productId: number;
  variantId: number | null;
  quantity: number;
  freeQuantity: number;
  baseUnitPrice: number;
  unitPrice: number;
  salePercent: number;
  onSale: boolean;
  flashSaleEndsAt: string | null;
  subtotal: number;
  promotionDiscount: number;
  total: number;
  promotion: { id: string; label: Bilingual } | null;
  hint: Bilingual | null;
  nameAr: string;
  nameEn: string;
  variantLabelAr: string | null;
  variantLabelEn: string | null;
  imageUrl: string | null;
};

export type QuoteResponseIssue = {
  key: string;
  productId: number;
  variantId: number | null;
  reason:
    | "product_unavailable"
    | "option_invalid"
    | "option_unavailable"
    | "price_invalid";
};

export type QuoteResponse = {
  success: true;
  /** Send this back when placing the order: holds these prices 30 minutes. */
  priceToken: string | null;
  lines: QuoteResponseLine[];
  issues: QuoteResponseIssue[];
  promotions: AppliedPromotion[];
  coupon: CouponOutcome | null;
  couponError: "invalid" | "not_valid_now" | "already_used" | null;
  delivery: PricingResult["delivery"];
  deliveryAreaFound: boolean | null;
  totals: PricingResult["totals"];
};
