import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import ProductExtraClient from "./ProductExtraClient";
import ProductDetailsClient from "./ProductDetailsClient";

const SITE_URL = "https://www.kabpharma.com";
const DEFAULT_SOCIAL_IMAGE =
  `${SITE_URL}/opengraph-image.jpg`;

export const revalidate = 60;

const getProduct = cache(async (id: string) =>
  supabase
    .from("products")
    .select(`
      *,
      categories (
        id,
        name,
        name_ar,
        name_en
      )
    `)
    .eq("id", id)
    .maybeSingle()
);

export async function generateStaticParams() {
  const { data } = await supabase
    .from("products")
    .select("id");

  return (data || []).map((product) => ({
    id: String(product.id),
  }));
}

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type VariantImageRecord = {
  variant_id: number | string;
  image_url: string;
  sort_order?: number | string | null;
};

function cleanMetaDescription(
  value: string,
  maxLength = 160
) {
  const cleaned = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned
    .slice(0, maxLength - 3)
    .trim()}...`;
}

function toAbsoluteUrl(url: string) {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${SITE_URL}${
    url.startsWith("/") ? url : `/${url}`
  }`;
}

function calculateFinalPrice(
  price: number,
  discountPercent: number
) {
  const safePrice = Number(price || 0);

  const safeDiscount = Math.min(
    100,
    Math.max(
      0,
      Number(discountPercent || 0)
    )
  );

  return Number(
    (
      safePrice *
      (1 - safeDiscount / 100)
    ).toFixed(2)
  );
}

