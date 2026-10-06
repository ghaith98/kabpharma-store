import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { orderPromotionFields, quoteOrder } from "@/lib/pricing/order-quote";

export const dynamic = "force-dynamic";

const MAX_CART_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;

type SubmittedCartItem = {
  id?: unknown;
  variant_id?: unknown;
  quantity?: unknown;
};

type CheckoutPayload = {
  name?: unknown;
  governorate?: unknown;
  delivery_area?: unknown;
  address?: unknown;
};

function cleanText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

async function getVerifiedProfile() {
  const session = await getCustomerSession();
  if (!session) return null;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", session.profileId)
    .eq("phone", session.phone)
    .maybeSingle();

  return error ? null : profile;
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const profile = await getVerifiedProfile();
  if (!profile) {
    return jsonError("Authentication required", 401);
  }

  // Rate limit order creation per phone and per IP (distributed).
  // COD has no payment proof, so this is the main flood-control here.
  const ip = getRequestIp(request);
  const [ipLimit, phoneLimit] = await Promise.all([
    takeRateLimitDb({
      key: `orders:ip:${ip}`,
      limit: 20,
      windowSeconds: 60 * 60,
    }),
    takeRateLimitDb({
      key: `orders:phone:${profile.phone}`,
      limit: 6,
      windowSeconds: 10 * 60,
    }),
  ]);

  if (ipLimit.unavailable || phoneLimit.unavailable) {
    return jsonError(
      "Order service is temporarily unavailable. Please retry shortly.",
      503
    );
  }

  if (!ipLimit.allowed || !phoneLimit.allowed) {
    const retryAfter = Math.max(
      ipLimit.retryAfterSeconds,
      phoneLimit.retryAfterSeconds
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Too many orders in a short time. Please try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  let body: {
    checkout?: CheckoutPayload;
    cart?: SubmittedCartItem[];
    idempotencyKey?: unknown;
    couponCode?: unknown;
    priceToken?: unknown;
    expectedTotal?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid order data", 400);
  }

  // Idempotency key must be supplied by the client (one per checkout attempt).
  const idempotencyKey = cleanText(body?.idempotencyKey, 100);
  if (idempotencyKey.length < 8) {
    return jsonError("Missing idempotency key", 400);
  }

  const checkout = body?.checkout || {};
  const submittedCart = Array.isArray(body?.cart)
    ? body.cart
    : [];

  if (
    submittedCart.length === 0 ||
    submittedCart.length > MAX_CART_ITEMS
  ) {
    return jsonError("Invalid cart", 400);
  }

  const customerName = cleanText(checkout.name, 100);
  const governorate = cleanText(checkout.governorate, 100);
  const deliveryAreaName = cleanText(
    checkout.delivery_area,
    150
  );
  const address = cleanText(checkout.address, 500);

  if (
    customerName.length < 2 ||
    !governorate ||
    !deliveryAreaName ||
    address.length < 5
  ) {
    return jsonError(
      "Checkout information is incomplete",
      400
    );
  }

  const normalizedItems = submittedCart.map((item) => ({
    productId: Number(item.id),
    variantId:
      item.variant_id == null
        ? null
        : Number(item.variant_id),
    quantity: Number(item.quantity),
  }));

  if (
    normalizedItems.some(
      (item) =>
        !Number.isInteger(item.productId) ||
        item.productId <= 0 ||
        (item.variantId !== null &&
          (!Number.isInteger(item.variantId) ||
            item.variantId <= 0)) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > MAX_ITEM_QUANTITY
    )
  ) {
    return jsonError("Invalid cart item", 400);
  }

  const { data: banData, error: banError } =
    await supabaseAdmin.rpc("check_user_ban", {
      p_phone: profile.phone,
    });

  if (banError) {
    console.error(
      "Customer restriction check failed:",
      banError
    );
    return jsonError(
      "Could not verify account status",
      503
    );
  }

  const banResult = Array.isArray(banData)
    ? banData[0]
    : banData;

  if (banResult?.is_banned) {
    return jsonError(
      "This account cannot place orders",
      403
    );
  }

  // One calculation for the whole order: the same one the cart, checkout
  // and payment pages showed (current prices, sale and flash-sale prices,
  // promotions, free items, coupon, delivery, cash-on-delivery fee).
  const priced = await quoteOrder({
    items: normalizedItems,
    couponCode: body.couponCode,
    profileId: profile.id,
    governorate,
    deliveryAreaName,
    paymentMethod: "cod",
    priceToken: body.priceToken,
    expectedTotal: body.expectedTotal,
  });

  if (!priced.ok) {
    return NextResponse.json(
      {
        success: false,
        error: priced.error,
        ...(priced.code ? { code: priced.code, total: priced.total } : {}),
      },
      { status: priced.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  const quote = priced.quote;
  const pricing = quote.pricing;
  const appliedCoupon = pricing.coupon?.applied ? pricing.coupon : null;
  const deliveryFee = pricing.totals.deliveryFee;
  const orderTotal = pricing.totals.total;

  // Atomic + idempotent creation. If items fail, the order rolls back.
  // If this idempotency key was already used, the existing order is returned.
  const { data: rpcData, error: rpcError } =
    await supabaseAdmin.rpc("create_order_with_coupon_atomic", {
      p_order: {
        customer_name: customerName,
        phone: profile.phone,
        governorate,
        delivery_area: quote.deliveryAreaName,
        address,
        delivery_fee: deliveryFee,
        cod_fee: pricing.totals.codFee,
        total_price: orderTotal,
        status: "pending",
        payment_method: "cod",
      },
      p_items: quote.orderItems,
      p_idempotency_key: idempotencyKey,
      p_coupon_code: appliedCoupon?.code || null,
      // Stored the way orders always have been: free items count as
      // ordinary items and their value as part of the discount.
      p_discount_amount: pricing.order.discountAmount,
      p_products_subtotal: pricing.order.productsSubtotal,
      p_customer_profile_id: profile.id,
    });

  if (rpcError) {
    console.error("COD order creation failed:", rpcError);
    return jsonError("Could not create order", 500);
  }

  const created = Array.isArray(rpcData)
    ? rpcData[0]
    : rpcData;

  if (!created?.id) {
    return jsonError("Could not create order", 500);
  }
  const promotionFields = orderPromotionFields(quote);
  if (promotionFields) {
    const { error: promotionError } = await supabaseAdmin
      .from("orders")
      .update(promotionFields)
      .eq("id", created.id);

    // The order itself is saved and correct; only the "which offer" note
    // on the invoice is missing.
    if (promotionError) {
      console.error("Order promotion details were not saved:", promotionError);
    }
  }

  return NextResponse.json(
    {
      success: true,
      orderId: created.id,
      total: Number(created.total_price ?? orderTotal),
    },
    {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
