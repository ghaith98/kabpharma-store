import { NextRequest, NextResponse } from "next/server";

import { buildQuote, type QuoteItemInput } from "@/lib/pricing/quote";

/*
  Older endpoint, kept so a browser tab that was opened before an update
  keeps working. The pages now use /api/customer/quote.
*/

type Item = { productId?: unknown; variantId?: unknown; quantity?: unknown };

const EMPTY = { promotions: [], discountAmount: 0, autoAdditions: [] };
const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { items?: Item[] };

    const items: QuoteItemInput[] = (
      Array.isArray(body.items) ? body.items.slice(0, 80) : []
    ).flatMap((item) => {
      const productId = Number(item.productId);
      const variantId =
        item.variantId == null ? null : Number(item.variantId);
      const quantity = Math.max(
        0,
        Math.min(99, Math.floor(Number(item.quantity || 0)))
      );

      return Number.isInteger(productId) &&
        productId > 0 &&
        (variantId === null ||
          (Number.isInteger(variantId) && variantId > 0)) &&
        quantity > 0
        ? [{ productId, variantId, quantity }]
        : [];
    });

    if (!items.length) {
      return NextResponse.json(EMPTY, { headers: NO_STORE });
    }

    const quote = await buildQuote({ items, nowMs: Date.now() });

    return NextResponse.json(
      {
        promotions: quote.pricing.promotions,
        discountAmount: quote.pricing.order.promotionDiscountAmount,
        autoAdditions: quote.lines
          .filter((line) => line.freeQuantity > 0)
          .map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.freeQuantity,
          })),
      },
      { headers: NO_STORE }
    );
  } catch {
    return NextResponse.json(EMPTY, { status: 200, headers: NO_STORE });
  }
}
