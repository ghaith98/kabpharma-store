import { NextRequest, NextResponse } from "next/server";

import { getAdminFromRequest } from "@/lib/admin-auth";
import { jsonError } from "@/lib/http";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type PromotionType = "buy_2_get_1" | "buy_1_second_50";

const promotionName = (type: PromotionType) =>
  type === "buy_2_get_1"
    ? "Buy 2+1 Free"
    : "اشتري 1، والثاني بنصف السعر";

async function requireAdmin(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  return admin ? null : jsonError("Admin access required", 403);
}

function validIds(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)))]
    : [];
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const requestedProductId = Number(request.nextUrl.searchParams.get("productId"));
  if (Number.isInteger(requestedProductId) && requestedProductId > 0) {
    const { data: variants, error } = await supabaseAdmin
      .from("product_variants")
      .select("id,product_id,label_ar,label_en,price,image_url,sort_order")
      .eq("product_id", requestedProductId)
      .order("sort_order", { ascending: true });
    if (error) return jsonError("Could not load product options", 500);
    return NextResponse.json({ variants: variants || [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data: promotionRows, error } = await supabaseAdmin
    .from("promotions")
    .select("id,name,type,product_id,variant_id,is_active,created_at")
    .not("product_id", "is", null)
    .order("created_at", { ascending: false });
  if (error) return jsonError("Could not load promotions", 500);

  const rows = promotionRows || [];
  const productIds = [...new Set(rows.map((promotion) => Number(promotion.product_id)).filter((id) => id > 0))];
  const variantIds = [...new Set(rows.map((promotion) => Number(promotion.variant_id)).filter((id) => id > 0))];
  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
    productIds.length
      ? supabaseAdmin.from("products").select("id,name,name_ar,name_en,price,sale_percent,is_out_of_stock").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    variantIds.length
      ? supabaseAdmin.from("product_variants").select("id,product_id,label_ar,label_en,price,image_url,sort_order").in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (productsError || variantsError) return jsonError("Could not load promotion details", 500);

  const productsById = new Map((products || []).map((product) => [Number(product.id), product]));
  const variantsById = new Map((variants || []).map((variant) => [Number(variant.id), variant]));
  const promotions = rows.map((promotion) => ({
    ...promotion,
    products: productsById.get(Number(promotion.product_id)) || null,
    product_variants: promotion.variant_id == null ? null : variantsById.get(Number(promotion.variant_id)) || null,
  }));
  return NextResponse.json({ promotions }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null) as { productId?: unknown; variantIds?: unknown; type?: unknown } | null;
  const productId = Number(body?.productId);
  const variantIds = Array.isArray(body?.variantIds)
    ? [...new Set(body.variantIds.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
    : [];
  const type = body?.type;
  if (!Number.isInteger(productId) || productId <= 0 || (type !== "buy_2_get_1" && type !== "buy_1_second_50")) {
    return jsonError("Invalid promotion", 400);
  }

  const [{ data: product }, { data: variants, error: variantsError }] = await Promise.all([
    supabaseAdmin.from("products").select("id,sale_percent,is_out_of_stock").eq("id", productId).maybeSingle(),
    supabaseAdmin.from("product_variants").select("id,product_id,label_ar,label_en,price,image_url,sort_order").eq("product_id", productId),
  ]);
  if (!product) return jsonError("Product not found", 404);
  if (variantsError) return jsonError("Could not validate product options", 500);
  if (product.is_out_of_stock || Number(product.sale_percent || 0) > 0) {
    return jsonError("Sale-priced or unavailable products cannot have an automatic promotion", 400);
  }

  const productVariants = variants || [];
  const selectedVariants = productVariants.filter((variant) => variantIds.includes(Number(variant.id)));
  if (productVariants.length > 0 && selectedVariants.length !== variantIds.length) return jsonError("One or more selected product options are invalid", 400);
  if (productVariants.length > 0 && selectedVariants.length === 0) return jsonError("Choose at least one product option", 400);
  if (productVariants.length === 0 && variantIds.length > 0) return jsonError("This product does not have options", 400);

  const targets = selectedVariants.length > 0 ? selectedVariants : [null];
  for (const variant of targets) {
    const variantId = variant?.id == null ? null : Number(variant.id);
    let existingQuery = supabaseAdmin.from("promotions").select("id").eq("product_id", productId);
    existingQuery = variantId == null ? existingQuery.is("variant_id", null) : existingQuery.eq("variant_id", variantId);
    const { data: existing, error: existingError } = await existingQuery.maybeSingle();
    if (existingError) return jsonError("Could not save promotion", 500);

    const promotion = { product_id: productId, variant_id: variantId, type, name: promotionName(type), category_id: null, starts_at: new Date().toISOString(), ends_at: null, is_active: true, max_uses_per_order: null, allow_with_coupon: false };
    const { error } = existing
      ? await supabaseAdmin.from("promotions").update(promotion).eq("id", existing.id)
      : await supabaseAdmin.from("promotions").insert(promotion);
    if (error) return jsonError("Could not save promotion", 500);
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null) as { ids?: unknown; isActive?: unknown } | null;
  const ids = validIds(body?.ids);
  if (!ids.length || typeof body?.isActive !== "boolean") return jsonError("Invalid promotion", 400);
  const { error } = await supabaseAdmin.from("promotions").update({ is_active: body.isActive }).in("id", ids);
  if (error) return jsonError("Could not update promotion", 500);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null) as { ids?: unknown } | null;
  const ids = validIds(body?.ids);
  if (!ids.length) return jsonError("Invalid promotion", 400);
  const { error } = await supabaseAdmin.from("promotions").delete().in("id", ids);
  if (error) return jsonError("Could not delete promotion", 500);
  return NextResponse.json({ success: true });
}
