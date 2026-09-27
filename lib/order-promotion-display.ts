export type StoredPromotionDetail = {
  promotionId?: string;
  promotionName?: string;
  productId?: number | string;
  variantId?: number | string | null;
  affectedQuantity?: number | string;
  type?: "buy_2_get_1" | "buy_1_second_50";
};

export type PromotionOrderItem = {
  id: number | string;
  product_id?: number | string | null;
  variant_id?: number | string | null;
  product_name: string | null;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;
  quantity: number;
  unit_price: number;
};

export type DisplayOrderItem = PromotionOrderItem & {
  isPromotionGift?: boolean;
  promotionName?: string;
};

function sameOptionalId(first: number | string | null | undefined, second: number | string | null | undefined) {
  if (first == null || second == null) return first == null && second == null;
  return Number(first) === Number(second);
}

export function buildOrderItemPresentation(
  orderItems: PromotionOrderItem[] | null | undefined,
  promotionDetails: StoredPromotionDetail[] | null | undefined
) {
  const details = Array.isArray(promotionDetails) ? promotionDetails : [];
  let giftValue = 0;
  const items: DisplayOrderItem[] = [];

  for (const item of orderItems || []) {
    const giftQuantity = details
      .filter((promotion) => promotion.type === "buy_2_get_1" && Number(promotion.productId) === Number(item.product_id) && sameOptionalId(promotion.variantId, item.variant_id))
      .reduce((sum, promotion) => sum + Math.max(0, Number(promotion.affectedQuantity || 0)), 0);
    const appliedGiftQuantity = Math.min(Math.max(0, Number(item.quantity || 0)), giftQuantity);

    if (!appliedGiftQuantity) {
      items.push(item);
      continue;
    }

    const paidQuantity = Math.max(0, Number(item.quantity || 0) - appliedGiftQuantity);
    if (paidQuantity) items.push({ ...item, quantity: paidQuantity });

    const matchingPromotion = details.find(
      (promotion) => promotion.type === "buy_2_get_1" && Number(promotion.productId) === Number(item.product_id) && sameOptionalId(promotion.variantId, item.variant_id)
    );
    items.push({
      ...item,
      id: `${item.id}-promotion-gift`,
      quantity: appliedGiftQuantity,
      unit_price: 0,
      isPromotionGift: true,
      promotionName: matchingPromotion?.promotionName || "Buy 2+1 Free",
    });
    giftValue += Number(item.unit_price || 0) * appliedGiftQuantity;
  }

  return { items, giftValue };
}
