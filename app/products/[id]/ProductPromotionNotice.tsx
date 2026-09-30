"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";

type Promotion = { product_id: number; variant_id: number | null; type: "buy_2_get_1" | "buy_1_second_50"; name?: string | null };
// One shared request for every badge on the page. Refreshed after
// PROMOTIONS_TTL_MS so a long browsing session picks up new promotions
// without re-fetching for every card.
const PROMOTIONS_TTL_MS = 60_000;
let activePromotions: Promise<Promotion[]> | null = null;
let fetchedAt = 0;

export function getPromotions() {
  if (!activePromotions || Date.now() - fetchedAt > PROMOTIONS_TTL_MS) {
    fetchedAt = Date.now();
    activePromotions = fetch("/api/customer/promotions/active")
      .then((response) => response.json())
      .then((result) => result?.promotions || [])
      .catch(() => {
        fetchedAt = 0;
        return [];
      });
  }
  return activePromotions;
}

const shortLabel = (type: Promotion["type"], arabic: boolean) => type === "buy_2_get_1"
  ? "Buy 2+1 Free"
  : (arabic ? "اشتري 1، والثاني بنصف السعر" : "Buy 1, Get 1 50% Off");

export default function ProductPromotionNotice({ productId, variantId, hidden = false, summary = false }: { productId: number; variantId?: number | null; hidden?: boolean; summary?: boolean }) {
  const { lang } = useLanguage();
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    let mounted = true;
    void getPromotions().then((items) => {
      const productPromotions = items.filter((item) => Number(item.product_id) === productId);
      const match = summary
        ? productPromotions[0] || null
        : productPromotions.find((item) => item.variant_id == null ? variantId == null : Number(item.variant_id) === Number(variantId)) || null;
      if (mounted) setPromotion(match);
    });
    return () => { mounted = false; };
  }, [productId, summary, variantId]);

  if (!promotion || hidden) return null;
  const arabic = lang === "ar";
  if (summary) return <span className="inline-flex rounded-full border border-emerald-100 bg-white/95 px-2.5 py-1.5 text-[9px] font-extrabold text-[#0a583b] shadow-sm backdrop-blur sm:px-3 sm:text-[10px]">{shortLabel(promotion.type, arabic)}</span>;

  const title = promotion.type === "buy_2_get_1"
    ? "Buy 2+1 Free"
    : (arabic ? "اشتري 1، والثاني بنصف السعر" : "Buy 1, Get 1 50% Off");
  const detail = promotion.type === "buy_2_get_1"
    ? (arabic ? "أضيفي 3 من هذا الحجم إلى السلة — الثالث مجاناً." : "Add 3 of this size to your cart — the third is free.")
    : (arabic ? "أضيفي 2 من هذا الحجم إلى السلة — الثانية بنصف السعر." : "Add 2 of this size to your cart — the second is half price.");
  return <div className="mt-4 rounded-2xl border border-[#d8eadc] bg-[#f3faf4] px-4 py-3 text-right"><p className="text-sm font-extrabold text-[#0a583b]">{title}</p><p className="mt-1 text-xs leading-5 text-[#40614d]">{detail}</p></div>;
}
