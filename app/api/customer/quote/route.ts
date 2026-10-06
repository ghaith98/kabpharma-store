import { NextResponse } from "next/server";

import { MAX_ITEM_QUANTITY } from "@/lib/commerce-config";
import { getCustomerSession } from "@/lib/customer-session";
import { getRequestIp, takeRateLimit } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { createPriceToken } from "@/lib/pricing/price-token";
import { buildQuote, type QuoteItemInput } from "@/lib/pricing/quote";
import type { QuoteResponse } from "@/lib/pricing/quote-response";

export const dynamic = "force-dynamic";

/*
  The one place prices come from.

  The cart, checkout and payment pages send what is in the cart (product,
  size, quantity) and show exactly what this returns: current prices, sale
  and flash-sale prices, promotions, free items, coupon, delivery and total.
  The order routes run the same calculation, so the total shown here is the
  total charged.

  Works for guests too (the cart page is open to everyone).
*/

type SubmittedItem = {
  id?: unknown;
  productId?: unknown;
  variant_id?: unknown;
  variantId?: unknown;
  quantity?: unknown;
};

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: {
    items?: unknown;
    couponCode?: unknown;
    governorate?: unknown;
    deliveryArea?: unknown;
    paymentMethod?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400, headers: NO_STORE }
    );
  }

  const submitted = Array.isArray(body.items)
    ? (body.items as SubmittedItem[]).slice(0, 80)
    : [];

  const items: QuoteItemInput[] = [];

  for (const item of submitted) {
    const productId = Number(item?.id ?? item?.productId);
    const rawVariant = item?.variant_id ?? item?.variantId;
    const variantId = rawVariant == null ? null : Number(rawVariant);
    const quantity = Math.min(
      MAX_ITEM_QUANTITY,
      Math.floor(Number(item?.quantity))
    );

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      (variantId !== null &&
        (!Number.isInteger(variantId) || variantId <= 0)) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      continue;
    }

    items.push({ productId, variantId, quantity });
  }

  // Prices are public, but each answer costs several database reads:
  // 90 a minute per device is far more than any real cart needs.
  const burst = takeRateLimit({
    key: `quote:${getRequestIp(request)}`,
    limit: 90,
    windowMs: 60_000,
  });

  if (!burst.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: {
          ...NO_STORE,
          "Retry-After": String(burst.retryAfterSeconds),
        },
      }
    );
  }

  try {
    /*
      Coupons are checked for signed-in customers only, and only so many
      times: otherwise this address could be used to guess coupon codes
      without an account. (Coupons are entered on the payment page, which
      needs an account anyway.)
    */
    let couponCode: unknown = null;
    let session: Awaited<ReturnType<typeof getCustomerSession>> = null;

    if (typeof body.couponCode === "string" && body.couponCode.trim()) {
      session = await getCustomerSession().catch(() => null);

      if (session) {
        const tries = await takeRateLimitDb({
          key: `coupon-check:${session.profileId}`,
          limit: 60,
          windowSeconds: 900,
        });

        if (tries.allowed) couponCode = body.couponCode;
      }
    }

    const couponSkipped =
      couponCode == null &&
      typeof body.couponCode === "string" &&
      Boolean(body.couponCode.trim());

    const nowMs = Date.now();

    const quote = await buildQuote({
      items,
      couponCode,
      profileId: session?.profileId ?? null,
      governorate:
        typeof body.governorate === "string" ? body.governorate : null,
      deliveryAreaName:
        typeof body.deliveryArea === "string" ? body.deliveryArea : null,
      paymentMethod: body.paymentMethod === "cod" ? "cod" : "transfer",
      nowMs,
    });

    const response: QuoteResponse = {
      success: true,
      priceToken: createPriceToken(nowMs),
      lines: quote.lines.map((line) => ({
        key: line.key,
        requestKeys: line.requestKeys,
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        freeQuantity: line.freeQuantity,
        baseUnitPrice: line.baseUnitPrice,
        unitPrice: line.unitPrice,
        salePercent: line.salePercent,
        onSale: line.onSale,
        flashSaleEndsAt: line.flashSale?.endsAt ?? null,
        subtotal: line.subtotal,
        promotionDiscount: line.promotionDiscount,
        total: line.total,
        promotion: line.promotion
          ? { id: line.promotion.id, label: line.promotion.label }
          : null,
        hint: line.hint,
        nameAr: line.nameAr,
        nameEn: line.nameEn,
        variantLabelAr: line.variantLabelAr,
        variantLabelEn: line.variantLabelEn,
        imageUrl: line.imageUrl,
      })),
      issues: quote.issues,
      promotions: quote.pricing.promotions,
      coupon: quote.pricing.coupon,
      // A code that was not checked (not signed in, or too many tries) is
      // reported like one that does not exist.
      couponError: couponSkipped ? "invalid" : quote.couponError,
      delivery: quote.pricing.delivery,
      deliveryAreaFound: quote.deliveryAreaFound,
      totals: quote.pricing.totals,
    };

    return NextResponse.json(response, { headers: NO_STORE });
  } catch (error) {
    console.error("Quote failed:", error);

    return NextResponse.json(
      { success: false, error: "Could not calculate prices" },
      { status: 503, headers: NO_STORE }
    );
  }
}
