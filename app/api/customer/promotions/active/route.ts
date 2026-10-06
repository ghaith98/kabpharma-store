import { NextResponse } from "next/server";

import { loadActivePromotions } from "@/lib/pricing/quote";
import {
  isPromotionLive,
  toPublicPromotion,
} from "@/lib/pricing/rules";

export const dynamic = "force-dynamic";

/*
  The promotions that are live right now, for the offer badges on product
  cards and product pages and for the "Offers & sale" filter.

  The result is the same for every visitor, so the CDN serves it for
  60 seconds (and a stale copy for 5 more minutes while it refreshes)
  instead of querying the database on every page view.

  Prices never come from here: the cart, checkout and payment pages ask
  /api/customer/quote, which is always exact.
*/
export async function GET() {
  try {
    const nowMs = Date.now();
    const promotions = (await loadActivePromotions())
      .filter((rule) => isPromotionLive(rule, nowMs))
      .map(toPublicPromotion);

    return NextResponse.json(
      { promotions },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { promotions: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
