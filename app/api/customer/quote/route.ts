import { NextResponse } from "next/server";

import { MAX_ITEM_QUANTITY } from "@/lib/commerce-config";
import { getCustomerSession } from "@/lib/customer-session";
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

  try {
    // Signed-in customers get the "one use per customer" coupon check.
    const session = body.couponCode
      ? await getCustomerSession().catch(() => null)
      : null;

    const nowMs = Date.now();

    const quote = await buildQuote({
      items,
      couponCode: body.couponCode,
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
      couponError: quote.couponError,
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
