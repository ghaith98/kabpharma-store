import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ProductExtraClient from "./ProductExtraClient";
import BackButton from "./BackButton";
import ProductDetailsClient from "./ProductDetailsClient";
import ShareProductButton from "./ShareProductButton";

const SITE_URL = "https://www.kabpharma.com";

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
    .select(`
      id,
      name,
      name_ar,
      name_en,
      description,
      description_ar,
      description_en,
      image_url
    `)
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return {
      title: "المنتج غير موجود",
      description: "المنتج المطلوب غير موجود.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  /*
    العربية هي اللغة الرئيسية للموقع،
    لذلك نستخدم الاسم والوصف العربي أولاً.
  */
  const productName =
    product.name_ar ||
    product.name_en ||
    product.name ||
    "منتج KAB Pharma";

  const productDescription =
    product.description_ar ||
    product.description_en ||
    product.description ||
    "اكتشف منتجات العناية بالبشرة والشعر والعناية الشخصية من KAB Pharma.";

  /*
    العنوان بدون KAB Pharma لأن Root Layout
    يضيفها تلقائياً من خلال title template.
  */
  const title = productName;

  /*
    عناوين المشاركة تحتاج الاسم كاملاً.
  */
  const socialTitle =
    `${productName} | KAB Pharma`;

  const description =
    cleanMetaDescription(productDescription);

  const productUrl =
    `${SITE_URL}/products/${product.id}`;

  const productImages = product.image_url
    ? [
        {
          url: product.image_url,
          alt: productName,
        },
      ]
    : undefined;

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
      locale: "ar_SY",
      alternateLocale: ["en_US"],
      title: socialTitle,
      description,
      images: productImages,
    },

    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: product.image_url
        ? [product.image_url]
        : undefined,
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  const { data: product, error: productError } =
    await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (productError) {
    console.error(
      "Failed to load product:",
      productError
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Product not found
        </h1>

        <a
          href="/products"
          className="mt-5 inline-flex rounded-2xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
        >
          Back to Products
        </a>
      </main>
    );
  }

  const [
    reviewsResult,
    extraImagesResult,
    variantsResult,
    sameCategoryProductsResult,
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
      .select("product_id, quantity"),
  ]);

  if (reviewsResult.error) {
    console.error(
      "Failed to load reviews:",
      reviewsResult.error
    );
  }

  if (extraImagesResult.error) {
    console.error(
      "Failed to load product images:",
      extraImagesResult.error
    );
  }

  if (variantsResult.error) {
    console.error(
      "Failed to load product variants:",
      variantsResult.error
    );
  }

  if (sameCategoryProductsResult.error) {
    console.error(
      "Failed to load related products:",
      sameCategoryProductsResult.error
    );
  }

  if (orderItemsResult.error) {
    console.error(
      "Failed to load product sales:",
      orderItemsResult.error
    );
  }

  const reviews =
    reviewsResult.data || [];

  const extraImages =
    extraImagesResult.data || [];

  const variants =
    variantsResult.data || [];

  const sameCategoryProducts =
    sameCategoryProductsResult.data || [];

  const allOrderItems =
    orderItemsResult.data || [];

  const variantIds = variants.map(
    (variant) => variant.id
  );

  let variantImages: any[] = [];

  if (variantIds.length > 0) {
    const { data, error } = await supabase
      .from("product_variant_images")
      .select("*")
      .in("variant_id", variantIds)
      .order("sort_order", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Failed to load variant images:",
        error
      );
    }

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
            (firstImage, secondImage) =>
              Number(
                firstImage.sort_order
              ) -
              Number(
                secondImage.sort_order
              )
          );

      return {
        ...variant,

        images:
          imagesForVariant.length > 0
            ? imagesForVariant.map(
                (image) => image.image_url
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
      item: {
        product_id: number | null;
        quantity: number | null;
      }
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
        (firstProduct, secondProduct) =>
          (salesCount[
            secondProduct.id
          ] || 0) -
          (salesCount[
            firstProduct.id
          ] || 0)
      )
      .slice(0, 6);

  const normalGalleryImages = [
    product.image_url,

    ...extraImages.map(
      (image) => image.image_url
    ),
  ].filter(
    (image): image is string =>
      Boolean(image)
  );

  const salePercent = Number(
    product.sale_percent || 0
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-green-50 px-4 py-8 pb-28 sm:px-6 sm:py-12 md:pb-12">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-5 shadow-sm sm:p-8">
        <div
          dir="ltr"
          className="mb-8 flex items-center justify-between gap-3"
        >
          <BackButton />

          <ShareProductButton
            productId={product.id}
            productNameAr={
              product.name_ar
            }
            productNameEn={
              product.name_en
            }
            fallbackName={
              product.name
            }
          />
        </div>

        <ProductDetailsClient
          product={product}
          normalGalleryImages={
            normalGalleryImages
          }
          productVariants={
            productVariants
          }
          salePercent={
            salePercent
          }
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