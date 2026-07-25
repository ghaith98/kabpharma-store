import { supabaseAdmin } from "@/lib/supabase-admin";

export type CouponResult = {
  id: number;
  code: string;
  discountAmount: number;
  oneUsePerCustomer: boolean;
};

function cleanCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .slice(0, 40);
}

/** Validates only server-side data. Never trust a client supplied discount. */
export async function getCouponDiscount(
  rawCode: unknown,
  subtotal: number,
  profileId?: number
): Promise<CouponResult | null> {
  const code = cleanCode(rawCode);
  if (!code) return null;

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select(
      "id, code, discount_percent, maximum_discount, minimum_order_amount, is_active, starts_at, expires_at, one_use_per_customer"
    )
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.is_active) {
    throw new Error("Invalid or inactive coupon");
  }

  const now = Date.now();
  if (
    (data.starts_at && new Date(data.starts_at).getTime() > now) ||
    (data.expires_at && new Date(data.expires_at).getTime() <= now)
  ) {
    throw new Error("This coupon is not currently valid");
  }

  const minimum = Number(data.minimum_order_amount || 0);
  if (subtotal < minimum) {
    throw new Error("Order does not meet the coupon minimum");
  }

  const oneUsePerCustomer = data.one_use_per_customer === true;
  if (oneUsePerCustomer && profileId) {
    const { data: priorUse, error: usageError } = await supabaseAdmin
      .from("coupon_usages")
      .select("id")
      .eq("coupon_id", data.id)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (usageError) throw usageError;
    if (priorUse) {
      throw new Error("This coupon has already been used on your account");
    }
  }

  const percent = Math.min(100, Math.max(0, Number(data.discount_percent)));
  const maximum = Number(data.maximum_discount || 0);
  const calculated = Math.round(subtotal * (percent / 100));
  const discountAmount = Math.max(
    0,
    maximum > 0 ? Math.min(calculated, maximum) : calculated
  );

  return {
    id: Number(data.id),
    code,
    discountAmount,
    oneUsePerCustomer,
  };
}

export function couponCode(value: unknown) {
  return cleanCode(value);
}
