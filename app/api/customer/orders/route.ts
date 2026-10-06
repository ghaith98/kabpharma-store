import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-session";
import {
  hasTrustedOrigin,
  jsonError,
} from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkShamcashPayment } from "@/lib/shamcash";
import { orderPromotionFields, quoteOrder } from "@/lib/pricing/order-quote";
import { getArchivedOrderSummariesForCustomer } from "@/lib/order-archive";

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

  const query = supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", session.profileId);

  if (session.method === "phone") {
    query.eq("phone", session.phone);
  } else {
    query.eq("email", session.email);
  }

  const { data: profile, error } = await query.maybeSingle();
  return error ? null : profile;
}

export async function GET(request: Request) {
  const profile = await getVerifiedProfile();
  if (!profile) return jsonError("Authentication required", 401);

  const profileSummary =
    new URL(request.url).searchParams.get("view") === "profile";

  if (profileSummary) {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(`id, total_price, status, created_at, order_items (id, product_name, quantity, image_url)`)
      .eq("phone", profile.phone)
      .order("id", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Customer profile order summary lookup failed:", error);
      return jsonError("Could not load recent orders", 500);
    }

    return NextResponse.json(
      { success: true, orders: orders || [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, customer_name, phone, address, total_price, status")
    .eq("phone", profile.phone)
    .order("id", { ascending: false });

  if (error) {
    console.error("Customer orders lookup failed:", error);
    return jsonError("Could not load orders", 500);
  }

  let archivedOrders: Awaited<
    ReturnType<typeof getArchivedOrderSummariesForCustomer>
  > = [];
  try {
    archivedOrders = await getArchivedOrderSummariesForCustomer(profile.phone);
  } catch (archiveError) {
    // The live order list remains available if the optional archive is offline.
    console.error("Archived customer orders lookup failed:", archiveError);
  }

  const allOrders = [...(orders || []), ...archivedOrders].sort(
    (a, b) => Number(b.id) - Number(a.id)
  );

  return NextResponse.json(
    {
      success: true,
      user: { full_name: profile.full_name, phone: profile.phone },
      orders: allOrders,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const profile = await getVerifiedProfile();
  if (!profile) return jsonError("Authentication required", 401);

  // Rate limit
  const ip = getRequestIp(request);
  const [ipLimit, phoneLimit] = await Promise.all([
    takeRateLimitDb({ key: `orders:ip:${ip}`, limit: 20, windowSeconds: 60 * 60 }),
    takeRateLimitDb({ key: `orders:phone:${profile.phone}`, limit: 6, windowSeconds: 10 * 60 }),
  ]);

  if (ipLimit.unavailable || phoneLimit.unavailable) {
    return jsonError("Order service is temporarily unavailable. Please retry shortly.", 503);
  }

  if (!ipLimit.allowed || !phoneLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfterSeconds, phoneLimit.retryAfterSeconds);
    return NextResponse.json(
      { success: false, error: "Too many orders in a short time. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const checkoutValue = body.checkout;
  const cartValue = body.cart;
  const idempotencyKeyValue = body.idempotencyKey;
  const submittedCouponCode = body.couponCode ?? null;
  const shamcashTransactionId = typeof body.shamcashTransactionId === "string"
    ? body.shamcashTransactionId.trim()
    : "";

  const idempotencyKey = (typeof idempotencyKeyValue === "string" ? idempotencyKeyValue : "")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 100);

  if (idempotencyKey.length < 8) {
    return jsonError("Invalid request", 400);
  }

  if (!shamcashTransactionId || !/^\d{6,15}$/.test(shamcashTransactionId)) {
    return jsonError("Please enter a valid Shamcash transaction number.", 400);
  }

  let checkout: CheckoutPayload;
  let submittedCart: SubmittedCartItem[];

  try {
    checkout = checkoutValue as CheckoutPayload;
    submittedCart = cartValue as SubmittedCartItem[];
  } catch {
    return jsonError("Invalid order data", 400);
  }

  if (!Array.isArray(submittedCart) || submittedCart.length === 0 || submittedCart.length > MAX_CART_ITEMS) {
    return jsonError("Invalid cart", 400);
  }

  const customerName = cleanText(checkout.name, 100);
  const governorate = cleanText(checkout.governorate, 100);
  const deliveryAreaName = cleanText(checkout.delivery_area, 150);
  const address = cleanText(checkout.address, 500);

  if (customerName.length < 2 || !governorate || !deliveryAreaName || address.length < 5) {
    return jsonError("Checkout information is incomplete", 400);
  }

  const normalizedItems = submittedCart.map((item) => ({
    productId: Number(item.id),
    variantId: item.variant_id == null ? null : Number(item.variant_id),
    quantity: Number(item.quantity),
  }));

  if (
    normalizedItems.some(
      (item) =>
        !Number.isInteger(item.productId) ||
        item.productId <= 0 ||
        (item.variantId !== null && (!Number.isInteger(item.variantId) || item.variantId <= 0)) ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > MAX_ITEM_QUANTITY
    )
  ) {
    return jsonError("Invalid cart item", 400);
  }

  // Ban check
  const { data: banData, error: banError } = await supabaseAdmin.rpc("check_user_ban", {
    p_phone: profile.phone,
  });

  if (banError) {
    console.error("Customer restriction check failed:", banError);
    return jsonError("Could not verify account status", 503);
  }

  const banResult = Array.isArray(banData) ? banData[0] : banData;
  if (banResult?.is_banned) return jsonError("This account cannot place orders", 403);

  // Check transaction ID not already used
  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("shamcash_transaction_id", shamcashTransactionId)
    .maybeSingle();

  // Also check the permanent ledger (covers orders that were archived).
  // Ignored if the 202609290001 migration has not been run yet.
  const { data: usedTransaction } = await supabaseAdmin
    .from("used_shamcash_transactions")
    .select("transaction_id")
    .eq("transaction_id", shamcashTransactionId)
    .maybeSingle();

  if (existingOrder || usedTransaction) {
    return jsonError("This transaction number has already been used for another order.", 409);
  }

  // One calculation for the whole order: the same one the cart, checkout
  // and payment pages showed (current prices, sale and flash-sale prices,
  // promotions, free items, coupon, delivery).
  const priced = await quoteOrder({
    items: normalizedItems,
    couponCode: submittedCouponCode,
    profileId: profile.id,
    governorate,
    deliveryAreaName,
    paymentMethod: "transfer",
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

  // The transfer must exist, cover the order total and be recent
  // (see lib/shamcash.ts).
  const payment = await checkShamcashPayment(shamcashTransactionId, orderTotal);

  if (!payment.ok) {
    return NextResponse.json(
      { success: false, error: payment.error, code: payment.code },
      { status: payment.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Create order — payment verified
  try {
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "create_order_with_coupon_atomic",
      {
        p_order: {
          customer_name: customerName,
          phone: profile.phone,
          governorate,
          delivery_area: quote.deliveryAreaName,
          address,
          delivery_fee: deliveryFee,
          cod_fee: 0,
          total_price: orderTotal,
          status: "accepted", // Auto-confirmed since payment is verified
          payment_method: "transfer",
          payment_proof_path: null,
          payment_proof_url: null,
          shamcash_transaction_id: shamcashTransactionId,
        },
        p_items: quote.orderItems,
        p_idempotency_key: idempotencyKey,
        p_coupon_code: appliedCoupon?.code || null,
        // Stored the way orders always have been: free items count as
        // ordinary items and their value as part of the discount.
        p_discount_amount: pricing.order.discountAmount,
        p_products_subtotal: pricing.order.productsSubtotal,
        p_customer_profile_id: profile.id,
      }
    );

    if (rpcError) throw rpcError;

    const created = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!created?.id) throw new Error("Order was not created");
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
      { success: true, orderId: created.id, total: orderTotal },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    // Unique violation from the used_shamcash_transactions ledger: the same
    // transaction number was submitted twice at the same time.
    if ((error as { code?: string } | null)?.code === "23505") {
      return jsonError("This transaction number has already been used for another order.", 409);
    }
    console.error("Order creation failed:", error);
    return jsonError("Could not create order", 500);
  }
}
