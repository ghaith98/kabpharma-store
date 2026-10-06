import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";
import { hasMainSize } from "@/lib/product-options";
import {
  normalizePromotionRow,
  normalizeTiers,
  promotionLabel,
  type PromotionKind,
  type PromotionScope,
} from "@/lib/pricing/rules";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/*
  Admin > Promotions.

  GET     list every promotion (or, with ?productId=, a product's sizes)
  POST    create a promotion
  PUT     change a promotion
  PATCH   pause / resume promotions
  DELETE  delete promotions

  Everything is checked here again, whatever the admin page sent: a
  promotion that is saved is always one the price calculator understands.
*/

const KINDS: PromotionKind[] = [
  "buy_x_get_y",
  "quantity_discount",
  "flash_sale",
  "free_delivery",
];

const NO_STORE = { "Cache-Control": "no-store" };

type Row = Record<string, unknown>;

async function requireAdmin(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  return admin ? null : jsonError("Admin access required", 403);
}

function validIds(value: unknown) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id): id is string =>
              typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)
          )
        ),
      ]
    : [];
}

function positiveInt(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function toIso(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

/** Shop pages are cached for a minute; show the change right away. */
function refreshStorefront() {
  try {
    revalidatePath("/[lang]", "layout");
  } catch (error) {
    // Not fatal: the pages refresh by themselves within a minute.
    console.error("Storefront refresh after promotion change failed:", error);
  }
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const requestedProductId = Number(
    request.nextUrl.searchParams.get("productId")
  );

  if (Number.isInteger(requestedProductId) && requestedProductId > 0) {
    const { data: variants, error } = await supabaseAdmin
      .from("product_variants")
      .select("id,product_id,label_ar,label_en,price,image_url,sort_order")
      .eq("product_id", requestedProductId)
      .order("sort_order", { ascending: true });

    if (error) return jsonError("Could not load product options", 500);

    return NextResponse.json(
      { variants: variants || [] },
      { headers: NO_STORE }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return jsonError("Could not load promotions", 500);

  return NextResponse.json(
    { promotions: data || [] },
    { headers: NO_STORE }
  );
}

/** Checks a submitted promotion and returns the row to save, or an error. */
async function buildPromotionRow(
  body: Row
): Promise<{ row: Row } | { error: string }> {
  const kind = KINDS.find((candidate) => candidate === body.kind);
  if (!kind) return { error: "Choose the type of promotion." };

  // ----- What it applies to -----
  let scope: PromotionScope =
    body.scope === "category" ||
    body.scope === "brand" ||
    body.scope === "all"
      ? body.scope
      : "product";

  if (kind === "free_delivery") scope = "all";

  let productId: number | null = null;
  let categoryId: number | null = null;
  let brandId: number | null = null;
  let allSizes = true;
  let includeMainSize = false;
  let variantIds: number[] = [];

  if (scope === "product") {
    productId = positiveInt(body.productId);
    if (!productId) return { error: "Choose a product." };

    const [{ data: product }, { data: variants, error: variantsError }] =
      await Promise.all([
        supabaseAdmin
          .from("products")
          .select("id, size_ar, size_en")
          .eq("id", productId)
          .maybeSingle(),
        supabaseAdmin
          .from("product_variants")
          .select("id")
          .eq("product_id", productId),
      ]);

    if (!product) return { error: "This product no longer exists." };
    if (variantsError) return { error: "Could not check the product's sizes." };

    const productVariantIds = (variants || []).map((variant) =>
      Number(variant.id)
    );

    // A flash sale is a sale price for the whole product (all its sizes),
    // exactly like the product's own sale %.
    allSizes = kind === "flash_sale" ? true : body.allSizes !== false;

    if (!allSizes) {
      const requested = Array.isArray(body.variantIds)
        ? [...new Set(body.variantIds.map(Number))]
        : [];

      if (requested.some((id) => !productVariantIds.includes(id))) {
        return { error: "One of the chosen sizes no longer exists." };
      }

      variantIds = requested;

      // "The product itself" is a choice when it has a main size, or when
      // it has no other sizes at all.
      const productIsAChoice =
        productVariantIds.length === 0 || hasMainSize(product);

      includeMainSize = body.includeMainSize === true && productIsAChoice;

      if (!includeMainSize && variantIds.length === 0) {
        return { error: "Choose at least one size." };
      }
    }
  } else if (scope === "category") {
    categoryId = positiveInt(body.categoryId);
    if (!categoryId) return { error: "Choose a category." };

    const { data: category } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .maybeSingle();

    if (!category) return { error: "This category no longer exists." };
  } else if (scope === "brand") {
    brandId = positiveInt(body.brandId);
    if (!brandId) return { error: "Choose a brand." };

    const { data: brand } = await supabaseAdmin
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .maybeSingle();

    if (!brand) return { error: "This brand no longer exists." };
  }

  // ----- The offer -----
  let buyQuantity: number | null = null;
  let getQuantity: number | null = null;
  let discountPercent: number | null = null;
  let tiers: Array<{ min_quantity: number; percent: number }> = [];
  let maxUsesPerOrder: number | null = null;
  let minimumOrderAmount = 0;

  if (kind === "buy_x_get_y") {
    buyQuantity = positiveInt(body.buyQuantity);
    getQuantity = positiveInt(body.getQuantity);
    discountPercent = Number(body.discountPercent);

    if (!buyQuantity || buyQuantity > 50) {
      return { error: "\"Buy\" must be a whole number from 1 to 50." };
    }

    if (!getQuantity || getQuantity > 50) {
      return { error: "\"Get\" must be a whole number from 1 to 50." };
    }

    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 1 ||
      discountPercent > 100
    ) {
      return {
        error: "The discount on the extra items must be from 1% to 100% (100% = free).",
      };
    }

    if (body.maxUsesPerOrder != null && body.maxUsesPerOrder !== "") {
      maxUsesPerOrder = positiveInt(body.maxUsesPerOrder);

      if (!maxUsesPerOrder || maxUsesPerOrder > 99) {
        return {
          error: "\"Times per order\" must be a whole number from 1 to 99, or empty.",
        };
      }
    }
  }

  if (kind === "quantity_discount") {
    const submitted = Array.isArray(body.tiers) ? body.tiers : [];

    if (submitted.length === 0) {
      return { error: "Add at least one quantity step." };
    }

    if (submitted.length > 5) {
      return { error: "Use at most 5 quantity steps." };
    }

    for (const entry of submitted) {
      const record = (entry || {}) as Row;
      const minQuantity = Number(record.minQuantity ?? record.min_quantity);
      const percent = Number(record.percent);

      if (!Number.isInteger(minQuantity) || minQuantity < 2 || minQuantity > 99) {
        return {
          error: "Each step's quantity must be a whole number from 2 to 99.",
        };
      }

      if (!Number.isFinite(percent) || percent < 1 || percent > 95) {
        return { error: "Each step's discount must be from 1% to 95%." };
      }
    }

    const normalized = normalizeTiers(submitted);

    if (normalized.length !== submitted.length) {
      return { error: "Two steps use the same quantity." };
    }

    for (let index = 1; index < normalized.length; index += 1) {
      if (normalized[index].percent <= normalized[index - 1].percent) {
        return {
          error: "A bigger quantity must give a bigger discount than the step before it.",
        };
      }
    }

    tiers = normalized.map((tier) => ({
      min_quantity: tier.minQuantity,
      percent: tier.percent,
    }));
  }

  if (kind === "flash_sale") {
    discountPercent = Number(body.discountPercent);

    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 1 ||
      discountPercent > 95
    ) {
      return { error: "The flash sale discount must be from 1% to 95%." };
    }
  }

  if (kind === "free_delivery") {
    minimumOrderAmount = Number(body.minimumOrderAmount || 0);

    if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
      return { error: "The minimum order must be 0 or more." };
    }

    minimumOrderAmount = Math.round(minimumOrderAmount);
  }

  // ----- When -----
  const startsAt = toIso(body.startsAt) || new Date().toISOString();
  const endsAt = toIso(body.endsAt);

  if (body.endsAt && !endsAt) return { error: "The end date is not valid." };

  if (kind === "flash_sale" && !endsAt) {
    return { error: "A flash sale needs an end date (the countdown runs to it)." };
  }

  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return { error: "The end date must be after the start date." };
  }

  // ----- Words -----
  const labelAr = cleanText(body.labelAr, 80) || null;
  const labelEn = cleanText(body.labelEn, 80) || null;

  const row: Row = {
    type: kind,
    scope,
    target_product_id: productId,
    category_id: categoryId,
    brand_id: brandId,
    all_sizes: allSizes,
    include_main_size: includeMainSize,
    variant_ids: variantIds,
    buy_quantity: buyQuantity,
    get_quantity: getQuantity,
    discount_percent: discountPercent,
    tiers,
    minimum_order_amount: minimumOrderAmount,
    max_uses_per_order: maxUsesPerOrder,
    // Only item offers can be combined with a coupon; a flash sale follows
    // each coupon's own "applies to sale items" switch.
    allow_with_coupon:
      (kind === "buy_x_get_y" || kind === "quantity_discount") &&
      body.allowWithCoupon === true,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: body.isActive !== false,
    label_ar: labelAr,
    label_en: labelEn,
    // The old single-target columns are no longer used by new promotions.
    product_id: null,
    variant_id: null,
    updated_at: new Date().toISOString(),
  };

  // Final proof: the price calculator must understand this exact row.
  const rule = normalizePromotionRow({ ...row, id: "check" });
  if (!rule) return { error: "This promotion is incomplete." };

  // The admin-only name. Left empty = the customer-facing label.
  const name = cleanText(body.name, 120) || promotionLabel(rule, "en");
  row.name = name.length >= 2 ? name : `${name} offer`;

  return { row };
}

