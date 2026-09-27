import { supabaseAdmin } from "@/lib/supabase-admin";

export type PromotionCartLine = {
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  hasSalePrice: boolean;
};

type Promotion = {
  id: string;
  name: string;
  type: "buy_2_get_1" | "buy_1_second_50";
  product_id: number | null;
  variant_id: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  max_uses_per_order: number | null;
};

export type PromotionResult = {
  discountAmount: number;
  promotionId: string;
  promotionName: string;
  affectedQuantity: number;
  productId: number;
  variantId: number | null;
  type: Promotion["type"];
};

export type PromotionEvaluation = {
  promotions: PromotionResult[];
  discountAmount: number;
  autoAdditions: Array<{ productId: number; variantId: number | null; quantity: number }>;
};

function matchingLines(lines: PromotionCartLine[], promotion: Promotion) {
  return lines.filter((line) => {
    const matchesProduct = line.productId === Number(promotion.product_id);
    const matchesVariant = promotion.variant_id == null
      ? line.variantId == null
      : line.variantId === Number(promotion.variant_id);
    return matchesProduct && matchesVariant && !line.hasSalePrice && line.quantity > 0 && line.unitPrice > 0;
  });
}

/** Server-only. Different eligible product offers can apply together. A coupon still competes with their combined discount. */
export async function getPromotionEvaluation(lines: PromotionCartLine[]): Promise<PromotionEvaluation> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("id,name,type,product_id,variant_id,starts_at,ends_at,is_active,max_uses_per_order")
    .eq("is_active", true)
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gte.${now}`);

  if (error || !data?.length) return { promotions: [], discountAmount: 0, autoAdditions: [] };

  const promotions: PromotionResult[] = [];
  const autoAdditions: PromotionEvaluation["autoAdditions"] = [];
  for (const promotion of data as Promotion[]) {
    const matched = matchingLines(lines, promotion);
    const unitPrices = matched
      .flatMap((line) => Array.from({ length: line.quantity }, () => line.unitPrice))
      .sort((a, b) => a - b);
    const possibleUses = promotion.type === "buy_2_get_1"
      ? Math.floor(unitPrices.length / 2)
      : Math.floor(unitPrices.length / 2);
    const uses = Math.min(possibleUses, promotion.max_uses_per_order ?? possibleUses);
    if (uses > 0) {
      const discountAmount = promotion.type === "buy_2_get_1"
        ? unitPrices.slice(0, uses).reduce((sum, price) => sum + price, 0)
        : unitPrices.slice(0, uses).reduce((sum, price) => sum + Math.round(price * 0.5), 0);
      promotions.push({
        discountAmount,
        promotionId: promotion.id,
        promotionName: promotion.type === "buy_2_get_1" ? "Buy 2+1 Free" : "اشتري 1، والثاني بنصف السعر",
        affectedQuantity: uses,
        productId: Number(promotion.product_id),
        variantId: promotion.variant_id == null ? null : Number(promotion.variant_id),
        type: promotion.type,
      });
    }

    // The cart displays these as separate free items at its end. The checkout
    // server adds them to the actual order only when this promotion wins.
    if (promotion.type === "buy_2_get_1") {
      for (const line of matched) {
        const quantity = Math.min(Math.floor(line.quantity / 2), promotion.max_uses_per_order ?? Number.MAX_SAFE_INTEGER);
        if (quantity > 0) autoAdditions.push({ productId: line.productId, variantId: line.variantId, quantity });
      }
    }
  }

  return {
    promotions,
    discountAmount: promotions.reduce((sum, promotion) => sum + promotion.discountAmount, 0),
    autoAdditions,
  };
}
