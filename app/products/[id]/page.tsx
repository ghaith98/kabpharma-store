    import { supabase } from "@/lib/supabase";
    import ProductDetailsAddToCart from "./ProductDetailsAddToCart";
    import RelatedProductsSwiper from "./RelatedProductsSwiper";
    import ProductGallery from "./ProductGallery";  

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

      return (
        <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-6 py-12">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-8">
              <a
                href="/"
                className="inline-block rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                ← Back to Home
              </a>
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

                <p className="mt-6 text-3xl font-extrabold text-green-700">
                  {Number(product.price).toLocaleString()} SYP
                </p>

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
      price: Number(product.price),
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
        </main>
      );
    } 