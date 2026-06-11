    import { supabase } from "@/lib/supabase";
    import ProductDetailsAddToCart from "./ProductDetailsAddToCart";
    import RelatedProductsSwiper from "./RelatedProductsSwiper";
    import ProductGallery from "./ProductGallery";
    import BackButton from "./BackButton";

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
      const { data: extraImages } = await supabase
  .from("product_images")
  .select("*")
  .eq("product_id", product.id)
  .order("sort_order", { ascending: true });

      const { data: relatedProducts } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(5);
        const galleryImages = [
  product.image_url,
  ...(extraImages?.map((img) => img.image_url) || []),
].filter(Boolean);
const salePercent = Number(product.sale_percent || 0);
const originalPrice = Number(product.price);
const finalPrice =
  salePercent > 0
    ? originalPrice - originalPrice * (salePercent / 100)
    : originalPrice;

      return (
        <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12 pb-28 md:pb-12">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-8">
              <BackButton />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <ProductGallery
  images={galleryImages as string[]}
  productName={product.name}
/>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">
                  {product.name}
                </h1>

                <p className="mt-6 leading-8 text-gray-700">
                  {product.description}
                </p>

               <div className="mt-6">
  {salePercent > 0 && (
    <div className="mb-2 flex items-center gap-3">
      <span className="rounded-full bg-pink-600 px-3 py-1 text-sm font-bold text-white">
        -{salePercent}%
      </span>

      <span className="text-lg font-bold text-gray-400 line-through">
        {originalPrice.toLocaleString()} SYP
      </span>
    </div>
  )}

  <p className="text-3xl font-extrabold text-green-700">
    {Math.round(finalPrice).toLocaleString()} SYP
  </p>
</div>

                <div className="mt-8">
                  {product.is_out_of_stock ? (
  <button
    disabled
    className="w-full rounded-2xl bg-gray-200 py-3 font-semibold text-gray-500 cursor-not-allowed"
  >
    Out of Stock
  </button>
) : (
  <ProductDetailsAddToCart
  product={{
    id: product.id,
    name: product.name,
    price: Math.round(finalPrice),
    original_price: originalPrice,
    sale_percent: salePercent,
    image_url: product.image_url,
  }}
/>
)}
                </div>
              </div>
            </div>
          </div>

          {relatedProducts && relatedProducts.length > 0 && (
            <section className="mx-auto mt-10 max-w-4xl">
              <h2 className="mb-6 text-2xl font-extrabold text-gray-900">
                You may also like
              </h2>

            <RelatedProductsSwiper products={relatedProducts} />
            </section>
          )}
          {!product.is_out_of_stock && (
  <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white p-4 shadow-lg md:hidden">
    <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
      <div>
        {salePercent > 0 && (
          <p className="text-xs font-bold text-gray-400 line-through">
            {originalPrice.toLocaleString()} SYP
          </p>
        )}

        <p className="font-extrabold text-green-700">
          {Math.round(finalPrice).toLocaleString()} SYP
        </p>
      </div>

      <div className="min-w-[160px]">
        <ProductDetailsAddToCart
          product={{
            id: product.id,
            name: product.name,
            price: Math.round(finalPrice),
            original_price: originalPrice,
            sale_percent: salePercent,
            image_url: product.image_url,
          }}
        />
      </div>
    </div>
  </div>
)}
        </main>
      );
    } 