import { supabase } from "@/lib/supabase";
import ProductExtraClient from "./ProductExtraClient";
import BackButton from "./BackButton";
import ProductDetailsClient from "./ProductDetailsClient";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    return <main className="p-10 text-center">Product not found</main>;
  }

  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  const { data: extraImages } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const variantIds = (variants || []).map((variant) => variant.id);

  let variantImages: any[] = [];

  if (variantIds.length > 0) {
    const { data } = await supabase
      .from("product_variant_images")
      .select("*")
      .in("variant_id", variantIds)
      .order("sort_order", { ascending: true });

    variantImages = data || [];
  }

  const productVariants = (variants || []).map((variant) => {
    const imagesForVariant = variantImages
      .filter((image) => image.variant_id === variant.id)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));

    return {
      ...variant,
      images:
        imagesForVariant.length > 0
          ? imagesForVariant.map((image) => image.image_url)
          : variant.image_url
          ? [variant.image_url]
          : [],
    };
  });

  const { data: sameCategoryProducts } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .eq("is_out_of_stock", false);

  const { data: allOrderItems } = await supabase
    .from("order_items")
    .select("product_id, quantity");

  const salesCount = (allOrderItems || []).reduce(
    (acc: Record<number, number>, item: any) => {
      if (!item.product_id) return acc;

      acc[item.product_id] =
        (acc[item.product_id] || 0) + Number(item.quantity || 0);

      return acc;
    },
    {}
  );

  const relatedProducts = (sameCategoryProducts || [])
    .sort((a, b) => (salesCount[b.id] || 0) - (salesCount[a.id] || 0))
    .slice(0, 6);

  const normalGalleryImages = [
    product.image_url,
    ...(extraImages?.map((img) => img.image_url) || []),
  ].filter(Boolean);

  const salePercent = Number(product.sale_percent || 0);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <BackButton />
        </div>

        <ProductDetailsClient
          product={product}
          normalGalleryImages={normalGalleryImages as string[]}
          productVariants={productVariants}
          salePercent={salePercent}
        />
      </div>

      <ProductExtraClient
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviews || []}
      />
    </main>
  );
}