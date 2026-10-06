/*
  How a saved order shows its promotions.

  Each order keeps a list of what the promotions did (orders.promotion_details):
    - free_items     extra items added free (their value is part of the
                     order's discount; here they become "Free gift" rows)
    - line_discount  money taken off a line (buy X get Y at a discount,
                     quantity discount)

  Orders saved before the promotion builder only have `type`
  (buy_2_get_1 = free items, buy_1_second_50 = line discount); both shapes
  are read here.
*/

export type StoredPromotionDetail = {
  promotionId?: string;
  promotionName?: string;
  labelAr?: string;
  labelEn?: string;
  kind?: "free_items" | "line_discount";
  productId?: number | string;
  variantId?: number | string | null;
  affectedQuantity?: number | string;
  discountAmount?: number | string;
  type?: "buy_2_get_1" | "buy_1_second_50";
};

export type PromotionOrderItem = {
  id: number | string;
  product_id?: number | string | null;
  variant_id?: number | string | null;
  product_name: string | null;
  variant_label_ar?: string | null;
  variant_label_en?: string | null;
  image_url?: string | null;
  quantity: number;
  unit_price: number;
};

export type DisplayOrderItem = PromotionOrderItem & {
  isPromotionGift?: boolean;
  promotionName?: string;
  promotionDiscount?: number;
};

function isFreeItems(promotion: StoredPromotionDetail) {
  return promotion.kind
    ? promotion.kind === "free_items"
    : promotion.type === "buy_2_get_1";
}

function isLineDiscount(promotion: StoredPromotionDetail) {
  return promotion.kind
    ? promotion.kind === "line_discount"
    : promotion.type === "buy_1_second_50";
}

function detailName(
  promotion: StoredPromotionDetail,
  language: "ar" | "en" | undefined
) {
  const preferred =
    language === "en"
      ? promotion.labelEn
      : language === "ar"
        ? promotion.labelAr
        : undefined;

  return preferred || promotion.promotionName || promotion.labelAr || "";
}

/**
 * Splits an order's total discount into its promotion part and its coupon
 * part. `giftValue` comes from buildOrderItemPresentation: free items are
 * shown as free rows, so their value is not repeated as a discount.
 */
export function splitOrderDiscounts(
  order: {
    discount_amount?: number | string | null;
    promotion_discount_amount?: number | string | null;
    promotion_name?: string | null;
    coupon_code?: string | null;
  },
  giftValue: number
) {
  const total = Math.max(0, Number(order.discount_amount || 0));

  // Older promotion orders did not always store the promotion part.
  const storedPromotionPart = Math.max(
    0,
    Number(order.promotion_discount_amount || 0)
  );
  const promotionPart = order.promotion_name
    ? Math.min(
        total,
        order.coupon_code ? storedPromotionPart : total
      )
    : 0;

  const couponPart = order.coupon_code
    ? Math.max(0, total - promotionPart)
    : 0;

  return {
    /** Money taken off by promotions, free items not counted. */
    promotionDiscount: Math.max(0, promotionPart - giftValue),
    couponDiscount: couponPart,
    /** Discount that belongs to neither (very old orders). */
    otherDiscount: Math.max(0, total - promotionPart - couponPart),
  };
}

function sameOptionalId(first: number | string | null | undefined, second: number | string | null | undefined) {
  if (first == null || second == null) return first == null && second == null;
  return Number(first) === Number(second);
}

export function buildOrderItemPresentation(
  orderItems: PromotionOrderItem[] | null | undefined,
  promotionDetails: StoredPromotionDetail[] | null | undefined,
  /** Language for the offer names; default = as saved. */
  language?: "ar" | "en"
) {
  const details = Array.isArray(promotionDetails) ? promotionDetails : [];
  let giftValue = 0;
  const items: DisplayOrderItem[] = [];

  for (const item of orderItems || []) {
    const paidPromotionDetails = details.filter(
        (promotion) =>
          isLineDiscount(promotion) &&
          Number(promotion.productId) === Number(item.product_id) &&
          sameOptionalId(promotion.variantId, item.variant_id)
      );
    const paidPromotionName = paidPromotionDetails
      .map((promotion) => detailName(promotion, language))
      .filter((name): name is string => Boolean(name))
      .join(" + ");
    const itemPromotionDiscount = paidPromotionDetails.reduce((sum, promotion) => {
        const storedDiscount = Number(promotion.discountAmount);
        if (Number.isFinite(storedDiscount) && storedDiscount > 0) {
          return sum + storedDiscount;
        }

        return (
          sum +
          Math.round(
            Number(item.unit_price || 0) *
              Math.max(0, Number(promotion.affectedQuantity || 0)) *
              0.5
          )
        );
      }, 0);

    const giftQuantity = details
      .filter((promotion) => isFreeItems(promotion) && Number(promotion.productId) === Number(item.product_id) && sameOptionalId(promotion.variantId, item.variant_id))
      .reduce((sum, promotion) => sum + Math.max(0, Number(promotion.affectedQuantity || 0)), 0);
    const appliedGiftQuantity = Math.min(Math.max(0, Number(item.quantity || 0)), giftQuantity);

    if (!appliedGiftQuantity) {
      items.push({
        ...item,
        promotionName: paidPromotionName || undefined,
        promotionDiscount: itemPromotionDiscount,
      });
      continue;
    }

    const paidQuantity = Math.max(0, Number(item.quantity || 0) - appliedGiftQuantity);
    if (paidQuantity) {
      items.push({
        ...item,
        quantity: paidQuantity,
        promotionName: paidPromotionName || undefined,
        promotionDiscount: itemPromotionDiscount,
      });
    }

    const matchingPromotion = details.find(
      (promotion) => isFreeItems(promotion) && Number(promotion.productId) === Number(item.product_id) && sameOptionalId(promotion.variantId, item.variant_id)
    );
    items.push({
      ...item,
      id: `${item.id}-promotion-gift`,
      quantity: appliedGiftQuantity,
      unit_price: 0,
      isPromotionGift: true,
      promotionName:
        (matchingPromotion && detailName(matchingPromotion, language)) ||
        "Buy 2+1 Free",
    });
    giftValue += Number(item.unit_price || 0) * appliedGiftQuantity;
  }

  return { items, giftValue };
}
