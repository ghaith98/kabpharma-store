import { NextResponse } from "next/server";

/*
  Older endpoint. Coupons are now checked together with the rest of the
  order by /api/customer/quote, because whether a coupon applies depends on
  the items in the cart (sale items, items already in a promotion).

  A browser tab opened before the update may still call this once; it is
  told to refresh.
*/
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Please refresh the page and enter the coupon again.",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}
