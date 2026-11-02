import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import type { AvailableCoupon } from "@/app/[lang]/payment/AvailableCoupons";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ coupons: [] }, { status: 401, headers });
    const limit = await takeRateLimitDb({ key: `available-coupons:${session.profileId}`, limit: 30, windowSeconds: 60 });
    if (!limit.allowed) return NextResponse.json({ coupons: [] }, { status: 429, headers });
    const { data, error } = await supabaseAdmin.from("coupons")
      .select("code,discount_type,discount_percent,discount_amount,minimum_order_amount,maximum_discount,applies_to_sale_items,first_order_only,starts_at,expires_at")
      .eq("is_active", true)
      .or(`assigned_profile_id.is.null,assigned_profile_id.eq.${session.profileId}`)
      .order("code");
    if (error) throw error;
    const coupons: AvailableCoupon[] = [];
    const now = Date.now();
    for (const row of data || []) {
      if (row.starts_at && !(new Date(row.starts_at).getTime() <= now)) continue;
      if (row.expires_at && !(new Date(row.expires_at).getTime() > now)) continue;
      const type = row.discount_type === "fixed" || row.discount_type === "free_delivery" ? row.discount_type : "percent";
      const percent = Math.min(100, Math.max(0, Number(row.discount_percent) || 0));
      const amount = Math.max(0, Number(row.discount_amount) || 0);
      if ((type === "percent" && percent <= 0) || (type === "fixed" && amount <= 0)) continue;
      // Use the same first-order / redemption rules as checkout. Never accept a browser-supplied customer ID.
      const eligibility = await supabaseAdmin.rpc("check_coupon_customer", {
        p_code: row.code, p_profile_id: session.profileId,
        p_exclude_order_id: null, p_exclude_idempotency_key: null,
      });
      if (eligibility.error) throw eligibility.error;
      if (eligibility.data !== null) continue;
      coupons.push({ code: row.code, type, percent, amount,
        minimum: Math.max(0, Number(row.minimum_order_amount) || 0),
        maximum: Math.max(0, Number(row.maximum_discount) || 0),
        firstOrderOnly: row.first_order_only === true,
        saleItems: row.applies_to_sale_items !== false,
      });
    }
    return NextResponse.json({ coupons, profileId: String(session.profileId) }, { headers });
  } catch (error) {
    console.error("Available coupons could not be loaded:", error);
    return NextResponse.json({ coupons: [] }, { status: 503, headers });
  }
}
