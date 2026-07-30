import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/customer-session";
import { getCouponDiscount } from "@/lib/coupons";
import {
  hasTrustedOrigin,
  jsonError,
} from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

type DatabaseRecord = Record<string, unknown>;

function cleanText(value: unknown, maxLength: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function safeDiscount(value: unknown) {
  return Math.min(100, Math.max(0, Number(value || 0)));
}

function finalPrice(price: unknown, discount: unknown) {
  const amount = Number(price || 0);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * (1 - safeDiscount(discount) / 100));
}

function isUnavailable(record: DatabaseRecord) {
  if (record.is_out_of_stock === true) return true;
  const stock = record.stock_quantity ?? record.stock;
  return stock != null && Number(stock) <= 0;
}

function variantLabel(variant: DatabaseRecord, language: "ar" | "en") {
  const primary =
    language === "ar"
      ? [variant.label_ar, variant.name_ar, variant.label, variant.name, variant.label_en, variant.name_en]
      : [variant.label_en, variant.name_en, variant.label, variant.name, variant.label_ar, variant.name_ar];

  return (
    primary.find((value) => typeof value === "string" && value.trim().length > 0) || null
  ) as string | null;
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

  return NextResponse.json(
    {
      success: true,
      user: { full_name: profile.full_name, phone: profile.phone },
      orders: orders || [],
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

  if (existingOrder) {
    return jsonError("This transaction number has already been used for another order.", 409);
  }

  const productIds = Array.from(new Set(normalizedItems.map((item) => item.productId)));

  const [productsResult, variantsResult, areaResult, thresholdResult] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("id, name, name_ar, name_en, price, sale_percent, image_url, is_out_of_stock")
      .in("id", productIds),
    supabaseAdmin.from("product_variants").select("*").in("product_id", productIds),
    supabaseAdmin
      .from("delivery_areas")
      .select("id, governorate, area_name, area_name_ar, area_name_en, delivery_fee, is_active")
      .eq("governorate", governorate)
      .eq("is_active", true),
    supabaseAdmin.from("settings").select("value").eq("key", "free_shipping_threshold").maybeSingle(),
  ]);

  if (productsResult.error || variantsResult.error || areaResult.error) {
    console.error("Order validation query failed:", {
      products: productsResult.error,
      variants: variantsResult.error,
      deliveryArea: areaResult.error,
    });
    return jsonError("Could not validate order", 500);
  }

  const products = new Map(
    (productsResult.data || []).map((product) => [Number(product.id), product])
  );
  const variantsByProduct = new Map<number, DatabaseRecord[]>();

  for (const variant of variantsResult.data || []) {
    const productId = Number(variant.product_id);
    const productVariants = variantsByProduct.get(productId) || [];
    productVariants.push(variant);
    variantsByProduct.set(productId, productVariants);
  }

  const validatedItems: DatabaseRecord[] = [];
  let productsTotal = 0;

  for (const item of normalizedItems) {
    const product = products.get(item.productId);
    if (!product || isUnavailable(product)) return jsonError("A product is unavailable", 409);

    const productVariants = variantsByProduct.get(item.productId) || [];
    let variant: DatabaseRecord | null = null;

    if (item.variantId !== null) {
      variant = productVariants.find((c) => Number(c.id) === item.variantId) || null;
      if (!variant) return jsonError("A product option is invalid", 409);
    } else if (productVariants.length > 0) {
      variant =
        [...productVariants]
          .filter((c) => !isUnavailable(c))
          .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0] || null;
      if (!variant) return jsonError("A product option is unavailable", 409);
    }

    if (variant && isUnavailable(variant)) return jsonError("A product option is unavailable", 409);

    const unitPrice = finalPrice(variant?.price ?? product.price, variant?.sale_percent ?? product.sale_percent);
    if (unitPrice <= 0) return jsonError("A product price is invalid", 409);

    const productName =
      cleanText(product.name || product.name_en || product.name_ar, 200) || "KAB Pharma product";

    productsTotal += unitPrice * item.quantity;
    validatedItems.push({
      product_id: product.id,
      product_name: productName,
      variant_id: variant?.id ?? null,
      variant_label_ar: variant ? variantLabel(variant, "ar") : null,
      variant_label_en: variant ? variantLabel(variant, "en") : null,
      image_url: variant?.image_url || product.image_url || null,
      quantity: item.quantity,
      unit_price: unitPrice,
    });
  }

  const deliveryArea = (areaResult.data || []).find((area) => area.area_name === deliveryAreaName);
  if (!deliveryArea) return jsonError("Delivery area is unavailable", 409);

  const freeShippingThreshold = Number(thresholdResult.data?.value || 0);
  const configuredDeliveryFee = Number(deliveryArea.delivery_fee || 0);
  const deliveryFee =
    freeShippingThreshold > 0 && productsTotal >= freeShippingThreshold ? 0 : configuredDeliveryFee;

  let coupon;
  try {
    coupon = await getCouponDiscount(submittedCouponCode, productsTotal, profile.id);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Coupon validation failed", 400);
  }

  const discountAmount = coupon?.discountAmount || 0;
  const orderTotal = Math.max(0, productsTotal - discountAmount + deliveryFee);

  // Verify Shamcash transaction amount matches order total
  try {
    const SHAMCASH_API_BASE = "https://api.shamcash-api.com/v1";
    const url = new URL(`${SHAMCASH_API_BASE}/transactions`);
    url.searchParams.set("account_id", process.env.SHAMCASH_ACCOUNT_ID!);
    url.searchParams.set("transaction_ids", shamcashTransactionId);

    const shamcashRes = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.SHAMCASH_API_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const shamcashPayload = await shamcashRes.json();

    if (!shamcashRes.ok || shamcashPayload.status !== "success") {
      console.error("Shamcash API error:", shamcashPayload);
      return jsonError("Could not verify payment. Please try again.", 500);
    }

    const transactions: Array<{ transaction_id: number; amount: number; occurred_at: string }> =
      shamcashPayload.data?.transactions || [];

    const match = transactions.find((tx) => String(tx.transaction_id) === shamcashTransactionId);

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found. Please check the number and try again.",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const txAmount = Number(match.amount);
    const diff = Math.abs(txAmount - orderTotal);
    if (diff > 100) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount does not match. Expected ${orderTotal} SYP but transaction shows ${txAmount} SYP.`,
          code: "AMOUNT_MISMATCH",
        },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Shamcash verification failed:", error);
    return jsonError("Could not verify payment. Please try again.", 500);
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
          delivery_area: deliveryArea.area_name,
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
        p_items: validatedItems,
        p_idempotency_key: idempotencyKey,
        p_coupon_code: coupon?.code || null,
        p_discount_amount: discountAmount,
        p_products_subtotal: productsTotal,
        p_customer_profile_id: profile.id,
      }
    );

    if (rpcError) throw rpcError;

    const created = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!created?.id) throw new Error("Order was not created");

    return NextResponse.json(
      { success: true, orderId: created.id, total: orderTotal },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Order creation failed:", error);
    return jsonError("Could not create order", 500);
  }
}