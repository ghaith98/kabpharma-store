import type { StoredPromotionDetail } from "./order-promotion-display";

export type CustomerOrderItem = {
  id: number; product_id: number | null; variant_id: number | null;
  product_name: string | null; variant_label_ar: string | null;
  variant_label_en: string | null; quantity: number; unit_price: number;
};
export type CustomerOrder = {
  id: number; archived: boolean; customer_name: string | null; phone: string | null;
  governorate: string | null; delivery_area: string | null; address: string | null;
  status: string | null; created_at: string | null; delivered_at: string | null;
  finalized_at: string | null; payment_method: string | null;
  shamcash_transaction_id: string | null; coupon_code: string | null;
  promotion_name: string | null; promotion_details: StoredPromotionDetail[] | null;
  products_subtotal: number | null; delivery_fee: number | null; cod_fee: number | null;
  discount_amount: number | null; promotion_discount_amount: number | null;
  total_price: number | null; delivery_location: unknown; order_items: CustomerOrderItem[];
};
export type CustomerDetails = {
  customer: { id: number; full_name: string | null; phone: string | null;
    email: string | null; created_at: string | null };
  restriction: { is_banned: boolean; reason: string | null } | null;
  orders: CustomerOrder[]; nextBefore: number | null; warning: string | null;
};

// Explicit response allowlist: never expose password hashes, session tokens,
// payment-proof images, idempotency keys or future private database columns.
export function presentCustomerOrder(raw: Record<string, unknown>, archived: boolean): CustomerOrder {
  const fields = ["id", "customer_name", "phone", "governorate", "delivery_area", "address",
    "status", "created_at", "delivered_at", "finalized_at", "payment_method",
    "shamcash_transaction_id", "coupon_code", "promotion_name", "promotion_details",
    "products_subtotal", "delivery_fee", "cod_fee", "discount_amount",
    "promotion_discount_amount", "total_price", "delivery_location"] as const;
  const result: Record<string, unknown> = { archived };
  for (const field of fields) result[field] = raw[field] ?? null;
  const itemFields = ["id", "product_id", "variant_id", "product_name", "variant_label_ar",
    "variant_label_en", "quantity", "unit_price"];
  result.order_items = (Array.isArray(raw.order_items) ? raw.order_items : []).map((item) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return Object.fromEntries(itemFields.map((field) => [field, row[field] ?? null]));
  });
  return result as CustomerOrder;
}
