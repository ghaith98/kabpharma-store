import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { getRequestIp } from "@/lib/rate-limit";
import { createDeliveryReceipt, readDeliveryReceipt, resolveRoadDelivery } from "@/lib/delivery-route";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  const session = await getCustomerSession().catch(() => null);
  if (!session) return NextResponse.json({success: false, code: "SIGN_IN_REQUIRED"}, {status: 401, headers});
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({success: false, code: "INVALID_REQUEST"}, {status: 400, headers}); }
  if (!body || typeof body !== "object") return NextResponse.json({success: false, code: "INVALID_REQUEST"}, {status: 400, headers});
  // Rechecking a valid receipt does not spend provider credits.
  const existing = readDeliveryReceipt(body.receipt, body.location, session.profileId);
  if (existing) return NextResponse.json({success: true, delivery: existing, receipt: body.receipt}, {headers});
  try {
    for (const key of [`delivery-profile:${session.profileId}`, `delivery-ip:${getRequestIp(request)}`]) {
      const limit = await takeRateLimitDb({key, limit: 30, windowSeconds: 3600});
      if (!limit.allowed) return NextResponse.json({success: false, code: "DELIVERY_RETRY_LATER"}, {status: limit.unavailable ? 503 : 429, headers: {...headers, "Retry-After": String(limit.retryAfterSeconds)}});
    }
    const delivery = await resolveRoadDelivery(body.location, session.profileId, body.language === "ar" ? "ar" : "en");
    return NextResponse.json({success: true, delivery, receipt: createDeliveryReceipt(delivery)}, {headers});
  } catch (error) {
    const code = error instanceof Error && /^DELIVERY_[A-Z_]+$/.test(error.message) ? error.message : "DELIVERY_PROVIDER_UNAVAILABLE";
    // Do not log provider URLs, the API key, or customer coordinates.
    return NextResponse.json({success: false, code}, {status: code === "DELIVERY_LOCATION_REQUIRED" || code === "DELIVERY_OUTSIDE_SYRIA" ? 400 : 503, headers});
  }
}
