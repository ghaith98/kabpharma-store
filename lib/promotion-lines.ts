/*
  Shows a product offer's effect on its own cart line.

  The server's promotion preview returns, per promotion, the product/option
  it applies to and the exact discount. "Buy 1, get the 2nd 50% off" lowers
  what that line costs, so the line shows the reduced total. "Buy 2 + 1 free"
  doesn't change the paid line (the free item is listed separately), so it
  is not counted here.
*/

type LinePromotion = {
  type: "buy_2_get_1" | "buy_1_second_50";
  productId: number;
  variantId: number | null;
  discountAmount: number;
};

type LineItem = {
  id: number | string;
  variant_id?: number | string | null;
};

function appliesToLine(promotion: LinePromotion, item: LineItem) {
  if (Number(promotion.productId) !== Number(item.id)) return false;

  return promotion.variantId == null
    ? item.variant_id == null
    : Number(item.variant_id) === Number(promotion.variantId);
}

/** Money taken off this line by "2nd at half price" offers. */
export function getLinePromotionDiscount(
  promotions: readonly LinePromotion[],
  item: LineItem
) {
  return promotions
    .filter(
      (promotion) =>
        promotion.type === "buy_1_second_50" &&
        appliesToLine(promotion, item)
    )
    .reduce(
      (sum, promotion) => sum + Number(promotion.discountAmount || 0),
      0
    );
}

export function linePromotionLabel(isArabic: boolean) {
  return isArabic
    ? "اشتري 1، والثاني بنصف السعر"
    : "Buy 1, get 1 50% off";
}
