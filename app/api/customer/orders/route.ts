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

const MAX_PROOF_SIZE = 20 * 1024 * 1024;
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
  return Math.min(
    100,
    Math.max(0, Number(value || 0))
  );
}

function finalPrice(
  price: unknown,
  discount: unknown
) {
  const amount = Number(price || 0);

  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  return Math.round(
    amount * (1 - safeDiscount(discount) / 100)
  );
}

function isUnavailable(record: DatabaseRecord) {
  if (record.is_out_of_stock === true) {
    return true;
  }

  const stock =
    record.stock_quantity ?? record.stock;

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

async function detectProofType(file: File) {
  const bytes = new Uint8Array(
    await file.slice(0, 32).arrayBuffer()
  );
  const ascii = new TextDecoder("latin1").decode(
    bytes
  );

  if (ascii.startsWith("%PDF-")) {
    return {
      extension: "pdf",
      contentType: "application/pdf",
    };
  }

  if (
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return {
      extension: "jpg",
      contentType: "image/jpeg",
    };
  }

  if (
    bytes[0] === 0x89 &&
    ascii.slice(1, 4) === "PNG"
  ) {
    return {
      extension: "png",
      contentType: "image/png",
    };
  }

  if (
    ascii.startsWith("RIFF") &&
    ascii.slice(8, 12) === "WEBP"
  ) {
    return {
      extension: "webp",
      contentType: "image/webp",
    };
  }

  if (
    ascii.startsWith("GIF87a") ||
    ascii.startsWith("GIF89a")
  ) {
    return {
      extension: "gif",
      contentType: "image/gif",
    };
  }

  if (ascii.startsWith("BM")) {
    return {
      extension: "bmp",
      contentType: "image/bmp",
    };
  }

  const isLittleEndianTiff =
    bytes[0] === 0x49 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x2a &&
    bytes[3] === 0x00;
  const isBigEndianTiff =
    bytes[0] === 0x4d &&
    bytes[1] === 0x4d &&
    bytes[2] === 0x00 &&
    bytes[3] === 0x2a;

  if (isLittleEndianTiff || isBigEndianTiff) {
    return {
      extension: "tif",
      contentType: "image/tiff",
    };
  }

  if (ascii.slice(4, 8) === "ftyp") {
    const brand = ascii.slice(8, 12).toLowerCase();

    if (brand === "avif" || brand === "avis") {
      return {
        extension: "avif",
        contentType: "image/avif",
      };
    }

    if (
      ["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(
        brand
      )
    ) {
      return {
        extension: "heic",
        contentType: "image/heic",
      };
    }
  }

  return null;
}

async function getVerifiedProfile() {
  const session = await getCustomerSession();

  if (!session) {
    return null;
  }

  const { data: profile, error } =
    await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", session.profileId)
      .eq("phone", session.phone)
      .maybeSingle();

  return error ? null : profile;
}

export async function GET(request: Request) {
  const profile = await getVerifiedProfile();

  if (!profile) {
    return jsonError(
      "Authentication required",
      401
    );
  }

  const profileSummary =
    new URL(request.url).searchParams.get(
      "view"
    ) === "profile";

  if (profileSummary) {
    const { data: orders, error } =
      await supabaseAdmin
        .from("orders")
        .select(
          `
            id,
            total_price,
            status,
            created_at,
            order_items (
              id,
              product_name,
              quantity,
              image_url
            )
          `
        )
        .eq("phone", profile.phone)
        .order("id", {
          ascending: false,
        })
        .limit(2);

    if (error) {
      console.error(
        "Customer profile order summary lookup failed:",
        error
      );

      return jsonError(
        "Could not load recent orders",
        500
      );
    }

    return NextResponse.json(
      {
        success: true,
        orders: orders || [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const { data: orders, error } =
    await supabaseAdmin
      .from("orders")
      .select(
        "id, customer_name, phone, address, total_price, status"
      )
      .eq("phone", profile.phone)
      .order("id", {
        ascending: false,
      });

  if (error) {
    console.error(
      "Customer orders lookup failed:",
      error
    );

    return jsonError(
      "Could not load orders",
      500
    );
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        full_name: profile.full_name,
        phone: profile.phone,
      },
      orders: orders || [],
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return jsonError("Invalid request origin", 403);
  }

  const profile = await getVerifiedProfile();

  if (!profile) {
    return jsonError(
      "Authentication required",
      401
    );
  }

  // Rate limit order creation per phone and per IP (distributed).
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

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data", 400);
  }

  const proof = formData.get("proof");
  const checkoutValue = formData.get("checkout");
  const cartValue = formData.get("cart");
  const idempotencyKeyValue = formData.get(
    "idempotencyKey"
  );
  const submittedCouponCode = formData.get("couponCode");

  const idempotencyKey = (
    typeof idempotencyKeyValue === "string"
      ? idempotencyKeyValue
      : ""
  )
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 100);

  if (idempotencyKey.length < 8) {
    return jsonError("Invalid request", 400);
  }

  if (!(proof instanceof File)) {
    return jsonError("Payment proof is required", 400);
  }

  if (
    proof.size <= 0 ||
    proof.size > MAX_PROOF_SIZE
  ) {
    return jsonError(
      "Payment proof must be between 1 byte and 20 MB",
      400
    );
  }

  const proofType = await detectProofType(proof);

  if (!proofType) {
    return jsonError(
      "Payment proof must be a supported image or PDF",
      400
    );
  }

  let checkout: CheckoutPayload;
  let submittedCart: SubmittedCartItem[];

  try {
    checkout = JSON.parse(
      String(checkoutValue || "")
    ) as CheckoutPayload;
    submittedCart = JSON.parse(
      String(cartValue || "")
    ) as SubmittedCartItem[];
  } catch {
    return jsonError("Invalid order data", 400);
  }

  if (
    !Array.isArray(submittedCart) ||
    submittedCart.length === 0 ||
    submittedCart.length > MAX_CART_ITEMS
  ) {
    return jsonError("Invalid cart", 400);
  }

  const customerName = cleanText(checkout.name, 100);
  const governorate = cleanText(
    checkout.governorate,
    100
  );
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

  const normalizedItems = submittedCart.map(
    (item) => ({
      productId: Number(item.id),
      variantId:
        item.variant_id == null
          ? null
          : Number(item.variant_id),
      quantity: Number(item.quantity),
    })
  );

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
    new Set(
      normalizedItems.map(
        (item) => item.productId
      )
    )
  );

  const [productsResult, variantsResult, areaResult, thresholdResult] =
    await Promise.all([
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
    console.error("Order validation query failed:", {
      products: productsResult.error,
      variants: variantsResult.error,
      deliveryArea: areaResult.error,
    });

    return jsonError(
      "Could not validate order",
      500
    );
  }

  const products = new Map(
    (productsResult.data || []).map(
      (product) => [Number(product.id), product]
    )
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
      return jsonError(
        "A product is unavailable",
        409
      );
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
          .filter(
            (candidate) => !isUnavailable(candidate)
          )
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
      return jsonError(
        "A product price is invalid",
        409
      );
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
        variant?.image_url ||
        product.image_url ||
        null,
      quantity: item.quantity,
      unit_price: unitPrice,
    });
  }

  const deliveryArea = (
    areaResult.data || []
  ).find(
    (area) => area.area_name === deliveryAreaName
  );

  if (!deliveryArea) {
    return jsonError(
      "Delivery area is unavailable",
      409
    );
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
  let coupon;
  try {
    coupon = await getCouponDiscount(
      submittedCouponCode,
      productsTotal,
      profile.id
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Coupon validation failed",
      400
    );
  }
  const discountAmount = coupon?.discountAmount || 0;
  const orderTotal = Math.max(0, productsTotal - discountAmount + deliveryFee);

  // Deterministic path from the idempotency key so a retry overwrites the
  // same object instead of leaving an orphan upload.
  const proofPath =
    `orders/${profile.id}/${idempotencyKey}.${proofType.extension}`;

  try {
    const { error: uploadError } =
      await supabaseAdmin.storage
        .from("payment-proofs")
        .upload(proofPath, proof, {
          cacheControl: "3600",
          contentType: proofType.contentType,
          upsert: true,
        });

    if (uploadError) {
      throw uploadError;
    }

    // Atomic + idempotent: order + items in one transaction, deduped by
    // idempotency key (same RPC the COD path uses). The bucket is private,
    // so we store only the path; admins view via signed URLs.
    const { data: rpcData, error: rpcError } =
      await supabaseAdmin.rpc("create_order_with_coupon_atomic", {
        p_order: {
          customer_name: customerName,
          phone: profile.phone,
          governorate,
          delivery_area: deliveryArea.area_name,
          address,
          delivery_fee: deliveryFee,
          cod_fee: 0,
          total_price: orderTotal,
          status: "pending",
          payment_method: "transfer",
          payment_proof_path: proofPath,
          payment_proof_url: null,
        },
        p_items: validatedItems,
        p_idempotency_key: idempotencyKey,
        p_coupon_code: coupon?.code || null,
        p_discount_amount: discountAmount,
        p_products_subtotal: productsTotal,
        p_customer_profile_id: profile.id,
      });

    if (rpcError) {
      throw rpcError;
    }

    const created = Array.isArray(rpcData)
      ? rpcData[0]
      : rpcData;

    if (!created?.id) {
      throw new Error("Order was not created");
    }

    return NextResponse.json(
      {
        success: true,
        orderId: created.id,
        total: orderTotal,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Secure order creation failed:", error);

    // Best-effort cleanup of the uploaded proof. On a retry with the same
    // idempotency key the RPC returns the existing order (no duplicate).
    await supabaseAdmin.storage
      .from("payment-proofs")
      .remove([proofPath]);

    return jsonError(
      "Could not create order",
      500
    );
  }
}