function formatSchemaPrice(price: number) {
  if (Number.isInteger(price)) {
    return String(price);
  }

  return price
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

function getReviewRating(
  review: Record<string, unknown>
) {
  const value =
    review.rating ??
    review.stars ??
    review.rate;

  const rating = Number(value);

  if (
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return null;
  }

  return rating;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  const { data: product } = await getProduct(id);

  if (!product) {
    return {
      title: "المنتج غير موجود",

      description:
        "المنتج المطلوب غير موجود.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

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

  const title = productName;

  const socialTitle =
    `${productName} | KAB Pharma`;

  const description =
    cleanMetaDescription(
      productDescription
    );

  const productUrl =
    `${SITE_URL}/products/${product.id}`;

  const socialImage =
    product.image_url
      ? toAbsoluteUrl(
          product.image_url
        )
      : DEFAULT_SOCIAL_IMAGE;

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

      images: [
        {
          url: socialImage,
          alt: productName,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
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

  const {
    data: product,
    error: productError,
  } = await getProduct(id);

  if (productError) {
    console.error(
      "Failed to load product:",
      productError
    );
  }

  if (!product) {
    notFound();
  }

  const [
    reviewsResult,
    extraImagesResult,
    variantsResult,
    sameCategoryProductsResult,
  ] = await Promise.all([
    supabase
  .from("products")
  .select(`
    *,
    categories (
      id,
      name,
      name_ar,
      name_en
    ),
    product_variants (
      *
    )
  `)
  .eq(
    "category_id",
    product.category_id
  )
  .neq("id", product.id)
  .eq(
    "is_out_of_stock",
    false
  ),

    supabase
      .from("product_images")
      .select("*")
      .eq(
        "product_id",
        product.id
      )
      .order("sort_order", {
        ascending: true,
      }),

    supabase
      .from("product_variants")
      .select("*")
      .eq(
        "product_id",
        product.id
      )
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
      .eq(
        "is_out_of_stock",
        false
      ),

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

  if (
    sameCategoryProductsResult.error
  ) {
    console.error(
      "Failed to load related products:",
      sameCategoryProductsResult.error
    );
  }

  const reviews =
    reviewsResult.data || [];

  const extraImages =
    extraImagesResult.data || [];

  const variants =
    variantsResult.data || [];

  const sameCategoryProducts =
    sameCategoryProductsResult.data ||
    [];

  const variantIds = variants.map(
    (variant) => variant.id
  );

  let variantImages: VariantImageRecord[] = [];

  if (variantIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from(
        "product_variant_images"
      )
      .select("*")
      .in(
        "variant_id",
        variantIds
      )
      .order("sort_order", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Failed to load variant images:",
        error
      );
    }

    variantImages = (data || []) as VariantImageRecord[];
  }

  const productVariants =
    variants.map((variant) => {
      const imagesForVariant =
        variantImages
          .filter(
            (image) =>
              image.variant_id ===
              variant.id
          )
          .sort(
            (
              firstImage,
              secondImage
            ) =>
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
                (image) =>
                  image.image_url
              )
            : variant.image_url
            ? [variant.image_url]
            : [],
      };
    });

  const relatedProducts =
    sameCategoryProducts
      .sort(
        (
          firstProduct,
          secondProduct
        ) =>
          Number(secondProduct.featured || 0) -
            Number(firstProduct.featured || 0) ||
          Number(secondProduct.id) -
            Number(firstProduct.id)
      )
      .slice(0, 6);

  const normalGalleryImages = [
    product.image_url,

    ...extraImages.map(
      (image) => image.image_url
    ),
  ].filter(
    (
      image
    ): image is string =>
      Boolean(image)
  );

  const salePercent = Number(
    product.sale_percent || 0
  );

  /*
    Product JSON-LD
  */

  const schemaProductName =
    product.name_ar ||
    product.name_en ||
    product.name ||
    "منتج KAB Pharma";

  const schemaProductDescription =
    product.description_ar ||
    product.description_en ||
    product.description ||
    "منتج للعناية الشخصية من KAB Pharma.";

  const productUrl =
    `${SITE_URL}/products/${product.id}`;

  const schemaImages = Array.from(
    new Set(
      [
        ...normalGalleryImages,

        ...productVariants.flatMap(
          (variant) =>
            Array.isArray(
              variant.images
            )
              ? variant.images
              : []
        ),
      ]
        .filter(
          (
            image
          ): image is string =>
            Boolean(image)
        )
        .map(toAbsoluteUrl)
    )
  );

  const validRatings = reviews
    .map((review) =>
      getReviewRating(
        review as Record<
          string,
          unknown
        >
      )
    )
    .filter(
      (
        rating
      ): rating is number =>
        rating !== null
    );

  const averageRating =
    validRatings.length > 0
      ? validRatings.reduce(
          (total, rating) =>
            total + rating,
          0
        ) /
        validRatings.length
      : null;

  const createOffer = ({
    price,
    isOutOfStock,
    sku,
    name,
  }: {
    price: number;
    isOutOfStock: boolean;
    sku: string;
    name?: string;
  }) => ({
    "@type": "Offer",
    url: productUrl,

    priceCurrency: "SYP",

    price:
      formatSchemaPrice(price),

    availability: isOutOfStock
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock",

    itemCondition:
      "https://schema.org/NewCondition",

    sku,

    ...(name
      ? {
          name,
        }
      : {}),

    seller: {
      "@type": "Organization",
      name: "KAB Pharma",
      url: SITE_URL,
    },
  });

  const variantOffers:
    ReturnType<
      typeof createOffer
    >[] = [];

  productVariants.forEach(
    (variant) => {
      const variantPrice = Number(
        variant.price ??
          product.price ??
          0
      );

      const variantDiscount =
        Number(
          variant.sale_percent ??
            salePercent
        );

      const finalVariantPrice =
        calculateFinalPrice(
          variantPrice,
          variantDiscount
        );

      if (
        finalVariantPrice <= 0
      ) {
        return;
      }

      const variantName =
        variant.name_ar ||
        variant.name_en ||
        variant.name ||
        variant.label_ar ||
        variant.label_en ||
        variant.label ||
        variant.variant_label;

      const variantIsOutOfStock =
        typeof variant.is_out_of_stock ===
        "boolean"
          ? variant.is_out_of_stock
          : Boolean(
              product.is_out_of_stock
            );

      variantOffers.push(
        createOffer({
          price:
            finalVariantPrice,

          isOutOfStock:
            variantIsOutOfStock,

          sku:
            `${product.id}-${variant.id}`,

          name: variantName
            ? `${schemaProductName} - ${variantName}`
            : undefined,
        })
      );
    }
  );

  const baseProductPrice =
    calculateFinalPrice(
      Number(
        product.price || 0
      ),
      salePercent
    );

  let productOffers:
    | Record<string, unknown>
    | undefined;

  if (
    variantOffers.length === 1
  ) {
    productOffers =
      variantOffers[0];
  } else if (
    variantOffers.length > 1
  ) {
    const variantPrices =
      variantOffers.map(
        (offer) =>
          Number(offer.price)
      );

    const hasAvailableVariant =
      variantOffers.some(
        (offer) =>
          offer.availability ===
          "https://schema.org/InStock"
      );

    productOffers = {
      "@type":
        "AggregateOffer",

      url: productUrl,

      priceCurrency: "SYP",

      lowPrice:
        formatSchemaPrice(
          Math.min(
            ...variantPrices
          )
        ),

      highPrice:
        formatSchemaPrice(
          Math.max(
            ...variantPrices
          )
        ),

      offerCount:
        variantOffers.length,

      availability:
        hasAvailableVariant
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",

      offers:
        variantOffers,

      seller: {
        "@type":
          "Organization",

        name:
          "KAB Pharma",

        url:
          SITE_URL,
      },
    };
  } else if (
    baseProductPrice > 0
  ) {
    productOffers =
      createOffer({
        price:
          baseProductPrice,

        isOutOfStock:
          Boolean(
            product.is_out_of_stock
          ),

        sku:
          String(product.id),
      });
  }

  const productJsonLd = {
    "@context":
      "https://schema.org",

    "@type": "Product",

    "@id":
      `${productUrl}#product`,

    url:
      productUrl,

    name:
      schemaProductName,

    description:
      cleanMetaDescription(
        schemaProductDescription,
        5000
      ),

    sku:
      String(product.id),

    brand: {
      "@type": "Brand",
      name: "KAB Pharma",
    },

    ...(schemaImages.length > 0
      ? {
          image:
            schemaImages,
        }
      : {}),

    ...(productOffers
      ? {
          offers:
            productOffers,
        }
      : {}),

    ...(averageRating !== null
      ? {
          aggregateRating: {
            "@type":
              "AggregateRating",

            ratingValue:
              Number(
                averageRating.toFixed(
                  1
                )
              ),

            reviewCount:
              validRatings.length,

            ratingCount:
              validRatings.length,

            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
  <main className="min-h-screen bg-white px-4 pb-20 pt-0 sm:px-6 sm:pb-20 sm:pt-6 lg:px-8">
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          productJsonLd
        ).replace(/</g, "\\u003c"),
      }}
    />

    <div className="mx-auto max-w-[1400px]">

      <ProductDetailsClient
        product={product}
        normalGalleryImages={
          normalGalleryImages
        }
        productVariants={productVariants}
        salePercent={salePercent}
      />

      <ProductExtraClient
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviews}
      />
    </div>
  </main>
);
}
