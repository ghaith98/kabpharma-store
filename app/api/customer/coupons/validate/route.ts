import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/customer-session";
import { getCouponDiscount } from "@/lib/coupons";
import { hasTrustedOrigin, jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }
  const session = await getCustomerSession();
  if (!session) {
    return jsonError("Authentication required", 401);
  }

  let body: { code?: unknown; subtotal?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid coupon data", 400);
  }

  const subtotal = Number(body.subtotal);
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return jsonError("Invalid order subtotal", 400);
  }

  try {
    const coupon = await getCouponDiscount(
      body.code,
      subtotal,
      session.profileId
    );
    if (!coupon) return jsonError("Enter a coupon code", 400);
    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Coupon validation failed",
      400
    );
  }
}
