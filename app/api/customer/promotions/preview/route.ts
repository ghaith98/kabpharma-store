import { NextRequest, NextResponse } from "next/server";
import { hasMainSize } from "@/lib/product-options";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPromotionEvaluation, type PromotionCartLine } from "@/lib/promotions";

type Item = { productId?: unknown; variantId?: unknown; quantity?: unknown };

function finalPrice(price: unknown, salePercent: unknown) {
  const amount = Math.max(0, Number(price || 0));
  const discount = Math.min(100, Math.max(0, Number(salePercent || 0)));
  return Math.round(amount * (1 - discount / 100));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { items?: Item[] };
    const items = Array.isArray(body.items) ? body.items.slice(0, 80) : [];
    const productIds = [...new Set(items.map((item) => Number(item.productId)).filter((id) => Number.isInteger(id) && id > 0))];
    if (!productIds.length) return NextResponse.json({ promotions: [], discountAmount: 0, autoAdditions: [] });

    const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
      supabaseAdmin.from("products").select("id,price,sale_percent,size_ar,size_en,category_id,is_out_of_stock").in("id", productIds),
      supabaseAdmin.from("product_variants").select("*").in("product_id", productIds),
    ]);
    if (productsError || variantsError) throw new Error("Promotion preview lookup failed");

    const productMap = new Map((products || []).map((product) => [Number(product.id), product]));
    const variantMap = new Map((variants || []).map((variant) => [Number(variant.id), variant]));
    const variantsByProduct = new Map<number, NonNullable<typeof variants>>();
    for (const variant of variants || []) {
      const productVariants = variantsByProduct.get(Number(variant.product_id)) || [];
      productVariants.push(variant);
      variantsByProduct.set(Number(variant.product_id), productVariants);
    }
    const lines: PromotionCartLine[] = [];
    for (const item of items) {
      const product = productMap.get(Number(item.productId));
      const requestedVariant = item.variantId == null ? null : variantMap.get(Number(item.variantId));
      const variant = requestedVariant || (item.variantId == null && !hasMainSize(product)
        ? [...(variantsByProduct.get(Number(item.productId)) || [])]
            .sort((first, second) => Number(first.price || 0) - Number(second.price || 0))[0] || null
        : null);
      const quantity = Math.max(0, Math.min(99, Math.floor(Number(item.quantity || 0))));
      if (!product || product.is_out_of_stock || !quantity) continue;
      lines.push({
        productId: Number(product.id),
        variantId: variant?.id != null ? Number(variant.id) : null,
        quantity,
        unitPrice: finalPrice(variant?.price ?? product.price, product.sale_percent),
        hasSalePrice: Number(product.sale_percent ?? 0) > 0,
      });
    }
    const evaluation = await getPromotionEvaluation(lines);
    return NextResponse.json(evaluation, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ promotions: [], discountAmount: 0, autoAdditions: [] }, { status: 200, headers: { "Cache-Control": "no-store" } });
  }
}
