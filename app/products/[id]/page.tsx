import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ProductExtraClient from "./ProductExtraClient";
import BackButton from "./BackButton";
import ProductDetailsClient from "./ProductDetailsClient";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function cleanMetaDescription(
  value: string,
  maxLength = 160
) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned
    .slice(0, maxLength - 3)
    .trim()}...`;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return {
      title:
        "المنتج غير موجود | KAB Pharma",

      description:
        "المنتج المطلوب غير موجود.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  /*
    نعتمد العربية لأنها اللغة الرئيسية للموقع.
    في حال لم يوجد اسم عربي نستخدم الإنكليزي.
  */
  const productName =
    product.name_ar ||
    product.name_en ||
    product.name ||
    "KAB Pharma Product";

  const productDescription =
    product.description_ar ||
    product.description_en ||
    product.description ||
    "اكتشف منتجات العناية بالبشرة والشعر من KAB Pharma.";

  const title =
    `${productName} | KAB Pharma`;

  const description =
    cleanMetaDescription(
      productDescription
    );

  const productUrl =
    `https://kabpharma.com/products/${product.id}`;

  const productImage =
    product.image_url || null;

  return {
    title,
    description,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      type: "website",
      url: productUrl,
      siteName: "KAB Pharma",
      title,
      description,

      ...(productImage
        ? {
            images: [
              {
                url: productImage,
                alt: productName,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,

      ...(productImage
        ? {
            images: [productImage],
          }
        : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) {
    return (
      <main className="p-10 text-center">
        Product not found
      </main>
    );
  }

  const [
    reviewsResult,
    extraImagesResult,
    variantsResult,
    sameCategoryResult,
    orderItemsResult,
  ] = await Promise.all([
    supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", {
        ascending: true,
      }),

    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", {
        ascending: true,
      }),

    supabase
      .from("products")
      .select("*")
      .eq(
        "category_id",
        product.category_id
      )
      .neq("id", product.id)
      .eq("is_out_of_stock", false),

    supabase
      .from("order_items")
      .select(
        "product_id, quantity"
      ),
  ]);

  const reviews =
    reviewsResult.data || [];

  const extraImages =
    extraImagesResult.data || [];

  const variants =
    variantsResult.data || [];

  const sameCategoryProducts =
    sameCategoryResult.data || [];

  const allOrderItems =
    orderItemsResult.data || [];

  const variantIds = variants.map(
    (variant) => variant.id
  );

  let variantImages: any[] = [];

  if (variantIds.length > 0) {
    const { data } = await supabase
      .from("product_variant_images")
      .select("*")
      .in("variant_id", variantIds)
      .order("sort_order", {
        ascending: true,
      });

    variantImages = data || [];
  }

  const productVariants = variants.map(
    (variant) => {
      const imagesForVariant =
        variantImages
          .filter(
            (image) =>
              image.variant_id ===
              variant.id
          )
          .sort(
            (a, b) =>
              Number(a.sort_order) -
              Number(b.sort_order)
          );

      return {
        ...variant,

        images:
          imagesForVariant.length > 0
            ? imagesForVariant.map(
                (image) =>
                  image.image_url
              )
            : variant.image_url
            ? [variant.image_url]
            : [],
      };
    }
  );

  const salesCount = allOrderItems.reduce(
    (
      accumulator: Record<
        number,
        number
      >,
      item: any
    ) => {
      if (!item.product_id) {
        return accumulator;
      }

      accumulator[item.product_id] =
        (accumulator[
          item.product_id
        ] || 0) +
        Number(item.quantity || 0);

      return accumulator;
    },
    {}
  );

  const relatedProducts =
    sameCategoryProducts
      .sort(
        (a, b) =>
          (salesCount[b.id] || 0) -
          (salesCount[a.id] || 0)
      )
      .slice(0, 6);

  const normalGalleryImages = [
    product.image_url,

    ...extraImages.map(
      (image) => image.image_url
    ),
  ].filter(Boolean);

  const salePercent = Number(
    product.sale_percent || 0
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-4 py-8 pb-28 sm:px-6 sm:py-12 md:pb-12">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-8">
          <BackButton />
        </div>

        <ProductDetailsClient
          product={product}
          normalGalleryImages={
            normalGalleryImages as string[]
          }
          productVariants={
            productVariants
          }
          salePercent={salePercent}
        />
      </div>

      <ProductExtraClient
        product={product}
        relatedProducts={
          relatedProducts
        }
        reviews={reviews}
      />
    </main>
  );
}