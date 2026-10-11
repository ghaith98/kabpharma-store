export function couponRuleFailure(error: unknown): string | null {
  const message = typeof error === "object" && error !== null && "message" in error ? String(error.message) : "";
  const reason = message.match(/COUPON_RULE:(\w+)/)?.[1];
  if (!reason) return null;
  if (reason === "not_assigned") return "This coupon is not available for your account.";
  if (reason === "first_order_only") return "This coupon is for your first order only. Review your pending orders.";
  if (reason === "already_used") return "This coupon has already been used on your account.";
  return "This coupon is no longer available. Please review your order.";
}
