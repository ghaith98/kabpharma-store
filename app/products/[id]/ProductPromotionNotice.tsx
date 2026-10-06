"use client";

import { useEffect, useState } from "react";

import {
  fromPublicPromotion,
  promotionCovers,
  promotionCoversProduct,
  promotionDescription,
  promotionLabel,
  promotionSpecificity,
  type PromotionRule,
  type PublicPromotion,
} from "@/lib/pricing/rules";

import { useLanguage } from "../../../context/LanguageContext";

/*
  The offer badge on product cards and the offer box on the product page.

  It only DESCRIBES the offer. What the customer actually pays is always
  calculated by the server (cart, checkout and payment pages).
*/

// One shared request for every badge on the page. Refreshed after
// PROMOTIONS_TTL_MS so a long browsing session picks up new promotions
// without re-fetching for every card.
const PROMOTIONS_TTL_MS = 60_000;
let activePromotions: Promise<PromotionRule[]> | null = null;
let fetchedAt = 0;

export function getPromotions() {
  if (!activePromotions || Date.now() - fetchedAt > PROMOTIONS_TTL_MS) {
    fetchedAt = Date.now();
    activePromotions = fetch("/api/customer/promotions/active")
      .then((response) => response.json())
      .then((result) =>
        (Array.isArray(result?.promotions)
          ? (result.promotions as PublicPromotion[])
          : []
        ).map(fromPublicPromotion)
      )
      .catch(() => {
        fetchedAt = 0;
        return [];
      });
  }
  return activePromotions;
}

type ProductRef = {
  productId: number;
  categoryId?: number | string | null;
  brandId?: number | string | null;
};

function toId(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** "Buy X get Y" and quantity offers only: sale prices have their own badge. */
function isItemOffer(rule: PromotionRule) {
  return rule.kind === "buy_x_get_y" || rule.kind === "quantity_discount";
}

/** Does any offer cover at least one size of this product? */
export function productHasOffer(
  promotions: PromotionRule[],
  product: ProductRef
) {
  const target = {
    productId: product.productId,
    categoryId: toId(product.categoryId),
    brandId: toId(product.brandId),
  };

  return promotions.some(
    (rule) => isItemOffer(rule) && promotionCoversProduct(rule, target)
  );
}

function pickOffer(
  promotions: PromotionRule[],
  product: ProductRef,
  /** undefined = any size of the product (cards). */
  variantId: number | null | undefined
) {
  const base = {
    productId: product.productId,
    categoryId: toId(product.categoryId),
    brandId: toId(product.brandId),
  };

  const matches = promotions.filter(
    (rule) =>
      isItemOffer(rule) &&
      (variantId === undefined
        ? promotionCoversProduct(rule, base)
        : promotionCovers(rule, { ...base, variantId }))
  );

  // The narrowest offer describes the product best.
  matches.sort(
    (first, second) =>
      promotionSpecificity(second) - promotionSpecificity(first) ||
      (first.id < second.id ? -1 : 1)
  );

  return matches[0] || null;
}

export default function ProductPromotionNotice({
  productId,
  categoryId,
  brandId,
  variantId,
  hidden = false,
  summary = false,
}: {
  productId: number;
  categoryId?: number | string | null;
  brandId?: number | string | null;
  variantId?: number | null;
  hidden?: boolean;
  summary?: boolean;
}) {
  const { lang } = useLanguage();
  const [promotion, setPromotion] = useState<PromotionRule | null>(null);

  useEffect(() => {
    let mounted = true;

    void getPromotions().then((items) => {
      const match = pickOffer(
        items,
        { productId, categoryId, brandId },
        summary ? undefined : variantId ?? null
      );

      if (mounted) setPromotion(match);
    });

    return () => {
      mounted = false;
    };
  }, [productId, categoryId, brandId, summary, variantId]);

  if (!promotion || hidden) return null;

  const language = lang === "ar" ? "ar" : "en";
  const label = promotionLabel(promotion, language);

  if (summary) {
    return (
      <span className="inline-flex rounded-full border border-emerald-100 bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold text-[#0a583b] shadow-sm backdrop-blur sm:px-3 sm:text-[10px]">
        {label}
      </span>
    );
  }

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className="mt-4 rounded-2xl border border-[#d8eadc] bg-[#f3faf4] px-4 py-3 text-start"
    >
      <p className="text-sm font-extrabold text-[#0a583b]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[#40614d]">
        {promotionDescription(promotion, language)}
      </p>
    </div>
  );
}
