import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/customer-session";
import { hasTrustedOrigin, jsonError } from "@/lib/http";
import { getRequestIp } from "@/lib/rate-limit";
import { takeRateLimitDb } from "@/lib/rate-limit-db";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const MAX_CART_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;
// This amount is server-controlled. The client cannot set or alter it.
const COD_FEE = 50;

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

// --- Pricing/validation helpers: identical rules to the transfer route. ---
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

function variantLabel(
  variant: DatabaseRecord,
  language: "ar" | "en"
) {
  const primary =
    language === "ar"
      ? [
          variant.label_ar,
          variant.name_ar,
          variant.label,
          variant.name,
          variant.label_en,
          variant.name_en,
        ]
      : [
          variant.label_en,
          variant.name_en,
          variant.label,
          variant.name,
          variant.label_ar,
          variant.name_ar,
        ];

  return (
    primary.find(
      (value) =>
        typeof value === "string" &&
        value.trim().length > 0
    ) || null
  ) as string | null;
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

  const productIds = Array.from(
    new Set(normalizedItems.map((item) => item.productId))
  );

  const [
    productsResult,
    variantsResult,
    areaResult,
    thresholdResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        "id, name, name_ar, name_en, price, sale_percent, image_url, is_out_of_stock"
      )
      .in("id", productIds),
    supabaseAdmin
      .from("product_variants")
      .select("*")
      .in("product_id", productIds),
    supabaseAdmin
      .from("delivery_areas")
      .select(
        "id, governorate, area_name, area_name_ar, area_name_en, delivery_fee, is_active"
      )
      .eq("governorate", governorate)
      .eq("is_active", true),
    supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "free_shipping_threshold")
      .maybeSingle(),
  ]);

  if (
    productsResult.error ||
    variantsResult.error ||
    areaResult.error
  ) {
    console.error("COD order validation query failed:", {
      products: productsResult.error,
      variants: variantsResult.error,
      deliveryArea: areaResult.error,
    });
    return jsonError("Could not validate order", 500);
  }

  const products = new Map(
    (productsResult.data || []).map((product) => [
      Number(product.id),
      product,
    ])
  );
  const variantsByProduct = new Map<
    number,
    DatabaseRecord[]
  >();

  for (const variant of variantsResult.data || []) {
    const productId = Number(variant.product_id);
    const productVariants =
      variantsByProduct.get(productId) || [];
    productVariants.push(variant);
    variantsByProduct.set(productId, productVariants);
  }

  const validatedItems: DatabaseRecord[] = [];
  let productsTotal = 0;

  for (const item of normalizedItems) {
    const product = products.get(item.productId);

    if (!product || isUnavailable(product)) {
      return jsonError("A product is unavailable", 409);
    }

    const productVariants =
      variantsByProduct.get(item.productId) || [];
    let variant: DatabaseRecord | null = null;

    if (item.variantId !== null) {
      variant =
        productVariants.find(
          (candidate) =>
            Number(candidate.id) === item.variantId
        ) || null;

      if (!variant) {
        return jsonError(
          "A product option is invalid",
          409
        );
      }
    } else if (productVariants.length > 0) {
      variant =
        [...productVariants]
          .filter((candidate) => !isUnavailable(candidate))
          .sort(
            (first, second) =>
              Number(first.price || 0) -
              Number(second.price || 0)
          )[0] || null;

      if (!variant) {
        return jsonError(
          "A product option is unavailable",
          409
        );
      }
    }

    if (variant && isUnavailable(variant)) {
      return jsonError(
        "A product option is unavailable",
        409
      );
    }

    const unitPrice = finalPrice(
      variant?.price ?? product.price,
      variant?.sale_percent ?? product.sale_percent
    );

    if (unitPrice <= 0) {
      return jsonError("A product price is invalid", 409);
    }

    const productName =
      cleanText(
        product.name ||
          product.name_en ||
          product.name_ar,
        200
      ) || "KAB Pharma product";

    productsTotal += unitPrice * item.quantity;
    validatedItems.push({
      product_id: product.id,
      product_name: productName,
      variant_id: variant?.id ?? null,
      variant_label_ar: variant
        ? variantLabel(variant, "ar")
        : null,
      variant_label_en: variant
        ? variantLabel(variant, "en")
        : null,
      image_url:
        variant?.image_url || product.image_url || null,
      quantity: item.quantity,
      unit_price: unitPrice,
    });
  }

  const deliveryArea = (areaResult.data || []).find(
    (area) => area.area_name === deliveryAreaName
  );

  if (!deliveryArea) {
    return jsonError("Delivery area is unavailable", 409);
  }

  const freeShippingThreshold = Number(
    thresholdResult.data?.value || 0
  );
  const configuredDeliveryFee = Number(
    deliveryArea.delivery_fee || 0
  );
  const deliveryFee =
    freeShippingThreshold > 0 &&
    productsTotal >= freeShippingThreshold
      ? 0
      : configuredDeliveryFee;
  const orderTotal =
    productsTotal +
    deliveryFee +
    COD_FEE;

  // Atomic + idempotent creation. If items fail, the order rolls back.
  // If this idempotency key was already used, the existing order is returned.
  const { data: rpcData, error: rpcError } =
    await supabaseAdmin.rpc("create_order_atomic", {
      p_order: {
        customer_name: customerName,
        phone: profile.phone,
        governorate,
        delivery_area: deliveryArea.area_name,
        address,
        delivery_fee: deliveryFee,
        cod_fee: COD_FEE,
        total_price: orderTotal,
        status: "pending",
        payment_method: "cod",
      },
      p_items: validatedItems,
      p_idempotency_key: idempotencyKey,
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