async function readBody(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Row | null;
  return body && typeof body === "object" ? body : null;
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await readBody(request);
  if (!body) return jsonError("Invalid promotion", 400);

  const result = await buildPromotionRow(body);
  if ("error" in result) return jsonError(result.error, 400);

  const { data, error } = await supabaseAdmin
    .from("promotions")
    .insert(result.row)
    .select("id")
    .single();

  if (error) {
    console.error("Promotion could not be created:", error);
    return jsonError("Could not save the promotion", 500);
  }

  refreshStorefront();

  return NextResponse.json({ success: true, id: data.id });
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await readBody(request);
  const [id] = validIds([body?.id]);
  if (!body || !id) return jsonError("Invalid promotion", 400);

  const result = await buildPromotionRow(body);
  if ("error" in result) return jsonError(result.error, 400);

  const { data, error } = await supabaseAdmin
    .from("promotions")
    .update(result.row)
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("Promotion could not be updated:", error);
    return jsonError("Could not save the promotion", 500);
  }

  if (!data || data.length === 0) {
    return jsonError("This promotion no longer exists", 404);
  }

  refreshStorefront();

  return NextResponse.json({ success: true, id });
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await readBody(request);
  const ids = validIds(body?.ids);

  if (!ids.length || typeof body?.isActive !== "boolean") {
    return jsonError("Invalid promotion", 400);
  }

  const { error } = await supabaseAdmin
    .from("promotions")
    .update({
      is_active: body.isActive,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) return jsonError("Could not update promotion", 500);

  refreshStorefront();

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await readBody(request);
  const ids = validIds(body?.ids);
  if (!ids.length) return jsonError("Invalid promotion", 400);

  const { error } = await supabaseAdmin
    .from("promotions")
    .delete()
    .in("id", ids);

  if (error) return jsonError("Could not delete promotion", 500);

  refreshStorefront();

  return NextResponse.json({ success: true });
}
