import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  // Only advertise an actual, active, public first-order welcome coupon.
  const { data: c, error } = await supabaseAdmin.from("coupons")
    .select("*")
    .eq("code", "WELCOME10").maybeSingle();
  const now = Date.now();
  const active = !error && c?.is_active && c.first_order_only && c.one_use_per_customer
    && c.assigned_profile_id == null && (c.discount_type == null || c.discount_type === "percent")
    && Number(c.discount_percent) > 0 && Number(c.discount_percent) <= 100
    && (!c.starts_at || new Date(c.starts_at).getTime() <= now)
    && (!c.expires_at || new Date(c.expires_at).getTime() > now);
  return NextResponse.json({ offer: active ? {
    code: c.code, percent: Number(c.discount_percent), minimum: Number(c.minimum_order_amount || 0),
    maximum: Number(c.maximum_discount || 0), saleItems: c.applies_to_sale_items !== false,
    expiresAt: c.expires_at || null,
  } : null }, { headers: { "Cache-Control": "no-store" } });
}
